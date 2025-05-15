import { Router, Request, Response } from 'express';
import { db } from '../db';
import { companyProfiles, brandSettings } from '@shared/schema';
import { eq, desc, and, or, sql } from 'drizzle-orm';
import OpenAI from 'openai';
import axios from 'axios';
import { JSDOM } from 'jsdom';

const router = Router();

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Get company profile
router.get('/', async (req, res) => {
  if (!req.isAuthenticated()) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    const userId = req.user!.id;
    const [companyProfile] = await db
      .select()
      .from(companyProfiles)
      .where(eq(companyProfiles.userId, userId));

    if (!companyProfile) {
      return res.status(404).json({ error: 'Company profile not found' });
    }

    return res.json(companyProfile);
  } catch (error: any) {
    console.error('Error fetching company profile:', error);
    return res.status(500).json({ error: error.message });
  }
});

// Create or update company profile
router.post('/', async (req, res) => {
  if (!req.isAuthenticated()) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    const userId = req.user!.id;
    const { name, description, industry, website, logo } = req.body;

    const [existingProfile] = await db
      .select()
      .from(companyProfiles)
      .where(eq(companyProfiles.userId, userId));

    if (existingProfile) {
      // Update existing profile
      const [updatedProfile] = await db
        .update(companyProfiles)
        .set({
          name,
          description,
          industry,
          website,
          logo,
          updatedAt: new Date(),
        })
        .where(eq(companyProfiles.id, existingProfile.id))
        .returning();

      return res.json(updatedProfile);
    } else {
      // Create new profile
      const [newProfile] = await db
        .insert(companyProfiles)
        .values({
          userId,
          name,
          description,
          industry,
          website,
          logo,
        })
        .returning();

      return res.status(201).json(newProfile);
    }
  } catch (error: any) {
    console.error('Error creating/updating company profile:', error);
    return res.status(500).json({ error: error.message });
  }
});

// Extract content from a website
async function extractWebsiteContent(url: string): Promise<string> {
  try {
    // Add http:// prefix if missing
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      url = `https://${url}`;
    }

    const response = await axios.get(url);
    const dom = new JSDOM(response.data);
    const document = dom.window.document;
    
    // Extract the page title
    const title = document.querySelector('title')?.textContent || '';
    
    // Extract meta description
    const metaDescription = document.querySelector('meta[name="description"]')?.getAttribute('content') || '';
    
    // Extract main content from common containers
    const mainContentSelectors = [
      'main',
      '#main',
      '.main',
      'article',
      '.content',
      '#content',
      '.article',
      '#article',
      '.about',
      '#about',
      '[role="main"]',
    ];
    
    let mainContent = '';
    for (const selector of mainContentSelectors) {
      const element = document.querySelector(selector);
      if (element && element.textContent) {
        mainContent += element.textContent.trim() + '\n\n';
      }
    }
    
    // Get text from about page specifically
    const aboutLinks = Array.from(document.querySelectorAll('a'))
      .filter(a => a.href.includes('about') || a.textContent?.toLowerCase().includes('about'));
    
    if (aboutLinks.length > 0 && aboutLinks[0].href) {
      try {
        const aboutUrl = new URL(aboutLinks[0].href, url).href;
        const aboutResponse = await axios.get(aboutUrl);
        const aboutDom = new JSDOM(aboutResponse.data);
        const aboutDocument = aboutDom.window.document;
        
        for (const selector of mainContentSelectors) {
          const element = aboutDocument.querySelector(selector);
          if (element && element.textContent) {
            mainContent += element.textContent.trim() + '\n\n';
          }
        }
      } catch (error) {
        console.warn('Error fetching about page:', error);
      }
    }
    
    // If we still don't have much content, get paragraphs from the main page
    if (mainContent.length < 200) {
      const paragraphs = document.querySelectorAll('p');
      for (const p of paragraphs) {
        if (p.textContent) {
          mainContent += p.textContent.trim() + '\n\n';
        }
      }
    }
    
    // Combine all content
    return `
      URL: ${url}
      Title: ${title}
      Description: ${metaDescription}
      
      Content:
      ${mainContent}
    `;
  } catch (error) {
    console.error('Error extracting website content:', error);
    throw new Error(`Failed to extract content from website: ${error.message}`);
  }
}

// Auto-fill company profile from website
router.post('/auto-fill/website', async (req, res) => {
  if (!req.isAuthenticated()) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    const userId = req.user!.id;
    const { url } = req.body;

    if (!url) {
      return res.status(400).json({ error: 'URL is required' });
    }

    // Extract content from website
    const websiteContent = await extractWebsiteContent(url);

    // Use AI to analyze and extract company information
    const completion = await openai.chat.completions.create({
      model: "gpt-4o", // the newest OpenAI model is "gpt-4o" which was released May 13, 2024
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content: `You are an AI assistant that extracts structured company information from website content. Parse the provided text and extract key details about the company. Your output should be valid JSON and follow this format:
          {
            "companyProfile": {
              "name": "Company name",
              "description": "Brief company description (max 250 words)",
              "industry": "Primary industry",
              "website": "Website URL"
            },
            "brandSettings": {
              "information": {
                "mission": "Company mission statement",
                "values": ["Value 1", "Value 2", "Value 3"],
                "targetAudience": "Description of target audience",
                "uniqueSellingPoints": ["USP 1", "USP 2", "USP 3"]
              },
              "voice": {
                "tone": "professional|casual|friendly|authoritative|humorous",
                "personality": "thoughtful|enthusiastic|skeptical|inspirational|analytical",
                "writingStyle": "Brief description of writing style"
              },
              "story": {
                "history": "Brief company history",
                "foundingStory": "Story of how the company was founded",
                "milestonesAndAchievements": ["Achievement 1", "Achievement 2"]
              }
            }
          }`
        },
        {
          role: "user",
          content: websiteContent
        }
      ]
    });

    // Parse the completion response
    let parsedData;
    try {
      parsedData = JSON.parse(completion.choices[0].message.content);
    } catch (error) {
      console.error('Error parsing OpenAI response:', error);
      return res.status(500).json({ error: 'Failed to parse AI response' });
    }

    // Update or create company profile
    const [existingProfile] = await db
      .select()
      .from(companyProfiles)
      .where(eq(companyProfiles.userId, userId));

    if (existingProfile) {
      // Update existing profile
      await db
        .update(companyProfiles)
        .set({
          name: parsedData.companyProfile.name,
          description: parsedData.companyProfile.description,
          industry: parsedData.companyProfile.industry,
          website: parsedData.companyProfile.website,
          updatedAt: new Date(),
        })
        .where(eq(companyProfiles.id, existingProfile.id));
    } else {
      // Create new profile
      await db
        .insert(companyProfiles)
        .values({
          userId,
          name: parsedData.companyProfile.name,
          description: parsedData.companyProfile.description,
          industry: parsedData.companyProfile.industry,
          website: parsedData.companyProfile.website,
        });
    }

    // Update or create brand settings
    const [existingBrandSettings] = await db
      .select()
      .from(brandSettings)
      .where(eq(brandSettings.userId, userId));

    if (existingBrandSettings) {
      // Update existing brand settings
      await db
        .update(brandSettings)
        .set({
          information: parsedData.brandSettings.information,
          voice: parsedData.brandSettings.voice,
          story: parsedData.brandSettings.story,
          updatedAt: new Date(),
        })
        .where(eq(brandSettings.id, existingBrandSettings.id));
    } else {
      // Create new brand settings
      await db
        .insert(brandSettings)
        .values({
          userId,
          information: parsedData.brandSettings.information,
          voice: parsedData.brandSettings.voice,
          story: parsedData.brandSettings.story,
        });
    }

    return res.json({ 
      message: 'Successfully auto-filled company information from website',
      companyProfile: parsedData.companyProfile,
      brandSettings: parsedData.brandSettings
    });
  } catch (error: any) {
    console.error('Error auto-filling from website:', error);
    return res.status(500).json({ error: error.message });
  }
});

// Auto-fill company profile from document text
router.post('/auto-fill/document', async (req, res) => {
  if (!req.isAuthenticated()) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    const userId = req.user!.id;
    const { text } = req.body;

    if (!text) {
      return res.status(400).json({ error: 'Document text is required' });
    }

    // Use AI to analyze and extract company information
    const completion = await openai.chat.completions.create({
      model: "gpt-4o", // the newest OpenAI model is "gpt-4o" which was released May 13, 2024
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content: `You are an AI assistant that extracts structured company information from document text. Parse the provided text and extract key details about the company. Your output should be valid JSON and follow this format:
          {
            "companyProfile": {
              "name": "Company name",
              "description": "Brief company description (max 250 words)",
              "industry": "Primary industry",
              "website": "Website URL (if mentioned)"
            },
            "brandSettings": {
              "information": {
                "mission": "Company mission statement",
                "values": ["Value 1", "Value 2", "Value 3"],
                "targetAudience": "Description of target audience",
                "uniqueSellingPoints": ["USP 1", "USP 2", "USP 3"]
              },
              "voice": {
                "tone": "professional|casual|friendly|authoritative|humorous",
                "personality": "thoughtful|enthusiastic|skeptical|inspirational|analytical",
                "writingStyle": "Brief description of writing style"
              },
              "story": {
                "history": "Brief company history",
                "foundingStory": "Story of how the company was founded",
                "milestonesAndAchievements": ["Achievement 1", "Achievement 2"]
              }
            }
          }`
        },
        {
          role: "user",
          content: text
        }
      ]
    });

    // Parse the completion response
    let parsedData;
    try {
      parsedData = JSON.parse(completion.choices[0].message.content);
    } catch (error) {
      console.error('Error parsing OpenAI response:', error);
      return res.status(500).json({ error: 'Failed to parse AI response' });
    }

    // Update or create company profile
    const [existingProfile] = await db
      .select()
      .from(companyProfiles)
      .where(eq(companyProfiles.userId, userId));

    if (existingProfile) {
      // Update existing profile
      await db
        .update(companyProfiles)
        .set({
          name: parsedData.companyProfile.name,
          description: parsedData.companyProfile.description,
          industry: parsedData.companyProfile.industry,
          website: parsedData.companyProfile.website,
          updatedAt: new Date(),
        })
        .where(eq(companyProfiles.id, existingProfile.id));
    } else {
      // Create new profile
      await db
        .insert(companyProfiles)
        .values({
          userId,
          name: parsedData.companyProfile.name,
          description: parsedData.companyProfile.description,
          industry: parsedData.companyProfile.industry,
          website: parsedData.companyProfile.website,
        });
    }

    // Update or create brand settings
    const [existingBrandSettings] = await db
      .select()
      .from(brandSettings)
      .where(eq(brandSettings.userId, userId));

    if (existingBrandSettings) {
      // Update existing brand settings
      await db
        .update(brandSettings)
        .set({
          information: parsedData.brandSettings.information,
          voice: parsedData.brandSettings.voice,
          story: parsedData.brandSettings.story,
          updatedAt: new Date(),
        })
        .where(eq(brandSettings.id, existingBrandSettings.id));
    } else {
      // Create new brand settings
      await db
        .insert(brandSettings)
        .values({
          userId,
          information: parsedData.brandSettings.information,
          voice: parsedData.brandSettings.voice,
          story: parsedData.brandSettings.story,
        });
    }

    return res.json({ 
      message: 'Successfully auto-filled company information from document',
      companyProfile: parsedData.companyProfile,
      brandSettings: parsedData.brandSettings
    });
  } catch (error: any) {
    console.error('Error auto-filling from document:', error);
    return res.status(500).json({ error: error.message });
  }
});

// Export handler functions for individual use
export const getCompanyProfile = async (req: Request, res: Response) => {
  if (!req.isAuthenticated()) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    const userId = req.user!.id;
    const [companyProfile] = await db
      .select()
      .from(companyProfiles)
      .where(eq(companyProfiles.userId, userId));

    if (!companyProfile) {
      return res.status(404).json({ error: 'Company profile not found' });
    }

    return res.json(companyProfile);
  } catch (error: any) {
    console.error('Error fetching company profile:', error);
    return res.status(500).json({ error: error.message });
  }
};

export const saveCompanyProfile = async (req: Request, res: Response) => {
  if (!req.isAuthenticated()) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    const userId = req.user!.id;
    const { name, description, industry, website, logo } = req.body;

    const [existingProfile] = await db
      .select()
      .from(companyProfiles)
      .where(eq(companyProfiles.userId, userId));

    if (existingProfile) {
      // Update existing profile
      const [updatedProfile] = await db
        .update(companyProfiles)
        .set({
          name,
          description,
          industry,
          website,
          logo,
          updatedAt: new Date(),
        })
        .where(eq(companyProfiles.id, existingProfile.id))
        .returning();

      return res.json(updatedProfile);
    } else {
      // Create new profile
      const [newProfile] = await db
        .insert(companyProfiles)
        .values({
          userId,
          name,
          description,
          industry,
          website,
          logo,
        })
        .returning();

      return res.status(201).json(newProfile);
    }
  } catch (error: any) {
    console.error('Error creating/updating company profile:', error);
    return res.status(500).json({ error: error.message });
  }
};

export default router;