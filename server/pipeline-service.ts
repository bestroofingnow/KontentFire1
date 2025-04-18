import { db } from './db';
import {
  contentPipelines,
  contentPipelineRuns,
  contentPipelineJobs,
  pipelineRunStatusEnum,
  pipelineJobStatusEnum,
  ContentPipeline,
  ContentPipelineRun,
  ContentPipelineJob,
  PipelineStageDefinition,
  PipelineStageResult,
  InsertContentPipeline,
  InsertContentPipelineRun,
  InsertContentPipelineJob,
} from '@shared/schema';
import { eq, and, desc, asc } from 'drizzle-orm';
import OpenAI from 'openai';
import Anthropic from '@anthropic-ai/sdk';
import axios from 'axios';

// Initialize OpenAI client
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// Initialize Anthropic client
const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

/**
 * Pipeline Service
 * 
 * Manages content pipeline creation, execution, and monitoring
 */
class PipelineService {
  private static instance: PipelineService;

  /**
   * Get the singleton instance
   */
  public static getInstance(): PipelineService {
    if (!PipelineService.instance) {
      PipelineService.instance = new PipelineService();
    }
    return PipelineService.instance;
  }

  /**
   * Create a new content pipeline
   */
  public async createPipeline(data: InsertContentPipeline): Promise<ContentPipeline> {
    try {
      const [pipeline] = await db.insert(contentPipelines).values(data).returning();
      return pipeline;
    } catch (error) {
      console.error('Error creating pipeline:', error);
      throw new Error(`Error creating pipeline: ${error.message}`);
    }
  }

  /**
   * Get a pipeline by ID
   */
  public async getPipeline(id: number): Promise<ContentPipeline | undefined> {
    const [pipeline] = await db.select().from(contentPipelines).where(eq(contentPipelines.id, id));
    return pipeline;
  }

  /**
   * Get all pipelines for a user
   */
  public async getUserPipelines(userId: number): Promise<ContentPipeline[]> {
    return db.select().from(contentPipelines).where(eq(contentPipelines.userId, userId));
  }

  /**
   * Update a pipeline
   */
  public async updatePipeline(id: number, data: Partial<ContentPipeline>): Promise<ContentPipeline | undefined> {
    const [pipeline] = await db
      .update(contentPipelines)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(contentPipelines.id, id))
      .returning();
    return pipeline;
  }

  /**
   * Delete a pipeline
   */
  public async deletePipeline(id: number): Promise<boolean> {
    const result = await db.delete(contentPipelines).where(eq(contentPipelines.id, id));
    return result.rowCount > 0;
  }

  /**
   * Start a pipeline run
   */
  public async startPipelineRun(pipelineId: number, contentId?: number, metadata?: any): Promise<ContentPipelineRun> {
    // Get the pipeline
    const pipeline = await this.getPipeline(pipelineId);
    if (!pipeline) {
      throw new Error(`Pipeline with ID ${pipelineId} not found`);
    }

    // Create a new run
    const [run] = await db
      .insert(contentPipelineRuns)
      .values({
        pipelineId,
        contentId,
        status: 'pending',
        currentStage: 0,
        results: {},
        metadata,
      })
      .returning();

    // Start the pipeline execution in the background
    this.executePipelineRun(run.id).catch(error => {
      console.error(`Error executing pipeline run ${run.id}:`, error);
    });

    return run;
  }

  /**
   * Get a pipeline run by ID
   */
  public async getPipelineRun(id: number): Promise<ContentPipelineRun | undefined> {
    const [run] = await db.select().from(contentPipelineRuns).where(eq(contentPipelineRuns.id, id));
    return run;
  }

  /**
   * Get all runs for a pipeline
   */
  public async getPipelineRuns(pipelineId: number): Promise<ContentPipelineRun[]> {
    return db
      .select()
      .from(contentPipelineRuns)
      .where(eq(contentPipelineRuns.pipelineId, pipelineId))
      .orderBy(desc(contentPipelineRuns.startedAt));
  }

  /**
   * Get all pipeline jobs for a run
   */
  public async getPipelineJobs(runId: number): Promise<ContentPipelineJob[]> {
    return db
      .select()
      .from(contentPipelineJobs)
      .where(eq(contentPipelineJobs.runId, runId))
      .orderBy(asc(contentPipelineJobs.stage));
  }

  /**
   * Execute a pipeline run
   * This is the main method that processes a pipeline run from start to finish
   */
  private async executePipelineRun(runId: number): Promise<void> {
    // Get the run
    const run = await this.getPipelineRun(runId);
    if (!run) {
      throw new Error(`Pipeline run with ID ${runId} not found`);
    }

    // Get the pipeline
    const pipeline = await this.getPipeline(run.pipelineId);
    if (!pipeline) {
      throw new Error(`Pipeline with ID ${run.pipelineId} not found`);
    }

    try {
      // Update run status to running
      await db
        .update(contentPipelineRuns)
        .set({ status: 'running' })
        .where(eq(contentPipelineRuns.id, runId));

      // Process each stage
      const stages = pipeline.stages as PipelineStageDefinition[];
      const results: Record<string, PipelineStageResult> = {};

      for (let i = 0; i < stages.length; i++) {
        const stage = stages[i];
        
        // Update current stage
        await db
          .update(contentPipelineRuns)
          .set({ currentStage: i })
          .where(eq(contentPipelineRuns.id, runId));

        // Check if stage should be executed based on dependencies
        if (stage.dependsOn && stage.dependsOn.length > 0) {
          const dependenciesMet = stage.dependsOn.every(dependencyId => {
            const dependency = results[dependencyId];
            return dependency && dependency.status === 'completed';
          });

          if (!dependenciesMet) {
            results[stage.id] = {
              stageId: stage.id,
              status: 'skipped',
              error: 'Dependencies not met',
            };
            continue;
          }
        }

        // Execute the stage
        try {
          const stageResult = await this.executeStage(run, stage, results);
          results[stage.id] = stageResult;

          // Update run results
          await db
            .update(contentPipelineRuns)
            .set({ results })
            .where(eq(contentPipelineRuns.id, runId));

          // If stage failed, stop pipeline execution
          if (stageResult.status === 'failed') {
            await db
              .update(contentPipelineRuns)
              .set({ 
                status: 'failed', 
                error: `Stage ${stage.name} failed: ${stageResult.error}`,
                completedAt: new Date()
              })
              .where(eq(contentPipelineRuns.id, runId));
            return;
          }
        } catch (error) {
          console.error(`Error executing stage ${stage.id}:`, error);
          results[stage.id] = {
            stageId: stage.id,
            status: 'failed',
            error: error.message,
          };

          // Update run status to failed
          await db
            .update(contentPipelineRuns)
            .set({ 
              status: 'failed', 
              results,
              error: `Stage ${stage.name} failed: ${error.message}`,
              completedAt: new Date()
            })
            .where(eq(contentPipelineRuns.id, runId));
          return;
        }
      }

      // All stages completed successfully
      await db
        .update(contentPipelineRuns)
        .set({ 
          status: 'completed', 
          results,
          completedAt: new Date()
        })
        .where(eq(contentPipelineRuns.id, runId));

    } catch (error) {
      console.error(`Error executing pipeline run ${runId}:`, error);
      await db
        .update(contentPipelineRuns)
        .set({ 
          status: 'failed', 
          error: error.message,
          completedAt: new Date()
        })
        .where(eq(contentPipelineRuns.id, runId));
    }
  }

  /**
   * Execute a single stage of a pipeline
   */
  private async executeStage(
    run: ContentPipelineRun,
    stage: PipelineStageDefinition,
    previousResults: Record<string, PipelineStageResult>
  ): Promise<PipelineStageResult> {
    console.log(`Executing stage ${stage.id} (${stage.type})`);

    const stageResult: PipelineStageResult = {
      stageId: stage.id,
      status: 'running',
      startedAt: new Date().toISOString(),
    };

    try {
      // Create a job record
      const [job] = await db
        .insert(contentPipelineJobs)
        .values({
          runId: run.id,
          stage: parseInt(stage.id),
          type: stage.type,
          status: 'running',
          config: stage.config,
          startedAt: new Date(),
        })
        .returning();

      // Execute the job based on its type
      let result;
      switch (stage.type) {
        case 'openai':
          result = await this.executeOpenAIJob(job, run, previousResults);
          break;
        case 'anthropic':
          result = await this.executeAnthropicJob(job, run, previousResults);
          break;
        case 'perplexity':
          result = await this.executePerplexityJob(job, run, previousResults);
          break;
        case 'distribution':
          result = await this.executeDistributionJob(job, run, previousResults);
          break;
        default:
          throw new Error(`Unsupported job type: ${stage.type}`);
      }

      // Update the job with the result
      await db
        .update(contentPipelineJobs)
        .set({
          status: 'completed',
          result,
          completedAt: new Date(),
        })
        .where(eq(contentPipelineJobs.id, job.id));

      // Update the stage result
      stageResult.status = 'completed';
      stageResult.completedAt = new Date().toISOString();
      stageResult.output = result;

      return stageResult;
    } catch (error) {
      console.error(`Error executing stage ${stage.id}:`, error);
      stageResult.status = 'failed';
      stageResult.completedAt = new Date().toISOString();
      stageResult.error = error.message;
      return stageResult;
    }
  }

  /**
   * Execute an OpenAI job
   */
  private async executeOpenAIJob(
    job: ContentPipelineJob,
    run: ContentPipelineRun,
    previousResults: Record<string, PipelineStageResult>
  ): Promise<any> {
    const config = job.config as any;
    
    // Prepare the prompt with variables from previous stages
    const prompt = this.replaceVariables(config.prompt, run, previousResults);
    
    // Execute the OpenAI API call
    const response = await openai.chat.completions.create({
      model: config.model || "gpt-4o",
      messages: [
        { role: "system", content: config.system || "You are a helpful assistant." },
        { role: "user", content: prompt }
      ],
      temperature: config.temperature || 0.7,
      max_tokens: config.maxTokens || 1000,
    });

    return {
      content: response.choices[0].message.content,
      model: response.model,
      usage: response.usage,
    };
  }

  /**
   * Execute an Anthropic job
   */
  private async executeAnthropicJob(
    job: ContentPipelineJob,
    run: ContentPipelineRun,
    previousResults: Record<string, PipelineStageResult>
  ): Promise<any> {
    const config = job.config as any;
    
    // Prepare the prompt with variables from previous stages
    const prompt = this.replaceVariables(config.prompt, run, previousResults);
    
    // Execute the Anthropic API call
    const response = await anthropic.messages.create({
      model: config.model || "claude-3-7-sonnet-20250219",
      system: config.system,
      messages: [
        { role: "user", content: prompt }
      ],
      max_tokens: config.maxTokens || 1000,
      temperature: config.temperature || 0.7,
    });

    return {
      content: response.content[0].text,
      model: response.model,
    };
  }

  /**
   * Execute a Perplexity job
   */
  private async executePerplexityJob(
    job: ContentPipelineJob,
    run: ContentPipelineRun,
    previousResults: Record<string, PipelineStageResult>
  ): Promise<any> {
    const config = job.config as any;
    
    // Prepare the prompt with variables from previous stages
    const prompt = this.replaceVariables(config.prompt, run, previousResults);
    
    // Execute the Perplexity API call
    const response = await axios.post(
      'https://api.perplexity.ai/chat/completions',
      {
        model: config.model || "llama-3.1-sonar-small-128k-online",
        messages: [
          { role: "system", content: config.system || "Be precise and concise." },
          { role: "user", content: prompt }
        ],
        max_tokens: config.maxTokens || 1000,
        temperature: config.temperature || 0.2,
        search_recency_filter: config.recencyFilter || "month",
        return_images: false,
        return_related_questions: false,
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.PERPLEXITY_API_KEY}`,
          'Content-Type': 'application/json',
        },
      }
    );

    return {
      content: response.data.choices[0].message.content,
      model: response.data.model,
      citations: response.data.citations,
    };
  }

  /**
   * Execute a distribution job
   */
  private async executeDistributionJob(
    job: ContentPipelineJob,
    run: ContentPipelineRun,
    previousResults: Record<string, PipelineStageResult>
  ): Promise<any> {
    const config = job.config as any;
    
    // This is a placeholder implementation
    // In a real implementation, this would publish content to various platforms
    
    console.log(`Distribution job executed for run ${run.id}`);
    console.log(`Target platforms: ${config.platforms.join(', ')}`);
    
    return {
      success: true,
      platforms: config.platforms,
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Replace variables in a string with values from previous stages
   * Supports the format {{stage.stageId.path.to.value}}
   */
  private replaceVariables(
    text: string,
    run: ContentPipelineRun,
    previousResults: Record<string, PipelineStageResult>
  ): string {
    const variableRegex = /{{([\w\.]+)}}/g;
    
    return text.replace(variableRegex, (match, path) => {
      const parts = path.split('.');
      
      if (parts[0] === 'stage') {
        const stageId = parts[1];
        const stageResult = previousResults[stageId];
        
        if (!stageResult) {
          return match; // Keep the original if stage not found
        }
        
        let value = stageResult;
        for (let i = 2; i < parts.length; i++) {
          if (value === undefined) {
            return match;
          }
          value = value[parts[i]];
        }
        
        return value !== undefined ? String(value) : match;
      }
      
      return match; // Keep the original for unknown variables
    });
  }

  /**
   * Cancel a pipeline run
   */
  public async cancelPipelineRun(runId: number): Promise<boolean> {
    const [run] = await db
      .update(contentPipelineRuns)
      .set({ 
        status: 'cancelled',
        completedAt: new Date()
      })
      .where(and(
        eq(contentPipelineRuns.id, runId),
        eq(contentPipelineRuns.status, 'running')
      ))
      .returning();
    
    if (!run) {
      return false;
    }
    
    // Cancel any running jobs
    await db
      .update(contentPipelineJobs)
      .set({
        status: 'cancelled',
        completedAt: new Date()
      })
      .where(and(
        eq(contentPipelineJobs.runId, runId),
        eq(contentPipelineJobs.status, 'running')
      ));
    
    return true;
  }
}

export const pipelineService = PipelineService.getInstance();