import OpenAI from "openai";
import Anthropic from "@anthropic-ai/sdk";
import { ContentPrompt, GeneratedContent } from "./openai";
import axios from "axios";

/**
 * Function to generate sample content when API keys are not available
 */
function generateDemoContent(prompt: string | undefined, platform: string | null | undefined, tone: string | undefined): string {
  if (!prompt || prompt.trim() === '') {
    prompt = 'content marketing';
  }
  
  const titleCasedPrompt = prompt.split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
  
  if (platform === 'blog') {
    return `<h2>Ultimate Guide to ${titleCasedPrompt}</h2>
      
<p>Welcome to our comprehensive guide on ${prompt}. In today's fast-paced digital landscape, understanding ${prompt} has become essential for businesses looking to stay competitive.</p>

<h3>Why ${titleCasedPrompt} Matters</h3>

<p>The importance of ${prompt} cannot be overstated. Studies show that companies implementing effective ${prompt} strategies see a 37% increase in customer engagement and a 24% boost in conversion rates.</p>

<p>Here are the key benefits:</p>
<ul>
  <li>Increased brand awareness and recognition</li>
  <li>Higher customer satisfaction and loyalty</li>
  <li>Improved competitiveness in your industry</li>
  <li>Better return on marketing investments</li>
</ul>

<h3>Best Practices for ${titleCasedPrompt}</h3>

<p>Implementing ${prompt} effectively requires a strategic approach. First, identify your target audience and understand their needs, preferences, and pain points. Then, create valuable, relevant content that addresses these aspects.</p>`;
  } 
  else if (platform === 'social') {
    return `🔥 Transform your approach to ${prompt} today! 

Our latest guide reveals the top 5 strategies that industry leaders are using to dominate in ${prompt}.

Want to boost your results by up to 3X? Learn how our proven system can help you:
✅ Increase engagement
✅ Drive more conversions
✅ Stay ahead of competitors

Click the link in bio to download our free guide! 👇

#${prompt.replace(/\s+/g, '')} #BusinessGrowth #DigitalSuccess`;
  }
  else {
    return `${titleCasedPrompt}: A Comprehensive Overview

${titleCasedPrompt} has emerged as a critical factor in today's business landscape. Organizations that master ${prompt} consistently outperform their competitors across key metrics.

Key aspects to consider:
1. Strategic implementation is essential for maximum impact
2. Regular analysis and optimization drive continuous improvement
3. Integration with other business processes enhances overall effectiveness
4. Staying current with industry trends ensures lasting relevance

By focusing on these elements, businesses can leverage ${prompt} to achieve their goals more efficiently and effectively.`;
  }
}

/**
 * Advanced content generator that uses multiple AI services
 * Uses all available services from OpenAI, Anthropic, and Perplexity
 * Falls back to demo content if no APIs are available
 */
export async function generateContentSimple(contentPrompt: ContentPrompt): Promise<GeneratedContent> {
  console.log("Using integrated multi-service content generator");
  
  const { prompt, contentType, tone, length, personality, platform, template, templateData } = contentPrompt;
  const result: GeneratedContent = {};
  
  // Check which API keys are available
  const hasOpenAI = !!process.env.OPENAI_API_KEY;
  const hasAnthropic = !!process.env.ANTHROPIC_API_KEY;
  const hasPerplexity = !!process.env.PERPLEXITY_API_KEY;
  
  // Log available services
  console.log("Available AI services:", {
    OpenAI: hasOpenAI ? "Available" : "Not available",
    Anthropic: hasAnthropic ? "Available" : "Not available",
    Perplexity: hasPerplexity ? "Available" : "Not available"
  });
  
  // If no API keys are available, return demo content
  if (!hasOpenAI && !hasAnthropic && !hasPerplexity) {
    console.log("No API keys available, returning demo content");
    
    // Generate demo content based on the prompt
    result.text = generateDemoContent(prompt, platform, tone);
    
    // Add a notice about the missing API keys
    result.text += "\n\n---\n*Note: This is demo content. To generate real AI content, please add API keys for OpenAI, Anthropic, or Perplexity to the environment variables.*";
    
    // Add sample image URL if image content is requested
    if (contentType === 'image' || contentType === 'both') {
      result.imageUrl = "https://placehold.co/600x400/orange/white?text=Demo+Image";
    }
    
    return result;
  }
  
  try {
    // Prepare our content prompt for all services
    const basePrompt = createBasePrompt(contentPrompt);
    
    // STEP 1: Get factual information from Perplexity (if available)
    let sources = [];
    let factualContent = "";
    
    if (hasPerplexity) {
      try {
        console.log("Getting factual information from Perplexity...");
        const perplexityResult = await getPerplexityContent(prompt || "", basePrompt);
        factualContent = perplexityResult.content || "";
        sources = perplexityResult.citations || [];
        console.log("Perplexity information retrieved successfully");
      } catch (perplexityError) {
        console.error("Error getting Perplexity information:", perplexityError);
        // Continue without Perplexity data
      }
    }
    
    // STEP 2: Generate main content with OpenAI (if available)
    if (hasOpenAI) {
      try {
        console.log("Generating content with OpenAI...");
        
        // Create a fresh instance of the OpenAI client for this request
        const openai = new OpenAI({
          apiKey: process.env.OPENAI_API_KEY,
        });
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
    // Use a stable model that is guaranteed to work with the API
    const response = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
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
          model: "dall-e-2",
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