import { Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import path from 'path';
import fs from 'fs';
import { db } from '../db';
import { animations } from '@shared/schema';
import { eq } from 'drizzle-orm';

/**
 * Creates an animation from a request
 */
export const createAnimationHandler = async (req: Request, res: Response) => {
  if (!req.isAuthenticated()) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    const userId = req.user!.id;
    const { prompt, imageUrl, numFrames, fps, motionStyle, outputFormat, width, height } = req.body;

    // Validate required parameters
    if (!prompt && !imageUrl) {
      return res.status(400).json({ error: 'Either prompt or imageUrl is required' });
    }

    // Generate a unique ID for this animation
    const animationId = uuidv4();

    // For now, just create a mock record since we don't have the actual animation service integrated
    const [animation] = await db
      .insert(animations)
      .values({
        id: animationId,
        userId,
        prompt: prompt || null,
        sourceImageUrl: imageUrl || null,
        numFrames: numFrames || 24,
        fps: fps || 15,
        motionStyle: motionStyle || 'default',
        outputFormat: outputFormat || 'gif',
        width: width || 512,
        height: height || 512,
        status: 'processing',
        outputUrl: null,
        thumbnailUrl: null,
      })
      .returning();

    // In a real implementation, we would call the animation service here
    // For now, we'll mock a successful creation after a short delay
    setTimeout(async () => {
      try {
        // Update the animation with mock output URLs
        await db
          .update(animations)
          .set({
            status: 'completed',
            outputUrl: `https://example.com/animations/${animationId}.${outputFormat || 'gif'}`,
            thumbnailUrl: `https://example.com/animations/${animationId}_thumb.jpg`,
            completedAt: new Date(),
          })
          .where(eq(animations.id, animationId));
      } catch (error) {
        console.error('Error updating animation status:', error);
      }
    }, 3000);

    return res.status(201).json({
      id: animation.id,
      status: animation.status,
      message: 'Animation creation started',
    });
  } catch (error: any) {
    console.error('Error creating animation:', error);
    return res.status(500).json({ error: error.message });
  }
};

/**
 * Lists all animations for the current user
 */
export const listAnimationsHandler = async (req: Request, res: Response) => {
  if (!req.isAuthenticated()) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    const userId = req.user!.id;

    const userAnimations = await db
      .select()
      .from(animations)
      .where(eq(animations.userId, userId))
      .orderBy(animations.createdAt);

    return res.json(userAnimations);
  } catch (error: any) {
    console.error('Error listing animations:', error);
    return res.status(500).json({ error: error.message });
  }
};