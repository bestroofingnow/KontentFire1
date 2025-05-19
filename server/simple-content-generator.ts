import OpenAI from "openai";
import { ContentPrompt, GeneratedContent } from "./openai";

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

/**
 * Simple content generator that uses only OpenAI
 * This is a fallback when the multi-service approach fails
 */
export async function generateContentSimple(contentPrompt: ContentPrompt): Promise<GeneratedContent> {
  console.log("Using simple content generator with OpenAI only");
  const { prompt, contentType, tone, length, personality, platform, template, templateData } = contentPrompt;
  
  const result: GeneratedContent = {};
  
  try {
    // Prepare system prompt based on requirements
    const systemPrompt = `You are an expert content creator with expertise in creating high-quality ${platform || 'general'} content.
    
    Create content with a ${tone || 'professional'} tone and a ${personality || 'thoughtful'} style.
    
    The content should be ${length || 'medium'} in length and provide valuable insights.
    
    ${platform === 'blog' 
      ? 'Format the content with proper HTML tags for a blog post, including <h2>, <h3>, <p>, <ul>, <li>, etc.'
      : platform === 'social'
        ? 'Create concise, engaging content suitable for social media, with hashtags if appropriate.'
        : ''}
    
    ${template && template !== 'standard' 
      ? `Use the ${template} template format for structuring the content.`
      : ''}
    `;
    
    // Generate the content
    console.log("Generating content with OpenAI...");
    // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: `Create content about: ${prompt}${templateData ? `\n\nUse this additional information: ${JSON.stringify(templateData)}` : ''}` }
      ],
      temperature: 0.7,
      max_tokens: length === 'short' ? 500 : length === 'long' ? 2000 : 1000,
    });
    
    // Extract the generated text
    result.text = response.choices[0].message.content || "Unable to generate content.";
    console.log("Content generated successfully with OpenAI");
    
    // Generate an image if needed
    if (contentType === 'image' || contentType === 'both') {
      console.log("Generating image with DALL-E...");
      try {
        const imageResponse = await openai.images.generate({
          model: "dall-e-3",
          prompt: `Create a high-quality, professional image for content about: ${prompt}. The image should be visually engaging and relevant to the topic. No text or words in the image.`,
          n: 1,
          size: "1024x1024",
        });
        
        result.imageUrl = imageResponse.data[0].url;
        console.log("Image generated successfully");
      } catch (imageError: any) {
        console.error("Error generating image:", imageError.message);
        // Continue without image
      }
    }
    
    return result;
  } catch (error: any) {
    console.error("Error in simple content generation:", error.message);
    throw new Error(`Failed to generate content: ${error.message}`);
  }
}