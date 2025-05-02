import { Request, Response } from 'express';
import { createAnimation, listAnimations, AnimationOptions } from '../animatediff-service';
import { z } from 'zod';

// Animation request schema validation
const animationRequestSchema = z.object({
  prompt: z.string().optional(),
  negativePrompt: z.string().optional(),
  imageUrl: z.string().url().optional(),
  motionStyle: z.enum(['zoom', 'pan', 'rotate', 'bounce', 'default']).optional(),
  numFrames: z.number().min(1).max(120).optional(),
  fps: z.number().min(1).max(60).optional(),
  looping: z.boolean().optional(),
  outputFormat: z.enum(['gif', 'mp4', 'webp']).optional(),
  width: z.number().min(256).max(1024).optional(),
  height: z.number().min(256).max(1024).optional()
}).refine(
  data => data.prompt || data.imageUrl, 
  { message: "At least one of 'prompt' or 'imageUrl' must be provided" }
);

/**
 * Create a new animation from text or image
 */
export async function createAnimationHandler(req: Request, res: Response) {
  if (!req.isAuthenticated()) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  
  try {
    // Validate request body
    const parseResult = animationRequestSchema.safeParse(req.body);
    if (!parseResult.success) {
      return res.status(400).json({ 
        error: 'Invalid request data', 
        details: parseResult.error.errors 
      });
    }
    
    // Create animation
    const options: AnimationOptions = parseResult.data;
    const result = await createAnimation(options);
    
    return res.status(201).json(result);
  } catch (error) {
    console.error('Error creating animation:', error);
    return res.status(500).json({ error: 'Failed to create animation' });
  }
}

/**
 * List all animations
 */
export async function listAnimationsHandler(req: Request, res: Response) {
  if (!req.isAuthenticated()) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  
  try {
    const animations = await listAnimations();
    return res.status(200).json(animations);
  } catch (error) {
    console.error('Error listing animations:', error);
    return res.status(500).json({ error: 'Failed to list animations' });
  }
}