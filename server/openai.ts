import OpenAI from "openai";
import { storage } from "./storage";
import { getReferences } from "./perplexity";
import { enhanceContent } from './anthropic';

// Initialize OpenAI SDK with error handling for missing API key
let openai: OpenAI;
try {
  openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY || 'dummy-key',
  });
} catch (error) {
  console.warn("OpenAI initialization failed, creating a mock client");
  // Create a mock OpenAI instance that will be replaced once we have the API key
  openai = {
    chat: {
      completions: {
        create: async () => ({ 
          choices: [{ message: { content: "API key required to generate content." } }] 
        }),
      }
    },
    images: {
      generate: async () => ({ data: [{ url: "" }] })
    }
  } as unknown as OpenAI;
}

// Content types
export type GeneratedContent = {
  text?: string;
  imageUrl?: string;
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
    // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
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
      model: "dall-e-3",
      prompt: enhancedPrompt,
      n: 1,
      size: "1024x1024",
      quality: "standard",
    });

    return response.data[0].url || "";
  } catch (error: any) {
    console.error("Error generating image with DALL-E:", error.message);
    throw new Error(`Failed to generate image: ${error.message}`);
  }
}

// Import template handler
import { generateTemplatePrompt } from './template-handlers';

// Generate both text and image with sources
export async function generateContent(contentPrompt: ContentPrompt): Promise<GeneratedContent> {
  const { prompt, contentType, tone, length, personality, platform, template, templateData } = contentPrompt;
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

    // Generate image if requested
    if (contentType === 'image' || contentType === 'both') {
      // For 'both' type, adjust the image prompt based on the generated text
      let imagePrompt;
      
      if (template === 'battle-royale' && templateData) {
        // For Battle Royale, create a more specific image prompt
        imagePrompt = `Create a professional comparison image showing ${templateData.option1} versus ${templateData.option2} 
          for ${templateData.comparisonFocus || 'business'} applications. 
          Use a visual metaphor of competition or comparison.`;
      } else if (contentType === 'both' && result.text) {
        // For other content with text, use text to inform image
        imagePrompt = `Create an image to accompany this text: ${result.text.substring(0, 300)}...`;
      } else {
        // Default to the original prompt
        imagePrompt = effectivePrompt;
      }
      
      result.imageUrl = await generateImage(imagePrompt);
    }

    return result;
  } catch (error: any) {
    console.error("Error generating content:", error.message);
    throw new Error(`Failed to generate content: ${error.message}`);
  }
}

export default {
  generateText,
  generateImage,
  generateContent
};
