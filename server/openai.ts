import OpenAI from "openai";
import { storage } from "./storage";
import { getReferences } from "./perplexity";
import { enhanceContent } from './anthropic';

// Initialize OpenAI SDK with error handling for missing API key
let openai: OpenAI;

try {
  if (!process.env.OPENAI_API_KEY) {
    console.error("OPENAI_API_KEY is missing or empty");
    throw new Error("Missing OpenAI API key");
  }
  
  // Initialize OpenAI client with the API key
  openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  });
  
  // Log successful initialization
  console.log("OpenAI client initialized successfully");
  
  // We won't actually test the API here as that would incur unnecessary API calls
  // The first actual API call will validate the key
} catch (error) {
  console.error("OpenAI initialization failed:", error);
  
  // Create a more helpful error-throwing mock client
  openai = {
    chat: {
      completions: {
        create: async () => { 
          throw new Error("OpenAI API key is invalid or missing - unable to generate content");
        },
      }
    },
    images: {
      generate: async () => { 
        throw new Error("OpenAI API key is invalid or missing - unable to generate images");
      }
    }
  } as unknown as OpenAI;
}

// Content types
export type GeneratedContent = {
  text?: string;
  imageUrl?: string;
  additionalImages?: string[]; // For supporting multiple images in content
  sources?: Array<{
    title: string;
    url: string;
    snippet: string;
  }>;
};

export type ContentPrompt = {
  prompt: string;
  contentType: 'text' | 'image' | 'both';
  tone?: 'professional' | 'casual' | 'friendly' | 'authoritative' | 'humorous';
  length?: 'short' | 'medium' | 'long';
  personality?: 'thoughtful' | 'enthusiastic' | 'skeptical' | 'inspirational' | 'analytical';
  platform?: 'blog' | 'facebook' | 'instagram' | 'gmb' | 'linkedin' | 'youtube' | 'tiktok' | 'pinterest' | 'press-release';
  template?: 'standard' | 'battle-royale' | 'basics-101' | 'myth-buster' | 'technical-guide' | 'case-against' | 'checklist';
  templateData?: any;
  companyContext?: string; // Company profile information for customized content
};

// Generate text content based on prompt
export async function generateText(
  prompt: string, 
  tone: string = 'professional', 
  length: string = 'medium',
  personality: string = 'thoughtful',
  platform: string = ''
): Promise<string> {
  // Adjust token count based on length
  const maxTokens = 
    length === 'short' ? 250 :
    length === 'medium' ? 500 :
    length === 'long' ? 1000 : 500;
  
  // Define personality traits
  const personalityTraits: Record<string, string> = {
    thoughtful: "You carefully consider different perspectives and present nuanced viewpoints. You ask reflective questions and acknowledge complexity. Your writing shows depth of thought and consideration.",
    enthusiastic: "You're energetic and passionate about the topic. Use exclamation points occasionally, show genuine excitement, and focus on positive aspects. Your writing is vibrant and uplifting.",
    skeptical: "You question assumptions and conventional wisdom. You're not cynical, but you don't accept claims without evidence. Your writing acknowledges uncertainties and examines issues from multiple angles.",
    inspirational: "You focus on motivating and uplifting the reader. Use powerful metaphors, share personal anecdotes when relevant, and emphasize possibility. Your writing evokes emotion and encourages action.",
    analytical: "You break down complex topics systematically. You use logical reasoning, present evidence, and analyze causes and effects. Your writing is clear, structured, and data-informed where possible."
  };
  
  // Platform-specific formatting instructions
  const platformFormatting: Record<string, string> = {
    blog: `
      Format your content with semantic HTML for a blog post:
      - Use <h2> and <h3> tags for headings (never <h1> which is reserved for the blog title)
      - Use <p> tags for paragraphs
      - Use <ul> and <li> tags for unordered lists
      - Use <ol> and <li> tags for ordered lists
      - Use <blockquote> tags for quotes
      - Use <strong> for important text and <em> for emphasized text
      - Include a proper structure with introduction, body (with subheadings), and conclusion
      - Add a call to action at the end
      - Make the content SEO-friendly with relevant keywords naturally integrated
      - Break up text with subheadings every 2-3 paragraphs for readability
    `,
    "press-release": `
      Format your content as a professional press release:
      - Include a clear, attention-grabbing headline
      - Add a dateline at the beginning with city, state, and date
      - Start with a concise summary paragraph that answers who, what, when, where, why
      - Organize body paragraphs in inverted pyramid style (most important information first)
      - Include at least one quote from a company representative
      - Maintain a formal, journalistic tone throughout
      - Include a boilerplate paragraph about the company at the end
      - Add contact information for media inquiries
      - Keep paragraphs short and focused
      - Use third-person perspective consistently
      - Avoid hyperbole or marketing language
      - Format with clean paragraphs, no HTML tags
    `,
    facebook: "Format for Facebook with short paragraphs and occasional emojis. Include a question or call to action at the end to encourage engagement.",
    instagram: "Format for Instagram with concise, engaging caption text. Use emojis and paragraph breaks strategically. Include relevant hashtags at the end.",
    gmb: "Format for Google My Business with concise, local-focused content. Highlight business information, services, or special offers clearly and directly.",
    linkedin: "Format for LinkedIn with professional, business-focused content structured in short paragraphs. Include industry insights and a professional call to action.",
    youtube: "Format as a video script with clear [INTRO], [BODY], and [CONCLUSION] sections. Include talking points, engagement prompts, and calls to action.",
    tiktok: "Format as a very brief, engaging script for TikTok with hooks, trends, and quick points that can be delivered in a fast-paced vertical video.",
    pinterest: "Create descriptive, inspirational text suitable for Pinterest pins. Focus on the visual aspects and include a clear, actionable headline."
  };
  
  // Include tone, personality, and platform-specific formatting in system message
  const systemPrompt = `You are an expert content creator who writes in a ${tone} tone and has a ${personality} personality. 
    ${personalityTraits[personality] || ""}
    
    Write as a real human would, with authentic voice, varied sentence structures, and occasional imperfections:
    - Use contractions (don't, can't, I've) and conversational language
    - Include personal observations or asides occasionally
    - Vary sentence length, including some shorter sentences for emphasis
    - Use transitional phrases naturally, not formulaically
    - Don't overuse adjectives or adverbs
    - Include specific details rather than generic statements
    - Express opinions when appropriate for the topic
    
    ${platform && platformFormatting[platform.toLowerCase()] ? platformFormatting[platform.toLowerCase()] : ''}
    
    Create content that is engaging, well-structured, and optimized for the appropriate platform.
    If the content mentions Kontent Fire, highlight its AI-powered content generation capabilities.`;
  
  try {
    // Use a stable model that is guaranteed to work in deployment
    const response = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: prompt }
      ],
      max_tokens: maxTokens,
      temperature: 0.8, // Slightly higher temperature for more varied output
    });

    return response.choices[0].message.content || "Unable to generate content.";
  } catch (error: any) {
    console.error("Error generating text with OpenAI:", error.message);
    
    // Check for specific error types
    const errorMsg = error.message || '';
    if (errorMsg.includes('<!DOCTYPE') || errorMsg.includes('<html')) {
      console.error('Received HTML error response in text generation');
      throw new Error(`Failed to connect to OpenAI service. Please check your network connection.`);
    } else if (errorMsg.toLowerCase().includes('api key')) {
      // API key specific error
      console.error('API key error in text generation');
      throw new Error(`OpenAI requires a valid API key. Please check your API credentials.`);
    } else if (errorMsg.includes('timeout') || errorMsg.includes('ECONNREFUSED') || errorMsg.includes('network')) {
      // Connection errors
      console.error('Network or connection error in text generation');
      throw new Error(`Network error: Failed to connect to text generation service.`);
    }
    
    throw new Error(`Failed to generate text content: ${error.message}`);
  }
}

// Get relevant sources using Perplexity
export async function getRelevantSources(topic: string, count: number = 3): Promise<Array<{title: string, url: string, snippet: string}>> {
  try {
    const referencesResponse = await getReferences({
      query: `Find ${count} highly relevant, recent, and credible sources about: ${topic}`,
      count
    });
    
    return referencesResponse.references;
  } catch (error: any) {
    console.error("Error fetching relevant sources with Perplexity:", error.message);
    return [];
  }
}

// Generate image based on prompt
export async function generateImage(prompt: string): Promise<string> {
  try {
    // Add explicit instruction to avoid text in images
    const enhancedPrompt = `${prompt}\n\nIMPORTANT: Create an image WITHOUT any text, words, letters, numbers, or writing of any kind. The image should be purely visual with no text elements.`;
    
    const response = await openai.images.generate({
      model: "dall-e-2",
      prompt: enhancedPrompt,
      n: 1,
      size: "1024x1024",
      quality: "standard",
    });

    return response.data[0].url || "";
  } catch (error: any) {
    console.error("Error generating image with DALL-E:", error.message);
    
    // Check for specific error types
    const errorMsg = error.message || '';
    if (errorMsg.includes('<!DOCTYPE') || errorMsg.includes('<html')) {
      console.error('Received HTML error response in image generation');
      throw new Error(`Failed to connect to DALL-E service. Please check your network connection.`);
    } else if (errorMsg.toLowerCase().includes('api key')) {
      // API key specific error
      console.error('API key error in image generation');
      throw new Error(`DALL-E requires a valid API key. Please check your API credentials.`);
    } else if (errorMsg.includes('timeout') || errorMsg.includes('ECONNREFUSED') || errorMsg.includes('network')) {
      // Connection errors
      console.error('Network or connection error in image generation');
      throw new Error(`Network error: Failed to connect to image generation service.`);
    } else if (errorMsg.includes('content policy')) {
      // Safety filter errors
      console.error('Content policy violation in image generation');
      throw new Error(`Your image prompt was flagged by safety filters. Please revise your prompt.`);
    }
    
    throw new Error(`Failed to generate image: ${error.message}`);
  }
}

// Import template handler
import { generateTemplatePrompt } from './template-handlers';

// Generate both text and image with sources
export async function generateContent(contentPrompt: ContentPrompt): Promise<GeneratedContent> {
  const { 
    prompt, 
    contentType, 
    tone, 
    length, 
    personality, 
    platform, 
    template, 
    templateData,
    companyContext 
  } = contentPrompt;
  
  const result: GeneratedContent = {};

  try {
    // Determine the effective prompt based on template
    let effectivePrompt = prompt;
    
    if (template && template !== 'standard' && templateData) {
      try {
        // Generate template-specific prompt
        console.log(`Using template: ${template}`);
        effectivePrompt = generateTemplatePrompt(
          template,
          templateData,
          tone || 'professional',
          personality || 'analytical',
          platform || 'blog'
        );
        console.log(`Generated template prompt for ${template}`);
      } catch (error: any) {
        console.warn(`Template handling error: ${error.message}. Falling back to standard prompt.`);
      }
    }

    // Incorporate company context if available
    if (companyContext && companyContext.trim()) {
      console.log("Using company context information for personalized content");
      effectivePrompt = `
        ${effectivePrompt}
        
        Use the following company information to personalize the content:
        ${companyContext}
        
        Make sure the content aligns with the company's brand voice, industry, and target audience.
      `;
    }

    // First get relevant sources using Perplexity
    let sources: Array<{title: string, url: string, snippet: string}> = [];
    try {
      // If using a template, make the search query more specific
      const searchQuery = template && template !== 'standard' && templateData 
        ? (templateData.comparisonFocus || templateData.topic || effectivePrompt.substring(0, 100))
        : effectivePrompt;
      
      sources = await getRelevantSources(searchQuery);
      result.sources = sources;
      console.log(`Found ${sources.length} sources using Perplexity`);
    } catch (error) {
      console.warn("Failed to get sources from Perplexity, continuing without sources:", error);
    }

    // Generate text if requested
    if (contentType === 'text' || contentType === 'both') {
      // Step 1: Generate base outline with OpenAI
      // For the outline, we'll use a more structured approach
      let outlinePrompt;
      
      if (template && template !== 'standard') {
        // For templates, use the template-generated prompt directly
        outlinePrompt = effectivePrompt;
      } else {
        // For standard content, create a structured outline
        outlinePrompt = `Create a detailed outline for content about: ${effectivePrompt}
        
        The outline should include:
        - Main topics and subtopics to cover
        - Key points for each section
        - Logical structure and flow
        - Questions that should be addressed
        
        This is just an outline that will be expanded and enhanced later.`;
      }
      
      console.log("Generating base outline with OpenAI...");
      const baseOutline = await generateText(outlinePrompt, 'professional', 'medium', 'analytical', platform);
      
      // Step 2: Use Claude to enhance and rewrite the content with sources
      console.log("Using Claude to enhance and rewrite content with sources...");
      const enhancedContent = await enhanceContent(
        baseOutline,
        sources,
        tone || 'professional',
        personality || 'thoughtful',
        platform || ''
      );
      
      result.text = enhancedContent;
    }

    // Generate images if requested
    if (contentType === 'image' || contentType === 'both') {
      // For 'both' type, adjust the image prompt based on the generated text
      let mainImagePrompt;
      
      if (template === 'battle-royale' && templateData) {
        // For Battle Royale, create a more specific image prompt
        mainImagePrompt = `Create a professional comparison image showing ${templateData.option1} versus ${templateData.option2} 
          for ${templateData.comparisonFocus || 'business'} applications. 
          Use a visual metaphor of competition or comparison.`;
      } else if (contentType === 'both' && result.text) {
        // For other content with text, use text to inform image
        mainImagePrompt = `Create a featured image to accompany this text: ${result.text.substring(0, 300)}...`;
      } else {
        // Default to the original prompt
        mainImagePrompt = effectivePrompt;
      }
      
      // Generate the main featured image
      result.imageUrl = await generateImage(mainImagePrompt);
      
      // For blog content, generate additional images based on content length (1 image per 400 words)
      if (platform === 'blog' && result.text) {
        const wordCount = result.text.split(/\s+/).length;
        const numAdditionalImages = Math.floor(wordCount / 400);
        
        console.log(`Content length: ${wordCount} words, generating ${numAdditionalImages} additional images`);
        
        if (numAdditionalImages > 0) {
          result.additionalImages = [];
          
          // Extract sections from the content
          const sections = result.text.split(/<h2>|<h3>/).filter(section => section.trim().length > 0);
          
          // Generate one image for each section up to the number of additional images needed
          for (let i = 0; i < Math.min(numAdditionalImages, sections.length); i++) {
            const sectionText = sections[i].substring(0, 300);
            const sectionImagePrompt = `Create a supporting image for this section of content: ${sectionText}...`;
            
            try {
              const imageUrl = await generateImage(sectionImagePrompt);
              if (imageUrl) {
                result.additionalImages.push(imageUrl);
              }
            } catch (error) {
              console.warn(`Failed to generate additional image ${i+1}:`, error);
            }
          }
          
          // If we couldn't extract enough sections, generate generic topic-based images
          if (result.additionalImages.length < numAdditionalImages) {
            const remaining = numAdditionalImages - result.additionalImages.length;
            for (let i = 0; i < remaining; i++) {
              const genericPrompt = template === 'battle-royale' && templateData
                ? `Create a detailed image related to ${templateData.comparisonFocus || 'the comparison topic'} showing aspect ${i+1} of the comparison.`
                : `Create a relevant image for ${effectivePrompt.substring(0, 100)}... (image ${i+1})`;
              
              try {
                const imageUrl = await generateImage(genericPrompt);
                if (imageUrl) {
                  result.additionalImages.push(imageUrl);
                }
              } catch (error) {
                console.warn(`Failed to generate generic additional image ${i+1}:`, error);
              }
            }
          }
          
          console.log(`Generated ${result.additionalImages.length} additional images for content`);
        }
      }
    }

    return result;
  } catch (error: any) {
    console.error("Error generating content:", error.message);
    
    // Check if the error appears to be an HTML response
    const errorMsg = error.message || '';
    if (errorMsg.includes('<!DOCTYPE') || errorMsg.includes('<html')) {
      console.error('Received HTML error response in content generation');
      throw new Error(`Failed to connect to content generation service. This usually indicates an authentication or connectivity issue.`);
    } else if (errorMsg.toLowerCase().includes('api key')) {
      // API key specific error
      console.error('API key error in content generation');
      throw new Error(`Content generation service requires a valid API key. Please check your API credentials.`);
    } else if (errorMsg.includes('timeout') || errorMsg.includes('ECONNREFUSED') || errorMsg.includes('network')) {
      // Connection errors
      console.error('Network or connection error in content generation');
      throw new Error(`Network error: Failed to connect to content generation service. Please check your connection and try again.`);
    }
    
    // Default error
    throw new Error(`Failed to generate content: ${error.message}`);
  }
}

export default {
  generateText,
  generateImage,
  generateContent
};
