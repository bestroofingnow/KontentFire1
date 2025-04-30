import { Router } from 'express';
import { db } from '../db';
import { brandSettings } from '@shared/schema';
import { eq } from 'drizzle-orm';

const router = Router();

// Get brand settings for the current user
router.get('/', async (req, res) => {
  if (!req.isAuthenticated()) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    const userId = req.user!.id;
    const [settings] = await db
      .select()
      .from(brandSettings)
      .where(eq(brandSettings.userId, userId));

    if (!settings) {
      return res.status(404).json({ error: 'Brand settings not found' });
    }

    res.json({
      information: settings.information,
      voice: settings.voice,
      story: settings.story,
    });
  } catch (error: any) {
    console.error('Error fetching brand settings:', error);
    res.status(500).json({ error: 'Failed to fetch brand settings' });
  }
});

// Create or update brand settings
router.post('/', async (req, res) => {
  if (!req.isAuthenticated()) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    const userId = req.user!.id;
    const { information, voice, story } = req.body;

    // Check if the user already has settings
    const [existingSettings] = await db
      .select()
      .from(brandSettings)
      .where(eq(brandSettings.userId, userId));

    if (existingSettings) {
      // Update existing settings
      const updateData: any = {};
      
      if (information) updateData.information = information;
      if (voice) updateData.voice = voice;
      if (story) updateData.story = story;

      const [updated] = await db
        .update(brandSettings)
        .set({
          ...updateData,
          updatedAt: new Date(),
        })
        .where(eq(brandSettings.userId, userId))
        .returning();

      return res.status(200).json(updated);
    } else {
      // Create new settings
      const [created] = await db
        .insert(brandSettings)
        .values({
          userId,
          information: information || {},
          voice: voice || {},
          story: story || { sections: [] },
          createdAt: new Date(),
          updatedAt: new Date(),
        })
        .returning();

      return res.status(201).json(created);
    }
  } catch (error: any) {
    console.error('Error saving brand settings:', error);
    res.status(500).json({ error: 'Failed to save brand settings' });
  }
});

export default router;