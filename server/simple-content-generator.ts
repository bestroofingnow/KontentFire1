import OpenAI from "openai";
import { ContentPrompt, GeneratedContent } from "./openai";

/**
 * Simple content generator that uses only OpenAI with direct API calls
 * This is a more reliable alternative to the multi-service approach
 */
export async function generateContentSimple(contentPrompt: ContentPrompt): Promise<GeneratedContent> {
  console.log("Using direct OpenAI content generator");
  
  // Validate OpenAI API Key
  if (!process.env.OPENAI_API_KEY) {
    console.error("OPENAI_API_KEY is missing or empty");
    throw new Error("OpenAI API key is required for content generation");
  }
  
  // Create a fresh instance of the OpenAI client for this request
  const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  });
  
  const { prompt, contentType, tone, length, personality, platform, template, templateData } = contentPrompt;
  
  const result: GeneratedContent = {};
  
  try {
    // Format instructions based on platform
    let platformInstructions = '';
    if (platform === 'blog') {
      platformInstructions = `
        Format your content with semantic HTML for a blog post:
        - Use <h2> and <h3> tags for headings (never <h1> which is reserved for the blog title)
        - Use <p> tags for paragraphs
        - Use <ul> and <li> tags for unordered lists
        - Use <ol> and <li> tags for ordered lists
        - Use <blockquote> tags for quotes
        - Use <strong> for important text and <em> for emphasized text
        - Include a proper structure with introduction, body (with subheadings), and conclusion
        - Add a call to action at the end
        - Break up text with subheadings every 2-3 paragraphs for readability
      `;
    } else if (platform === 'social') {
      platformInstructions = `
        Create concise, engaging content suitable for social media:
        - Keep paragraphs short (1-2 sentences)
        - Use emojis strategically 
        - Add relevant hashtags at the end
        - Include a question or call to action to encourage engagement
        - Make the content shareable and attention-grabbing
      `;
    }
    
    // Template handling
    let templateInstructions = '';
    if (template && template !== 'standard') {
      templateInstructions = `Use the ${template} template format for structuring the content.`;
      
      if (template === 'battle-royale' && templateData) {
        templateInstructions = `
          Create a comparison between ${templateData.option1} and ${templateData.option2}.
          Include the following sections:
          - Introduction to both options
          - Direct feature-by-feature comparison
          - Pros and cons of each option
          - Scenarios where each option excels
          - Final verdict and recommendation
        `;
      } else if (template === 'basics-101' && templateData) {
        templateInstructions = `
          Create a beginner's guide about ${templateData.topic || prompt}.
          Include:
          - Fundamental concepts explained in simple terms
          - Step-by-step instructions for beginners
          - Common mistakes to avoid
          - Resources for learning more
        `;
      }
    }
    
    // Prepare comprehensive system prompt
    const systemPrompt = `You are an expert content creator specializing in high-quality ${platform || 'general'} content.
    
    Create content with a ${tone || 'professional'} tone and a ${personality || 'thoughtful'} style.
    The content should be ${length || 'medium'} in length and provide valuable insights.
    
    ${platformInstructions}
    ${templateInstructions}
    
    Important guidelines:
    - Write in a human-like voice with natural flow
    - Use varied sentence structures and conversational language
    - Include interesting facts and insights
    - Make the content engaging and informative
    - Avoid generic statements and clichés
    `;
    
    console.log("Generating content with direct OpenAI call...");
    // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: `Create content about: ${prompt}${templateData ? `\n\nUse this additional information: ${JSON.stringify(templateData)}` : ''}` }
      ],
      temperature: 0.7,
      max_tokens: length === 'short' ? 600 : length === 'long' ? 2500 : 1200,
    });
    
    // Extract the generated text
    result.text = response.choices[0].message.content || "Unable to generate content.";
    console.log("Content text generated successfully");
    
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
    
    // Add placeholder sources if needed
    result.sources = [];
    
    return result;
  } catch (error: any) {
    console.error("Error in OpenAI content generation:", error.message);
    console.error("Error details:", error);
    throw new Error(`Failed to generate content: ${error.message}`);
  }
}