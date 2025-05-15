import { Request, Response, Router } from 'express';
import axios from 'axios';
import * as jsdom from 'jsdom';
import { db } from '../db';
import { companyProfiles } from '@shared/schema';
import { eq } from 'drizzle-orm';
import OpenAI from 'openai';

const router = Router();

/**
 * Extract content from a website URL
 */
async function extractWebsiteContent(url: string): Promise<string> {
  try {
    // Make sure URL has protocol
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      url = 'https://' + url;
    }

    const response = await axios.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; KontentFireBot/1.0; +https://kontentfire.com)'
      }
    });

    // Use jsdom to parse the HTML
    const { JSDOM } = jsdom;
    const dom = new JSDOM(response.data);
    const document = dom.window.document;
    
    // Extract the text content
    const title = document.querySelector('title')?.textContent || '';
    const metaDescription = document.querySelector('meta[name="description"]')?.getAttribute('content') || '';
    
    // Extract text content from main content areas
    const contentSelectors = [
      'main', 'article', '.content', '#content', 
      '.about', '#about', '.about-us', '#about-us',
      '.company', '#company'
    ];
    
    let mainContent = '';
    for (const selector of contentSelectors) {
      const element = document.querySelector(selector);
      if (element) {
        mainContent += element.textContent + '\n\n';
      }
    }
    
    // If no content was found with specific selectors, get the body content
    if (!mainContent.trim()) {
      mainContent = document.body.textContent || '';
    }
    
    // Combine the extracted content
    return `Title: ${title}\n\nDescription: ${metaDescription}\n\nContent: ${mainContent}`;
  } catch (error) {
    console.error('Error extracting website content:', error);
    throw new Error('Failed to extract content from website. Please check the URL and try again.');
  }
}

/**
 * Get company profile for the authenticated user
 */
export const getCompanyProfile = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const [profile] = await db.select()
      .from(companyProfiles)
      .where(eq(companyProfiles.userId, userId))
      .limit(1);

    if (!profile) {
      return res.status(404).json({ error: 'Company profile not found' });
    }

    return res.status(200).json(profile);
  } catch (error) {
    console.error('Error getting company profile:', error);
    return res.status(500).json({ error: 'Failed to retrieve company profile' });
  }
};

/**
 * Create or update company profile for the authenticated user
 */
export const saveCompanyProfile = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { name, description, industry, website, logo } = req.body;

    // Get existing profile
    const [existingProfile] = await db.select()
      .from(companyProfiles)
      .where(eq(companyProfiles.userId, userId))
      .limit(1);

    if (existingProfile) {
      // Update existing profile
      const [updatedProfile] = await db.update(companyProfiles)
        .set({
          name,
          description, 
          industry,
          website,
          logo,
          updatedAt: new Date()
        })
        .where(eq(companyProfiles.id, existingProfile.id))
        .returning();

      return res.status(200).json(updatedProfile);
    } else {
      // Create new profile
      const [newProfile] = await db.insert(companyProfiles)
        .values({
          userId,
          name,
          description,
          industry, 
          website,
          logo
        })
        .returning();

      return res.status(201).json(newProfile);
    }
  } catch (error) {
    console.error('Error saving company profile:', error);
    return res.status(500).json({ error: 'Failed to save company profile' });
  }
};

/**
 * Auto-fill company profile from website
 */
export const autoFillFromWebsite = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { url } = req.body;
    if (!url) {
      return res.status(400).json({ error: 'Website URL is required' });
    }

    // Extract content from the website
    const websiteContent = await extractWebsiteContent(url || '');

    // Use OpenAI to analyze the content and extract company information
    const openai = new OpenAI({ 
      apiKey: process.env.OPENAI_API_KEY 
    });
    const completion = await openai.chat.completions.create({
      model: "gpt-4o", // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
      messages: [
        {
          role: "system",
          content: "You are a business analyst assistant that extracts company information from website content. Extract the following information and return it as JSON: companyName, description (a paragraph about what the company does), industry, websiteUrl, and primaryColor (if mentioned, otherwise null)."
        },
        {
          role: "user",
          content: websiteContent
        }
      ],
      response_format: { type: "json_object" }
    });

    const extractedInfo = JSON.parse(completion.choices[0].message.content);
    
    // Get existing profile
    const [existingProfile] = await db.select()
      .from(companyProfiles)
      .where(eq(companyProfiles.userId, userId))
      .limit(1);

    if (existingProfile) {
      // Update existing profile
      const [updatedProfile] = await db.update(companyProfiles)
        .set({
          name: extractedInfo.companyName,
          description: extractedInfo.description,
          industry: extractedInfo.industry,
          website: extractedInfo.websiteUrl,
          updatedAt: new Date()
        })
        .where(eq(companyProfiles.id, existingProfile.id))
        .returning();

      return res.status(200).json(updatedProfile);
    } else {
      // Create new profile
      const [newProfile] = await db.insert(companyProfiles)
        .values({
          userId,
          name: extractedInfo.companyName,
          description: extractedInfo.description,
          industry: extractedInfo.industry,
          website: extractedInfo.websiteUrl
        })
        .returning();

      return res.status(201).json(newProfile);
    }
  } catch (error) {
    console.error('Error auto-filling from website:', error);
    return res.status(500).json({ 
      error: 'Failed to extract company information from website',
      message: error.message
    });
  }
});

/**
 * Auto-fill company profile from document
 */
export const autoFillFromDocument = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { text } = req.body;
    if (!text || typeof text !== 'string' || text.trim() === '') {
      return res.status(400).json({ error: 'Document text is required' });
    }
    
    const documentText = text.trim();

    // Use OpenAI to analyze the document text and extract company information
    const openai = new OpenAI({ 
      apiKey: process.env.OPENAI_API_KEY 
    });
    const completion = await openai.chat.completions.create({
      model: "gpt-4o", // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
      messages: [
        {
          role: "system",
          content: "You are a business analyst assistant that extracts company information from document content. Extract the following information and return it as JSON: companyName, description (a paragraph about what the company does), industry, websiteUrl (if mentioned, otherwise null), and primaryColor (if mentioned, otherwise null)."
        },
        {
          role: "user",
          content: documentText
        }
      ],
      response_format: { type: "json_object" }
    });

    const extractedInfo = JSON.parse(completion.choices[0].message.content);
    
    // Get existing profile
    const [existingProfile] = await db.select()
      .from(companyProfiles)
      .where(eq(companyProfiles.userId, userId))
      .limit(1);

    if (existingProfile) {
      // Update existing profile
      const [updatedProfile] = await db.update(companyProfiles)
        .set({
          name: extractedInfo.companyName,
          description: extractedInfo.description,
          industry: extractedInfo.industry,
          website: extractedInfo.websiteUrl || existingProfile.website,
          updatedAt: new Date()
        })
        .where(eq(companyProfiles.id, existingProfile.id))
        .returning();

      return res.status(200).json(updatedProfile);
    } else {
      // Create new profile
      const [newProfile] = await db.insert(companyProfiles)
        .values({
          userId,
          name: extractedInfo.companyName,
          description: extractedInfo.description,
          industry: extractedInfo.industry,
          website: extractedInfo.websiteUrl
        })
        .returning();

      return res.status(201).json(newProfile);
    }
  } catch (error) {
    console.error('Error auto-filling from document:', error);
    return res.status(500).json({ 
      error: 'Failed to extract company information from document',
      message: error.message
    });
  }
});

// Get company profile
router.get('/', getCompanyProfile);

// Create or update company profile
router.post('/', saveCompanyProfile);

export default router;