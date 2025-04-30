import { Request, Response } from 'express';
import { eq } from 'drizzle-orm';
import { db } from '../db';
import { companyProfiles, insertCompanyProfileSchema } from '@shared/schema';

// Get the user's company profile
export async function getCompanyProfile(req: Request, res: Response) {
  if (!req.isAuthenticated()) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    const userId = req.user.id;
    
    // Get the company profile
    const profile = await db.query.companyProfiles.findFirst({
      where: eq(companyProfiles.userId, userId)
    });
    
    if (!profile) {
      return res.status(404).json({ error: 'Company profile not found' });
    }
    
    return res.status(200).json(profile);
  } catch (error) {
    console.error('Error getting company profile:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

// Create or update a company profile
export async function saveCompanyProfile(req: Request, res: Response) {
  if (!req.isAuthenticated()) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    const userId = req.user.id;
    const data = req.body;
    
    // Validate the data
    const parseResult = insertCompanyProfileSchema.safeParse({
      ...data,
      userId
    });
    
    if (!parseResult.success) {
      return res.status(400).json({ 
        error: 'Invalid data', 
        details: parseResult.error.errors 
      });
    }
    
    // Check if company profile already exists
    const existingProfile = await db.query.companyProfiles.findFirst({
      where: eq(companyProfiles.userId, userId)
    });
    
    if (existingProfile) {
      // Update existing profile
      const [updatedProfile] = await db
        .update(companyProfiles)
        .set({
          ...data,
          updatedAt: new Date()
        })
        .where(eq(companyProfiles.id, existingProfile.id))
        .returning();
      
      return res.status(200).json(updatedProfile);
    } else {
      // Create new profile
      const [newProfile] = await db
        .insert(companyProfiles)
        .values({
          ...data,
          userId
        })
        .returning();
      
      return res.status(201).json(newProfile);
    }
  } catch (error) {
    console.error('Error saving company profile:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}