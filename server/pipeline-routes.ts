import { Express, Request, Response } from 'express';
import { z } from 'zod';
import { pipelineService } from './pipeline-service';
import { 
  insertContentPipelineSchema, 
  InsertContentPipeline,
  insertContentPipelineRunSchema,
  InsertContentPipelineRun,
  contentPipelines,
} from '@shared/schema';
import { db } from './db';
import { eq } from 'drizzle-orm';

// Extended schema with custom validations
const createPipelineSchema = insertContentPipelineSchema.extend({
  name: z.string().min(3).max(100),
  stages: z.array(z.object({
    id: z.string(),
    name: z.string(),
    type: z.string(),
    config: z.record(z.any()),
    dependsOn: z.array(z.string()).optional(),
    condition: z.string().optional(),
  })).min(1),
});

// Create content pipeline run schema
const createPipelineRunSchema = z.object({
  contentId: z.number().optional(),
  metadata: z.record(z.any()).optional(),
});

// Update pipeline schema
const updatePipelineSchema = createPipelineSchema.partial();

/**
 * Register pipeline API routes
 */
export function registerPipelineRoutes(app: Express) {
  /**
   * Get all pipelines for the authenticated user
   */
  app.get('/api/pipelines', async (req: Request, res: Response) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: 'Unauthorized' });
      }

      const pipelines = await pipelineService.getUserPipelines(req.user.id);
      res.json(pipelines);
    } catch (error) {
      console.error('Error getting pipelines:', error);
      res.status(500).json({ message: error.message });
    }
  });

  /**
   * Get a pipeline by ID
   */
  app.get('/api/pipelines/:id', async (req: Request, res: Response) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: 'Unauthorized' });
      }

      const pipelineId = parseInt(req.params.id);
      if (isNaN(pipelineId)) {
        return res.status(400).json({ message: 'Invalid pipeline ID' });
      }

      const pipeline = await pipelineService.getPipeline(pipelineId);
      
      if (!pipeline) {
        return res.status(404).json({ message: 'Pipeline not found' });
      }

      if (pipeline.userId !== req.user.id) {
        return res.status(403).json({ message: 'Forbidden' });
      }

      res.json(pipeline);
    } catch (error) {
      console.error('Error getting pipeline:', error);
      res.status(500).json({ message: error.message });
    }
  });

  /**
   * Create a new pipeline
   */
  app.post('/api/pipelines', async (req: Request, res: Response) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: 'Unauthorized' });
      }

      // Validate the request body
      const validation = createPipelineSchema.safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({ 
          message: 'Invalid pipeline data', 
          errors: validation.error.format() 
        });
      }

      // Create the pipeline
      const pipelineData: InsertContentPipeline = {
        ...validation.data,
        userId: req.user.id,
      };

      const pipeline = await pipelineService.createPipeline(pipelineData);
      res.status(201).json(pipeline);
    } catch (error) {
      console.error('Error creating pipeline:', error);
      res.status(500).json({ message: error.message });
    }
  });

  /**
   * Update a pipeline
   */
  app.put('/api/pipelines/:id', async (req: Request, res: Response) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: 'Unauthorized' });
      }

      const pipelineId = parseInt(req.params.id);
      if (isNaN(pipelineId)) {
        return res.status(400).json({ message: 'Invalid pipeline ID' });
      }

      // Check if the pipeline exists and belongs to the user
      const pipeline = await pipelineService.getPipeline(pipelineId);
      if (!pipeline) {
        return res.status(404).json({ message: 'Pipeline not found' });
      }

      if (pipeline.userId !== req.user.id) {
        return res.status(403).json({ message: 'Forbidden' });
      }

      // Validate the request body
      const validation = updatePipelineSchema.safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({ 
          message: 'Invalid pipeline data', 
          errors: validation.error.format() 
        });
      }

      // Update the pipeline
      const updatedPipeline = await pipelineService.updatePipeline(pipelineId, validation.data);
      if (!updatedPipeline) {
        return res.status(404).json({ message: 'Pipeline not found' });
      }

      res.json(updatedPipeline);
    } catch (error) {
      console.error('Error updating pipeline:', error);
      res.status(500).json({ message: error.message });
    }
  });

  /**
   * Delete a pipeline
   */
  app.delete('/api/pipelines/:id', async (req: Request, res: Response) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: 'Unauthorized' });
      }

      const pipelineId = parseInt(req.params.id);
      if (isNaN(pipelineId)) {
        return res.status(400).json({ message: 'Invalid pipeline ID' });
      }

      // Check if the pipeline exists and belongs to the user
      const pipeline = await pipelineService.getPipeline(pipelineId);
      if (!pipeline) {
        return res.status(404).json({ message: 'Pipeline not found' });
      }

      if (pipeline.userId !== req.user.id) {
        return res.status(403).json({ message: 'Forbidden' });
      }

      // Delete the pipeline
      const success = await pipelineService.deletePipeline(pipelineId);
      if (!success) {
        return res.status(404).json({ message: 'Pipeline not found' });
      }

      res.status(204).send();
    } catch (error) {
      console.error('Error deleting pipeline:', error);
      res.status(500).json({ message: error.message });
    }
  });

  /**
   * Start a pipeline run
   */
  app.post('/api/pipelines/:id/run', async (req: Request, res: Response) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: 'Unauthorized' });
      }

      const pipelineId = parseInt(req.params.id);
      if (isNaN(pipelineId)) {
        return res.status(400).json({ message: 'Invalid pipeline ID' });
      }

      // Check if the pipeline exists and belongs to the user
      const pipeline = await pipelineService.getPipeline(pipelineId);
      if (!pipeline) {
        return res.status(404).json({ message: 'Pipeline not found' });
      }

      if (pipeline.userId !== req.user.id) {
        return res.status(403).json({ message: 'Forbidden' });
      }

      // Validate the request body
      const validation = createPipelineRunSchema.safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({ 
          message: 'Invalid run data', 
          errors: validation.error.format() 
        });
      }

      // Start the pipeline run
      const run = await pipelineService.startPipelineRun(
        pipelineId, 
        validation.data.contentId,
        validation.data.metadata
      );

      res.status(201).json(run);
    } catch (error) {
      console.error('Error starting pipeline run:', error);
      res.status(500).json({ message: error.message });
    }
  });

  /**
   * Get all runs for a pipeline
   */
  app.get('/api/pipelines/:id/runs', async (req: Request, res: Response) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: 'Unauthorized' });
      }

      const pipelineId = parseInt(req.params.id);
      if (isNaN(pipelineId)) {
        return res.status(400).json({ message: 'Invalid pipeline ID' });
      }

      // Check if the pipeline exists and belongs to the user
      const pipeline = await pipelineService.getPipeline(pipelineId);
      if (!pipeline) {
        return res.status(404).json({ message: 'Pipeline not found' });
      }

      if (pipeline.userId !== req.user.id) {
        return res.status(403).json({ message: 'Forbidden' });
      }

      // Get all runs for the pipeline
      const runs = await pipelineService.getPipelineRuns(pipelineId);
      res.json(runs);
    } catch (error) {
      console.error('Error getting pipeline runs:', error);
      res.status(500).json({ message: error.message });
    }
  });

  /**
   * Get a pipeline run by ID
   */
  app.get('/api/pipeline-runs/:id', async (req: Request, res: Response) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: 'Unauthorized' });
      }

      const runId = parseInt(req.params.id);
      if (isNaN(runId)) {
        return res.status(400).json({ message: 'Invalid run ID' });
      }

      // Get the run
      const run = await pipelineService.getPipelineRun(runId);
      if (!run) {
        return res.status(404).json({ message: 'Run not found' });
      }

      // Check if the pipeline belongs to the user
      const pipeline = await pipelineService.getPipeline(run.pipelineId);
      if (!pipeline) {
        return res.status(404).json({ message: 'Pipeline not found' });
      }

      if (pipeline.userId !== req.user.id) {
        return res.status(403).json({ message: 'Forbidden' });
      }

      res.json(run);
    } catch (error) {
      console.error('Error getting pipeline run:', error);
      res.status(500).json({ message: error.message });
    }
  });

  /**
   * Cancel a pipeline run
   */
  app.post('/api/pipeline-runs/:id/cancel', async (req: Request, res: Response) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: 'Unauthorized' });
      }

      const runId = parseInt(req.params.id);
      if (isNaN(runId)) {
        return res.status(400).json({ message: 'Invalid run ID' });
      }

      // Get the run
      const run = await pipelineService.getPipelineRun(runId);
      if (!run) {
        return res.status(404).json({ message: 'Run not found' });
      }

      // Check if the pipeline belongs to the user
      const pipeline = await pipelineService.getPipeline(run.pipelineId);
      if (!pipeline) {
        return res.status(404).json({ message: 'Pipeline not found' });
      }

      if (pipeline.userId !== req.user.id) {
        return res.status(403).json({ message: 'Forbidden' });
      }

      // Cancel the run
      const success = await pipelineService.cancelPipelineRun(runId);
      if (!success) {
        return res.status(400).json({ message: 'Run could not be cancelled' });
      }

      res.status(204).send();
    } catch (error) {
      console.error('Error cancelling pipeline run:', error);
      res.status(500).json({ message: error.message });
    }
  });

  /**
   * Get all jobs for a pipeline run
   */
  app.get('/api/pipeline-runs/:id/jobs', async (req: Request, res: Response) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: 'Unauthorized' });
      }

      const runId = parseInt(req.params.id);
      if (isNaN(runId)) {
        return res.status(400).json({ message: 'Invalid run ID' });
      }

      // Get the run
      const run = await pipelineService.getPipelineRun(runId);
      if (!run) {
        return res.status(404).json({ message: 'Run not found' });
      }

      // Check if the pipeline belongs to the user
      const pipeline = await pipelineService.getPipeline(run.pipelineId);
      if (!pipeline) {
        return res.status(404).json({ message: 'Pipeline not found' });
      }

      if (pipeline.userId !== req.user.id) {
        return res.status(403).json({ message: 'Forbidden' });
      }

      // Get all jobs for the run
      const jobs = await pipelineService.getPipelineJobs(runId);
      res.json(jobs);
    } catch (error) {
      console.error('Error getting pipeline jobs:', error);
      res.status(500).json({ message: error.message });
    }
  });
}