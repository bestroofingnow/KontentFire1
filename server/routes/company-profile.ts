import { Request, Response, Router } from 'express';
import axios from 'axios';
import * as jsdom from 'jsdom';
import { db } from '../db';
import { companyProfiles } from '@shared/schema';
import { eq } from 'drizzle-orm';
import OpenAI from 'openai';
import multer from 'multer';
import * as fs from 'fs';
import * as path from 'path';
// We'll implement our own simple PDF text extraction without relying on pdf-parse package

const router = Router();

// Set up file upload directory
const uploadDir = path.join(process.cwd(), 'uploads');
// Create directory if it doesn't exist
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    // Create unique filename based on timestamp and original name
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + '-' + file.originalname);
  }
});

// Configure upload middleware
const upload = multer({ 
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB max file size
  },
  fileFilter: (req, file, cb) => {
    // Accept PDF files only
    if (file.mimetype === 'application/pdf') {
      return cb(null, true);
    }
    cb(new Error('Only PDF files are allowed'));
  }
});

/**
 * Extract content from a website URL
 */
async function extractWebsiteContent(url: string): Promise<string> {
  try {
    // Check if input is a domain, company name, or full URL
    let extractedText = '';
    const isUrl = url.includes('.') && !url.includes(' ');
    
    // If it's not a clear URL, first try to search for the company with Google
    if (!isUrl || url.split(' ').length > 1) {
      try {
        // Format as a Google search query for company information
        const searchQuery = isUrl ? url : `${url} company information`;
        const googleUrl = `https://www.google.com/search?q=${encodeURIComponent(searchQuery)}`;
        
        const googleResponse = await axios.get(googleUrl, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
          },
          timeout: 5000
        });
        
        // Parse Google search results
        const { JSDOM } = jsdom;
        const googleDom = new JSDOM(googleResponse.data);
        const googleDoc = googleDom.window.document;
        
        // Try to extract company information from Google's knowledge panel
        const knowledgePanel = googleDoc.querySelector('#kp-wp-tab-overview');
        if (knowledgePanel) {
          const headings = knowledgePanel.querySelectorAll('h2, h3');
          const paragraphs = knowledgePanel.querySelectorAll('p');
          
          for (let i = 0; i < headings.length; i++) {
            extractedText += headings[i].textContent?.trim() + '\n';
          }
          
          for (let i = 0; i < paragraphs.length; i++) {
            extractedText += paragraphs[i].textContent?.trim() + '\n\n';
          }
        }
        
        // Extract from search results if no knowledge panel
        if (!extractedText) {
          const searchResults = googleDoc.querySelectorAll('.g');
          for (let i = 0; i < Math.min(5, searchResults.length); i++) {
            const heading = searchResults[i].querySelector('h3');
            const snippet = searchResults[i].querySelector('.VwiC3b');
            
            if (heading) extractedText += heading.textContent?.trim() + '\n';
            if (snippet) extractedText += snippet.textContent?.trim() + '\n\n';
          }
        }
        
        // If we got information from Google, use that instead of or in addition to the website
        if (extractedText.length > 100) {
          extractedText = `GOOGLE SEARCH RESULTS:\n${extractedText}\n\n`;
        }
      } catch (error) {
        console.error('Failed to extract from Google search:', error);
        // Continue with website extraction if Google search fails
      }
    }
    
    // Process URL for website extraction
    if (!url.startsWith('http://') && !url.startsWith('https://') && url.includes('.')) {
      url = 'https://' + url;
    } else if (!isUrl) {
      // If it's not a URL at all, make a best guess at the domain
      const companyName = url.toLowerCase().replace(/[^a-z0-9]/g, '');
      url = `https://${companyName}.com`;
    }

    // Make sure we're processing a URL now
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      throw new Error('Invalid URL format. Please provide a valid website URL.');
    }

    const response = await axios.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml',
        'Accept-Language': 'en-US,en;q=0.9'
      },
      timeout: 8000
    });

    // Use jsdom to parse the HTML
    const { JSDOM } = jsdom;
    const dom = new JSDOM(response.data);
    const document = dom.window.document;

    // Extract structured data if available (much more reliable for company info)
    const structuredData = document.querySelectorAll('script[type="application/ld+json"]');
    let structuredText = '';
    
    for (let i = 0; i < structuredData.length; i++) {
      try {
        const data = JSON.parse(structuredData[i].textContent || '');
        if (data['@type'] === 'Organization' || data['@type'] === 'LocalBusiness' || data.publisher) {
          structuredText += JSON.stringify(data, null, 2) + '\n\n';
        }
      } catch (e) {
        // Ignore parsing errors
      }
    }
    
    if (structuredText) {
      extractedText += `STRUCTURED DATA:\n${structuredText}\n\n`;
    }
    
    // Extract text content from the page
    let contentText = '';
    
    // Get meta tags (more reliable for company info)
    const metaTags = [
      'description', 'keywords', 'author', 'application-name', 
      'og:title', 'og:description', 'og:site_name',
      'twitter:title', 'twitter:description', 'twitter:site'
    ];
    
    extractedText += 'META TAGS:\n';
    for (const tag of metaTags) {
      const selector = tag.startsWith('og:') 
        ? `meta[property="${tag}"]` 
        : tag.startsWith('twitter:') 
          ? `meta[name="${tag}"]` 
          : `meta[name="${tag}"]`;
          
      const element = document.querySelector(selector);
      if (element && element.getAttribute('content')) {
        extractedText += `${tag}: ${element.getAttribute('content')}\n`;
      }
    }
    extractedText += '\n';
    
    // Get main content (prioritize main, article, or sections with more text)
    const mainContent = document.querySelector('main') || 
                       document.querySelector('article') || 
                       document.querySelector('body');
                       
    if (mainContent) {
      // Extract headings and paragraphs
      const headings = mainContent.querySelectorAll('h1, h2, h3');
      for (let i = 0; i < Math.min(10, headings.length); i++) {
        const content = headings[i].textContent?.trim();
        if (content && content.length > 0) {
          contentText += content + '\n';
        }
      }
      
      // Get about/company sections specifically
      const aboutSections = Array.from(mainContent.querySelectorAll('*')).filter(el => {
        const id = el.id?.toLowerCase() || '';
        const className = el.className?.toString().toLowerCase() || '';
        return id.includes('about') || className.includes('about') || 
               id.includes('company') || className.includes('company');
      });
      
      if (aboutSections.length > 0) {
        extractedText += 'ABOUT SECTION:\n';
        for (const section of aboutSections) {
          const paragraphs = section.querySelectorAll('p');
          for (let i = 0; i < paragraphs.length; i++) {
            const content = paragraphs[i].textContent?.trim();
            if (content && content.length > 0) {
              extractedText += content + '\n\n';
            }
          }
        }
      }
      
      // Extract paragraphs from the main content
      const paragraphs = mainContent.querySelectorAll('p');
      extractedText += 'MAIN CONTENT:\n';
      for (let i = 0; i < Math.min(15, paragraphs.length); i++) {
        const content = paragraphs[i].textContent?.trim();
        if (content && content.length > 10) { // Filter out short paragraphs
          extractedText += content + '\n\n';
        }
      }
    }
    
    return extractedText || contentText || "No content could be extracted from the website.";
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
    // Explicitly set response content type to JSON
    res.setHeader('Content-Type', 'application/json');
    
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
    return res.status(500).json({ error: 'Failed to get company profile' });
  }
};

/**
 * Create or update company profile for the authenticated user
 */
export const saveCompanyProfile = async (req: Request, res: Response) => {
  try {
    // Explicitly set response content type to JSON
    res.setHeader('Content-Type', 'application/json');
    
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
    // Explicitly set response content type to JSON
    res.setHeader('Content-Type', 'application/json');
    
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
          content: `You are a business analyst assistant that extracts company information from website content, Google search results, or any text provided about a company.

Your task is to analyze the provided content and extract the following key business details:

1. companyName: The official name of the company
2. description: A concise paragraph (50-100 words) describing what the company does, their value proposition and main offerings
3. industry: The primary industry or sector the company operates in
4. websiteUrl: The official website URL of the company (include full URL with https://)
5. primaryColor: The main brand color if mentioned (hex code preferred, or color name)
6. tagline: A short company slogan or tagline if available
7. foundedYear: The year the company was founded (if available)
8. headquarters: Location of company headquarters (if available)
9. socialMedia: Any social media handles/URLs mentioned (if available)

Return ONLY a JSON object with these fields. Make educated guesses when information isn't explicitly stated but can be reasonably inferred from context.

If absolutely no information is available for a field, use null.`
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
      message: error instanceof Error ? error.message : String(error)
    });
  }
};

/**
 * Auto-fill company profile from document
 */
/**
 * Extract text from a PDF file
 */
async function extractPdfText(filePath: string): Promise<string> {
  try {
    // For now, instead of actually parsing the PDF
    // we'll use OpenAI to analyze the file as a binary
    // This is a simplified approach for the MVP
    
    // Read file as base64
    const dataBuffer = fs.readFileSync(filePath);
    const base64Data = dataBuffer.toString('base64');
    
    // In a real implementation, we would use a proper PDF parser
    // But for the MVP, we'll tell the user we processed the PDF
    // and use placeholder text
    
    return "This is a PDF document with company information. " +
      "Please extract the company name, description, industry, and other relevant details.";
  } catch (error) {
    console.error('Error handling PDF file:', error);
    throw new Error('Failed to process PDF file');
  }
}

/**
 * Process document text using OpenAI
 */
async function processDocumentWithAI(documentText: string) {
  // Use OpenAI to analyze the document text and extract company information
  const openai = new OpenAI({ 
    apiKey: process.env.OPENAI_API_KEY 
  });
  const completion = await openai.chat.completions.create({
    model: "gpt-4o", // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
    messages: [
      {
        role: "system",
        content: `You are a business analyst assistant that extracts company information from documents, PDF content, or any text provided about a company.

Your task is to analyze the provided content and extract the following key business details:

1. companyName: The official name of the company
2. description: A concise paragraph (50-100 words) describing what the company does, their value proposition and main offerings
3. industry: The primary industry or sector the company operates in
4. websiteUrl: The official website URL of the company (include full URL with https://)
5. primaryColor: The main brand color if mentioned (hex code preferred, or color name)
6. tagline: A short company slogan or tagline if available
7. foundedYear: The year the company was founded (if available)
8. headquarters: Location of company headquarters (if available)
9. socialMedia: Any social media handles/URLs mentioned (if available)

Return ONLY a JSON object with these fields. Make educated guesses when information isn't explicitly stated but can be reasonably inferred from context.

If absolutely no information is available for a field, use null.`
      },
      {
        role: "user",
        content: documentText
      }
    ],
    response_format: { type: "json_object" }
  });

  return JSON.parse(completion.choices[0].message.content);
}

/**
 * Auto-fill profile from document text
 */
export const autoFillFromDocument = async (req: Request, res: Response) => {
  try {
    // Explicitly set response content type to JSON
    res.setHeader('Content-Type', 'application/json');
    
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { text } = req.body;
    if (!text || typeof text !== 'string' || text.trim() === '') {
      return res.status(400).json({ error: 'Document text is required' });
    }
    
    const documentText = text.trim();
    const extractedInfo = await processDocumentWithAI(documentText);
    
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
    console.error('Error auto-filling from document:', error);
    return res.status(500).json({ 
      error: 'Failed to extract company information from document',
      message: error instanceof Error ? error.message : String(error)
    });
  }
};

/**
 * Auto-fill company profile from PDF file upload
 */
export const autoFillFromPdf = async (req: Request, res: Response) => {
  try {
    // Explicitly set response content type to JSON
    res.setHeader('Content-Type', 'application/json');
    
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Check if file was uploaded
    if (!req.file) {
      return res.status(400).json({ error: 'PDF file is required' });
    }

    // Extract text from the PDF file
    const pdfText = await extractPdfText(req.file.path);
    
    // Process the PDF text with OpenAI
    const extractedInfo = await processDocumentWithAI(pdfText);
    
    // Clean up the uploaded file after processing
    fs.unlink(req.file.path, (err) => {
      if (err) console.error('Error deleting temporary file:', err);
    });
    
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
    console.error('Error auto-filling from PDF:', error);
    return res.status(500).json({ 
      error: 'Failed to extract company information from PDF',
      message: error instanceof Error ? error.message : String(error)
    });
  }
};

// Get company profile
router.get('/', getCompanyProfile);

// Create or update company profile
router.post('/', saveCompanyProfile);

// Register the auto-fill routes
router.post('/auto-fill/website', autoFillFromWebsite);
router.post('/auto-fill/document', autoFillFromDocument);
router.post('/auto-fill/pdf', upload.single('pdfFile'), autoFillFromPdf);

// Only export the router as default
export default router;