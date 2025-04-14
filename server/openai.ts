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
};

export type ContentPrompt = {
  prompt: string;
  contentType: 'text' | 'image' | 'both';
  tone?: 'professional' | 'casual' | 'friendly' | 'authoritative' | 'humorous';
  length?: 'short' | 'medium' | 'long';
};

// Generate text content based on prompt
export async function generateText(prompt: string, tone: string = 'professional', length: string = 'medium'): Promise<string> {
  // Adjust token count based on length
  const maxTokens = 
    length === 'short' ? 250 :
    length === 'medium' ? 500 :
    length === 'long' ? 1000 : 500;
  
  // Include tone in system message
  const systemPrompt = `You are an expert content creator who writes in a ${tone} tone. 
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
      temperature: 0.7,
    });

    return response.choices[0].message.content || "Unable to generate content.";
  } catch (error: any) {
    console.error("Error generating text with OpenAI:", error.message);
    throw new Error(`Failed to generate text content: ${error.message}`);
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

// Generate both text and image
export async function generateContent(contentPrompt: ContentPrompt): Promise<GeneratedContent> {
  const { prompt, contentType, tone, length } = contentPrompt;
  const result: GeneratedContent = {};

  try {
    // Generate text if requested
    if (contentType === 'text' || contentType === 'both') {
      result.text = await generateText(prompt, tone, length);
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
