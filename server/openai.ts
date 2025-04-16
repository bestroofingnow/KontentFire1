import OpenAI from "openai";
import { storage } from "./storage";

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
};

import { getReferences } from "./perplexity";

// Generate text content based on prompt
export async function generateText(
  prompt: string, 
  tone: string = 'professional', 
  length: string = 'medium',
  personality: string = 'thoughtful'
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
  
  // Include tone and personality in system message
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
    
    Create content that is engaging, well-structured, and optimized for social media or blog posts.
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
    const response = await openai.images.generate({
      model: "dall-e-3",
      prompt: prompt,
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

// Generate both text and image with sources
export async function generateContent(contentPrompt: ContentPrompt): Promise<GeneratedContent> {
  const { prompt, contentType, tone, length, personality } = contentPrompt;
  const result: GeneratedContent = {};

  try {
    // First get relevant sources using Perplexity
    let sources: Array<{title: string, url: string, snippet: string}> = [];
    try {
      sources = await getRelevantSources(prompt);
      result.sources = sources;
    } catch (error) {
      console.warn("Failed to get sources from Perplexity, continuing without sources:", error);
    }

    // Generate text if requested
    if (contentType === 'text' || contentType === 'both') {
      // Enhance the prompt with source information if available
      let enhancedPrompt = prompt;
      
      if (sources && sources.length > 0) {
        enhancedPrompt += "\n\nHere are some relevant sources you can reference in your content:";
        sources.forEach((source, index) => {
          enhancedPrompt += `\n${index + 1}. ${source.title} - ${source.snippet}`;
        });
        enhancedPrompt += "\n\nPlease incorporate insights from these sources naturally in your content without explicitly mentioning them.";
      }
      
      result.text = await generateText(enhancedPrompt, tone, length, personality);
    }

    // Generate image if requested
    if (contentType === 'image' || contentType === 'both') {
      // For 'both' type, adjust the image prompt based on the generated text
      const imagePrompt = contentType === 'both' && result.text 
        ? `Create an image to accompany this text: ${result.text.substring(0, 300)}...` 
        : prompt;
      
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
