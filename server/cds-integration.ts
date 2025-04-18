import { db } from "./db";
import { eq, and, or, desc } from "drizzle-orm";
import { 
  contentPipelines, 
  contentPipelineRuns, 
  contentPipelineStages, 
  contentPipelineJobs,
  pipelineRunStatusEnum,
  pipelineStageStatusEnum,
  pipelineJobStatusEnum,
  pipelineJobTypeEnum,
  ContentPipelineRun,
  ContentPipelineStage,
  ContentPipelineJob
} from "@shared/schema";
import { huginnAgentService } from "./huginn-agents";

/**
 * ContentPipelineService is a service that manages content pipelines.
 * It provides methods to run pipelines, create stages and jobs, and track their status.
 * 
 * This service is inspired by modern CI/CD systems and works with the Huginn agent system
 * to automate content creation, refinement, and publishing workflows.
 */
class ContentPipelineService {
  /**
   * Run a pipeline with provided parameters
   * 
   * @param pipelineId The ID of the pipeline to run
   * @param params Additional parameters for the pipeline run
   * @returns The pipeline run object
   */
  async runPipeline(pipelineId: number, params: Record<string, any> = {}): Promise<ContentPipelineRun> {
    // Fetch the pipeline configuration
    const [pipeline] = await db.select()
      .from(contentPipelines)
      .where(eq(contentPipelines.id, pipelineId));
    
    if (!pipeline) {
      throw new Error(`Pipeline with ID ${pipelineId} not found`);
    }

    // Create a pipeline run
    const [pipelineRun] = await db.insert(contentPipelineRuns)
      .values({
        pipelineId,
        status: 'running',
        params,
        startTime: new Date(),
      })
      .returning();

    // Parse the pipeline configuration and create stages
    try {
      const config = pipeline.configuration as any;
      
      if (!config.stages || !Array.isArray(config.stages) || config.stages.length === 0) {
        throw new Error('Pipeline configuration must have at least one stage');
      }
      
      // Create pipeline stages based on the configuration
      for (const stageConfig of config.stages) {
        await this.createStage(pipelineRun.id, stageConfig);
      }
      
      // Start the first stage
      await this.executeNextStage(pipelineRun.id);
      
      return pipelineRun;
    } catch (error) {
      // If there was an error setting up the pipeline, mark it as failed
      await db.update(contentPipelineRuns)
        .set({
          status: 'failed',
          errorMessage: error instanceof Error ? error.message : String(error),
          endTime: new Date(),
        })
        .where(eq(contentPipelineRuns.id, pipelineRun.id));
      
      throw error;
    }
  }

  /**
   * Create a stage for a pipeline run
   * 
   * @param pipelineRunId The ID of the pipeline run
   * @param stageConfig The configuration for the stage
   * @returns The created stage
   */
  private async createStage(pipelineRunId: number, stageConfig: any): Promise<ContentPipelineStage> {
    if (!stageConfig.name) {
      throw new Error('Stage configuration must have a name');
    }
    
    // Create the stage
    const [stage] = await db.insert(contentPipelineStages)
      .values({
        pipelineRunId,
        name: stageConfig.name,
        status: 'running', // Will be set to 'running' when it's this stage's turn
        startTime: new Date(), // Will be updated when the stage starts
      })
      .returning();
    
    // Create jobs for the stage
    if (stageConfig.jobs && Array.isArray(stageConfig.jobs)) {
      for (const jobConfig of stageConfig.jobs) {
        await this.createJob(stage.id, jobConfig);
      }
    }
    
    return stage;
  }

  /**
   * Create a job for a stage
   * 
   * @param stageId The ID of the stage
   * @param jobConfig The configuration for the job
   * @returns The created job
   */
  private async createJob(stageId: number, jobConfig: any): Promise<ContentPipelineJob> {
    if (!jobConfig.name || !jobConfig.type) {
      throw new Error('Job configuration must have a name and type');
    }
    
    // Validate job type
    if (!Object.values(pipelineJobTypeEnum.enumValues).includes(jobConfig.type)) {
      throw new Error(`Invalid job type: ${jobConfig.type}`);
    }
    
    // Create the job
    const [job] = await db.insert(contentPipelineJobs)
      .values({
        stageRunId: stageId,
        name: jobConfig.name,
        type: jobConfig.type as typeof pipelineJobTypeEnum.enumValues[number],
        status: 'running', // Will be set to 'running' when it's this job's turn
        startTime: new Date(), // Will be updated when the job starts
      })
      .returning();
    
    return job;
  }

  /**
   * Execute the next stage in a pipeline run
   * 
   * @param pipelineRunId The ID of the pipeline run
   * @returns True if a stage was executed, false if all stages are complete
   */
  async executeNextStage(pipelineRunId: number): Promise<boolean> {
    // Get all stages for this pipeline run
    const stages = await db.select()
      .from(contentPipelineStages)
      .where(eq(contentPipelineStages.pipelineRunId, pipelineRunId))
      .orderBy(contentPipelineStages.id);
    
    // Find the first stage that isn't complete
    const pendingStage = stages.find(stage => 
      stage.status !== 'success' && stage.status !== 'failed' && stage.status !== 'cancelled'
    );
    
    if (!pendingStage) {
      // All stages are complete, update the pipeline run status
      const failedStage = stages.find(stage => stage.status === 'failed');
      
      await db.update(contentPipelineRuns)
        .set({
          status: failedStage ? 'failed' : 'success',
          endTime: new Date(),
        })
        .where(eq(contentPipelineRuns.id, pipelineRunId));
      
      return false;
    }
    
    // Update the stage status to running
    await db.update(contentPipelineStages)
      .set({
        status: 'running',
        startTime: new Date(),
      })
      .where(eq(contentPipelineStages.id, pendingStage.id));
    
    // Execute the jobs for this stage
    try {
      await this.executeStageJobs(pendingStage.id);
      
      // Mark the stage as successful
      await db.update(contentPipelineStages)
        .set({
          status: 'success',
          endTime: new Date(),
        })
        .where(eq(contentPipelineStages.id, pendingStage.id));
      
      // Move to the next stage
      return await this.executeNextStage(pipelineRunId);
    } catch (error) {
      // If there was an error executing the stage, mark it as failed
      await db.update(contentPipelineStages)
        .set({
          status: 'failed',
          errorMessage: error instanceof Error ? error.message : String(error),
          endTime: new Date(),
        })
        .where(eq(contentPipelineStages.id, pendingStage.id));
      
      // Mark the pipeline run as failed
      await db.update(contentPipelineRuns)
        .set({
          status: 'failed',
          errorMessage: `Stage ${pendingStage.name} failed: ${error instanceof Error ? error.message : String(error)}`,
          endTime: new Date(),
        })
        .where(eq(contentPipelineRuns.id, pipelineRunId));
      
      return false;
    }
  }

  /**
   * Execute all jobs for a stage
   * 
   * @param stageId The ID of the stage
   */
  private async executeStageJobs(stageId: number): Promise<void> {
    // Get all jobs for this stage
    const jobs = await db.select()
      .from(contentPipelineJobs)
      .where(eq(contentPipelineJobs.stageRunId, stageId))
      .orderBy(contentPipelineJobs.id);
    
    // Execute each job
    for (const job of jobs) {
      try {
        // Update job to running status
        await db.update(contentPipelineJobs)
          .set({
            status: 'running',
            startTime: new Date(),
          })
          .where(eq(contentPipelineJobs.id, job.id));
        
        // Execute the job based on its type
        const result = await this.executeJob(job);
        
        // Update job with result
        await db.update(contentPipelineJobs)
          .set({
            status: 'success',
            result,
            endTime: new Date(),
          })
          .where(eq(contentPipelineJobs.id, job.id));
      } catch (error) {
        // If there was an error executing the job, mark it as failed
        await db.update(contentPipelineJobs)
          .set({
            status: 'failed',
            errorMessage: error instanceof Error ? error.message : String(error),
            endTime: new Date(),
          })
          .where(eq(contentPipelineJobs.id, job.id));
        
        // Throw error to fail the stage
        throw error;
      }
    }
  }

  /**
   * Execute a specific job
   * 
   * @param job The job to execute
   * @returns The result of the job execution
   */
  private async executeJob(job: ContentPipelineJob): Promise<Record<string, any>> {
    // Execute different job types
    switch (job.type) {
      case 'huginn_agent':
        return this.executeHuginnAgentJob(job);
      case 'content_generation':
        return this.executeContentGenerationJob(job);
      case 'content_publishing':
        return this.executeContentPublishingJob(job);
      case 'data_transformation':
        return this.executeDataTransformationJob(job);
      default:
        throw new Error(`Unsupported job type: ${job.type}`);
    }
  }

  /**
   * Execute a Huginn agent job
   * 
   * @param job The job to execute
   * @returns The result of the job execution
   */
  private async executeHuginnAgentJob(job: ContentPipelineJob): Promise<Record<string, any>> {
    // For now, just simulate success
    // In a real implementation, this would call the Huginn agent service
    console.log(`Executing Huginn agent job: ${job.name}`);
    
    // Return dummy result
    return {
      success: true,
      message: `Huginn agent job ${job.name} executed successfully`,
    };
  }

  /**
   * Execute a content generation job
   * 
   * @param job The job to execute
   * @returns The result of the job execution
   */
  private async executeContentGenerationJob(job: ContentPipelineJob): Promise<Record<string, any>> {
    // For now, just simulate success
    // In a real implementation, this would call the content generation service
    console.log(`Executing content generation job: ${job.name}`);
    
    // Return dummy result
    return {
      success: true,
      message: `Content generation job ${job.name} executed successfully`,
    };
  }

  /**
   * Execute a content publishing job
   * 
   * @param job The job to execute
   * @returns The result of the job execution
   */
  private async executeContentPublishingJob(job: ContentPipelineJob): Promise<Record<string, any>> {
    // For now, just simulate success
    // In a real implementation, this would call the content publishing service
    console.log(`Executing content publishing job: ${job.name}`);
    
    // Return dummy result
    return {
      success: true,
      message: `Content publishing job ${job.name} executed successfully`,
    };
  }

  /**
   * Execute a data transformation job
   * 
   * @param job The job to execute
   * @returns The result of the job execution
   */
  private async executeDataTransformationJob(job: ContentPipelineJob): Promise<Record<string, any>> {
    // For now, just simulate success
    // In a real implementation, this would implement data transformations
    console.log(`Executing data transformation job: ${job.name}`);
    
    // Return dummy result
    return {
      success: true,
      message: `Data transformation job ${job.name} executed successfully`,
    };
  }

  /**
   * Schedule recurring pipelines based on their configuration
   * This should be called regularly by a scheduler
   */
  async scheduleRecurringPipelines(): Promise<void> {
    // Find all active pipelines that are configured for automation
    const automatedPipelines = await db.select()
      .from(contentPipelines)
      .where(and(
        eq(contentPipelines.status, 'active'),
        eq(contentPipelines.automated, true),
      ));
    
    // For each automated pipeline, check if it needs to be run
    for (const pipeline of automatedPipelines) {
      if (!pipeline.schedule) continue;
      
      try {
        // Check if the pipeline is due to run
        // This is a simplified check - in a real system, you would parse the cron expression
        const shouldRun = this.shouldRunPipeline(pipeline.id, pipeline.schedule);
        
        if (shouldRun) {
          // Run the pipeline
          await this.runPipeline(pipeline.id);
        }
      } catch (error) {
        console.error(`Error scheduling pipeline ${pipeline.id}:`, error);
      }
    }
  }

  /**
   * Determine if a pipeline should be run based on its schedule
   * This is a simplified implementation - a real system would parse cron expressions
   * 
   * @param pipelineId The ID of the pipeline
   * @param schedule The schedule (as a cron expression or similar)
   * @returns True if the pipeline should be run
   */
  private async shouldRunPipeline(pipelineId: number, schedule: string): Promise<boolean> {
    // Get the most recent run of this pipeline
    const [lastRun] = await db.select()
      .from(contentPipelineRuns)
      .where(eq(contentPipelineRuns.pipelineId, pipelineId))
      .orderBy(desc(contentPipelineRuns.createdAt))
      .limit(1);
    
    if (!lastRun) return true; // If no previous runs, definitely run
    
    // Simple daily schedule check (for "daily" schedule)
    if (schedule === 'daily') {
      const lastRunDate = new Date(lastRun.createdAt);
      const today = new Date();
      
      return lastRunDate.getDate() !== today.getDate() ||
             lastRunDate.getMonth() !== today.getMonth() ||
             lastRunDate.getFullYear() !== today.getFullYear();
    }
    
    // For hourly schedule
    if (schedule === 'hourly') {
      const lastRunTime = new Date(lastRun.createdAt).getTime();
      const hourAgo = Date.now() - (60 * 60 * 1000);
      
      return lastRunTime < hourAgo;
    }
    
    // For weekly schedule
    if (schedule === 'weekly') {
      const lastRunTime = new Date(lastRun.createdAt).getTime();
      const weekAgo = Date.now() - (7 * 24 * 60 * 60 * 1000);
      
      return lastRunTime < weekAgo;
    }
    
    // Default to not running if schedule type is unknown
    return false;
  }
}

// Export a singleton instance of the service
export const contentPipelineService = new ContentPipelineService();