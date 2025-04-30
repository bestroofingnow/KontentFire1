import { Request, Response } from 'express';
import { eq } from 'drizzle-orm';
import { db } from '../db';
import { brandSettings, insertBrandSettingsSchema } from '@shared/schema';

// Get the user's brand settings
export async function getBrandSettings(req: Request, res: Response) {
  if (!req.isAuthenticated()) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    const userId = req.user.id;
    
    // Get the brand settings
    const settings = await db.query.brandSettings.findFirst({
      where: eq(brandSettings.userId, userId)
    });
    
    if (!settings) {
      return res.status(404).json({ error: 'Brand settings not found' });
    }
    
    // Return with simplified structure for the onboarding popup
    const information = settings.information as Record<string, any> || {};
    const voice = settings.voice as Record<string, any> || {};
    
    // Extract the primary color from brand information
    const primaryColor = information.primaryColor || information.primary_color || '';
    
    // Extract the voice style
    const voiceStyle = voice.style || voice.tone || '';
    
    return res.status(200).json({
      ...settings,
      primaryColor,
      voice: voiceStyle
    });
  } catch (error) {
    console.error('Error getting brand settings:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

// Create or update brand settings
export async function saveBrandSettings(req: Request, res: Response) {
  if (!req.isAuthenticated()) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    const userId = req.user.id;
    let data = req.body;
    
    // Ensure the json fields have the correct structure
    if (!data.information) data.information = {};
    if (!data.voice) data.voice = {};
    if (!data.story) data.story = {};
    
    // Handle flattened primaryColor if it was sent
    if (data.primaryColor && !data.information.primaryColor) {
      data.information.primaryColor = data.primaryColor;
      delete data.primaryColor;
    }
    
    // Handle flattened voice if it was sent
    if (data.voiceStyle && typeof data.voiceStyle === 'string' && !data.voice.style) {
      data.voice.style = data.voiceStyle;
      delete data.voiceStyle;
    }
    
    // Validate the data
    const parseResult = insertBrandSettingsSchema.safeParse({
      ...data,
      userId
    });
    
    if (!parseResult.success) {
      return res.status(400).json({ 
        error: 'Invalid data', 
        details: parseResult.error.errors 
      });
    }
    
    // Check if brand settings already exist
    const existingSettings = await db.query.brandSettings.findFirst({
      where: eq(brandSettings.userId, userId)
    });
    
    if (existingSettings) {
      // Update existing settings
      const [updatedSettings] = await db
        .update(brandSettings)
        .set({
          ...data,
          updatedAt: new Date()
        })
        .where(eq(brandSettings.id, existingSettings.id))
        .returning();
      
      return res.status(200).json(updatedSettings);
    } else {
      // Create new settings
      const [newSettings] = await db
        .insert(brandSettings)
        .values({
          ...data,
          userId
        })
        .returning();
      
      return res.status(201).json(newSettings);
    }
  } catch (error) {
    console.error('Error saving brand settings:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}