import { Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { db } from '../db';
import { animations, motionStyleEnum, outputFormatEnum, animationStatusEnum } from '@shared/schema';
import { eq } from 'drizzle-orm';

/**
 * Creates an animation from a request
 */
export const createAnimationHandler = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { prompt, sourceImageUrl, numFrames, fps, motionStyle, outputFormat, width, height } = req.body;

    if (!prompt && !sourceImageUrl) {
      return res.status(400).json({ error: 'Either prompt or sourceImageUrl is required' });
    }

    // Validate the motionStyle enum value
    if (motionStyle && !motionStyleEnum.enumValues.includes(motionStyle)) {
      return res.status(400).json({ 
        error: `Invalid motionStyle value. Must be one of: ${motionStyleEnum.enumValues.join(', ')}` 
      });
    }

    // Validate the outputFormat enum value
    if (outputFormat && !outputFormatEnum.enumValues.includes(outputFormat)) {
      return res.status(400).json({ 
        error: `Invalid outputFormat value. Must be one of: ${outputFormatEnum.enumValues.join(', ')}` 
      });
    }

    const animationId = uuidv4();
    
    // Create animation record
    const [animation] = await db.insert(animations).values({
      id: animationId,
      userId,
      prompt,
      sourceImageUrl,
      numFrames: numFrames || 24,
      fps: fps || 15,
      motionStyle: (motionStyle || 'default'),
      outputFormat: (outputFormat || 'gif'),
      width: width || 512,
      height: height || 512,
      status: 'pending',
    }).returning();

    // In a real implementation, you would initiate the actual animation generation here
    // For example, submit a job to a queue or call an external service API
    
    // For the demo, we'll simulate by setting up a timeout that will update the status
    setTimeout(async () => {
      try {
        // Simulate processing
        await db.update(animations)
          .set({ status: 'processing' })
          .where(eq(animations.id, animationId));
        
        // After some time, mark as completed with a fake output URL
        setTimeout(async () => {
          const outputUrl = `https://example.com/animations/${animationId}.${outputFormat || 'gif'}`;
          const thumbnailUrl = `https://example.com/animations/${animationId}_thumb.jpg`;
          
          await db.update(animations)
            .set({ 
              status: 'completed',
              outputUrl,
              thumbnailUrl,
              completedAt: new Date(),
            })
            .where(eq(animations.id, animationId));
        }, 5000); // Complete after 5 seconds
      } catch (error) {
        console.error('Error updating animation status:', error);
      }
    }, 2000); // Start processing after 2 seconds

    return res.status(201).json(animation);
  } catch (error) {
    console.error('Error creating animation:', error);
    return res.status(500).json({ error: 'Failed to create animation' });
  }
};

/**
 * Gets a specific animation by ID
 */
export const getAnimationHandler = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { id } = req.params;
    if (!id) {
      return res.status(400).json({ error: 'Animation ID is required' });
    }

    const [animation] = await db.select()
      .from(animations)
      .where(eq(animations.id, id))
      .limit(1);

    if (!animation) {
      return res.status(404).json({ error: 'Animation not found' });
    }

    // Check if the animation belongs to the requesting user
    if (animation.userId !== userId) {
      return res.status(403).json({ error: 'Forbidden' });
    }

    return res.status(200).json(animation);
  } catch (error) {
    console.error('Error getting animation:', error);
    return res.status(500).json({ error: 'Failed to get animation' });
  }
};

/**
 * Lists all animations for the current user
 */
export const listAnimationsHandler = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const userAnimations = await db.select()
      .from(animations)
      .where(eq(animations.userId, userId))
      .orderBy(animations.createdAt);

    return res.status(200).json(userAnimations);
  } catch (error) {
    console.error('Error listing animations:', error);
    return res.status(500).json({ error: 'Failed to list animations' });
  }
};

/**
 * Cancels an in-progress animation
 */
export const cancelAnimationHandler = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { id } = req.params;
    if (!id) {
      return res.status(400).json({ error: 'Animation ID is required' });
    }

    // Check if the animation exists and belongs to the user
    const [animation] = await db.select()
      .from(animations)
      .where(eq(animations.id, id))
      .limit(1);

    if (!animation) {
      return res.status(404).json({ error: 'Animation not found' });
    }

    if (animation.userId !== userId) {
      return res.status(403).json({ error: 'Forbidden' });
    }

    // Check if the animation can be canceled
    if (animation.status !== 'pending' && animation.status !== 'processing') {
      return res.status(400).json({ error: 'Cannot cancel animation in current state' });
    }

    // Update the animation status to 'failed'
    const [updatedAnimation] = await db.update(animations)
      .set({ status: 'failed' })
      .where(eq(animations.id, id))
      .returning();

    return res.status(200).json(updatedAnimation);
  } catch (error) {
    console.error('Error canceling animation:', error);
    return res.status(500).json({ error: 'Failed to cancel animation' });
  }
};