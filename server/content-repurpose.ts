/**
 * Content repurposing functionality for transforming content between platforms
 */
import OpenAI from "openai";

// Initialize OpenAI client
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export interface RepurposeRequest {
  content: string;
  title?: string;
  sourcePlatform: PlatformType;
  targetPlatform: PlatformType;
  tone?: ToneType;
  additionalInstructions?: string;
}

export interface RepurposeResponse {
  repurposedContent: string;
  suggestedTitle?: string;
  suggestedHashtags?: string[];
  suggestedImagePrompt?: string;
}

type PlatformType = 'blog' | 'facebook' | 'instagram' | 'twitter' | 'linkedin' | 'youtube' | 'tiktok' | 'pinterest';
type ToneType = 'professional' | 'casual' | 'friendly' | 'authoritative' | 'humorous';

// Platform format guidelines used in the prompt
const platformGuidelines = {
  blog: {
    format: "Longer-form content with paragraphs, headings, and possibly lists",
    characteristics: "Detailed, informative, SEO-friendly, includes introduction and conclusion"
  },
  facebook: {
    format: "Medium-length post with engaging text, possibly with a question or call to action",
    characteristics: "Conversational, includes emojis, encourages engagement"
  },
  instagram: {
    format: "Short to medium caption that complements visual content",
    characteristics: "Visually descriptive, uses emojis, includes relevant hashtags"
  },
  twitter: {
    format: "Very concise posts (up to 280 characters)",
    characteristics: "Punchy, direct, often with hashtags and mentions"
  },
  linkedin: {
    format: "Professional post with a business focus, can be medium to long",
    characteristics: "Industry insights, professional tone, business value proposition"
  },
  youtube: {
    format: "Video script with intro, main content, and conclusion",
    characteristics: "Engaging, conversational, includes call-to-actions"
  },
  tiktok: {
    format: "Very short script for vertical video",
    characteristics: "Trendy, attention-grabbing, fast-paced, incorporates trends"
  },
  pinterest: {
    format: "Brief, descriptive text for image pins",
    characteristics: "Inspirational, instructional, focuses on visual aspects"
  }
};

export async function repurposeContent(request: RepurposeRequest): Promise<RepurposeResponse> {
  const { content, title, sourcePlatform, targetPlatform, tone = 'friendly', additionalInstructions = '' } = request;
  
  if (!content) {
    throw new Error('Content is required for repurposing');
  }

  const sourceGuide = platformGuidelines[sourcePlatform];
  const targetGuide = platformGuidelines[targetPlatform];
  
  const promptSystem = `You are a content repurposing expert. Your task is to transform content from one platform format to another while maintaining the core message and adapting to the target platform's best practices.`;
  
  const promptUser = `
I need to repurpose content from ${sourcePlatform} to ${targetPlatform}.

Original content${title ? ` titled "${title}"` : ''}:
${content}

Target platform (${targetPlatform}) guidelines:
Format: ${targetGuide.format}
Characteristics: ${targetGuide.characteristics}

Please use a ${tone} tone. ${additionalInstructions}

Provide the following in JSON format:
1. repurposedContent: The repurposed content for ${targetPlatform}
2. suggestedTitle: A catchy title if applicable to the target platform
3. suggestedHashtags: 3-5 relevant hashtags if applicable
4. suggestedImagePrompt: A short image prompt if the target platform is visual-focused
`;

  try {
    // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        { role: "system", content: promptSystem },
        { role: "user", content: promptUser }
      ],
      temperature: 0.7,
      response_format: { type: "json_object" }
    });

    const responseContent = response.choices[0].message.content;
    if (!responseContent) {
      throw new Error('Failed to generate repurposed content');
    }

    const result = JSON.parse(responseContent);
    
    return {
      repurposedContent: result.repurposedContent,
      suggestedTitle: result.suggestedTitle,
      suggestedHashtags: result.suggestedHashtags,
      suggestedImagePrompt: result.suggestedImagePrompt
    };
  } catch (error) {
    console.error("Error during content repurposing:", error);
    throw error;
  }
}