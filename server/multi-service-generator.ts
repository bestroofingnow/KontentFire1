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
 * Function to create the appropriate system prompt based on content requirements
 */
function createSystemPrompt(contentPrompt: ContentPrompt): string {
  const { platform, tone, length, personality, template, templateData } = contentPrompt;
  
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
  } else if (platform === 'linkedin') {
    platformInstructions = `
      Create professional, valuable content for LinkedIn:
      - Keep a professional but conversational tone
      - Demonstrate industry expertise
      - Include actionable insights or takeaways
      - Use paragraph breaks for readability
      - Add 3-5 relevant hashtags at the end
      - Pose a thought-provoking question to encourage comments
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
        Create a beginner's guide about ${templateData.topic || contentPrompt.prompt}.
        Include:
        - Fundamental concepts explained in simple terms
        - Step-by-step instructions for beginners
        - Common mistakes to avoid
        - Resources for learning more
      `;
    }
  }
  
  // Build the complete system prompt
  return `You are an expert content creator specializing in high-quality ${platform || 'general'} content.
  
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
}

/**
 * Generates content using OpenAI if the API key is available
 */
async function generateOpenAIContent(contentPrompt: ContentPrompt): Promise<string> {
  const { prompt, length, templateData } = contentPrompt;
  
  if (!process.env.OPENAI_API_KEY) {
    throw new Error("OpenAI API key not available");
  }
  
  // Create a fresh instance of the OpenAI client for this request
  const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  });
  
  // Prepare the request
  const systemPrompt = createSystemPrompt(contentPrompt);
  
  // Generate content with OpenAI
  const response = await openai.chat.completions.create({
    model: "gpt-4o", // the newest OpenAI model is "gpt-4o" which was released May 13, 2024
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: `Create content about: ${prompt}${templateData ? `\n\nUse this additional information: ${JSON.stringify(templateData)}` : ''}` }
    ],
    temperature: 0.7,
    max_tokens: length === 'short' ? 600 : length === 'long' ? 2500 : 1200,
  });
  
  return response.choices[0].message.content || "Unable to generate content.";
}

/**
 * Generates content using Anthropic Claude if the API key is available
 */
async function generateAnthropicContent(contentPrompt: ContentPrompt): Promise<string> {
  const { prompt, length, templateData } = contentPrompt;
  
  if (!process.env.ANTHROPIC_API_KEY) {
    throw new Error("Anthropic API key not available");
  }
  
  // Create a fresh instance of the Anthropic client for this request
  const anthropic = new Anthropic({
    apiKey: process.env.ANTHROPIC_API_KEY,
  });
  
  // Prepare the request
  const systemPrompt = createSystemPrompt(contentPrompt);
  
  // Generate content with Anthropic
  const response = await anthropic.messages.create({
    model: "claude-3-sonnet-20240229", // Use a stable model version that works with the current API
    system: systemPrompt,
    messages: [
      { role: "user", content: `Create content about: ${prompt}${templateData ? `\n\nUse this additional information: ${JSON.stringify(templateData)}` : ''}` }
    ],
    max_tokens: length === 'short' ? 600 : length === 'long' ? 3000 : 1500,
    temperature: 0.7,
  });
  
  return response.content[0].text || "Unable to generate content.";
}

/**
 * Generates research-backed content using Perplexity if the API key is available
 */
async function generatePerplexityContent(topic: string, systemPrompt: string): Promise<{content: string, citations: any[]}> {
  if (!process.env.PERPLEXITY_API_KEY) {
    throw new Error("Perplexity API key not available");
  }
  
  // Call Perplexity API
  const response = await axios.post('https://api.perplexity.ai/chat/completions', {
    model: "sonar-small-online", // Use a stable model that works with the current API
    messages: [
      { role: "system", content: "Provide factual, well-researched information with citations. Focus on accuracy and depth." },
      { role: "user", content: `Provide factual information about ${topic} that would help create content about it. Include recent statistics, trends, and important facts.` }
    ],
    max_tokens: 1000,
    temperature: 0.2,
  }, {
    headers: {
      'Authorization': `Bearer ${process.env.PERPLEXITY_API_KEY}`,
      'Content-Type': 'application/json',
    },
  });
  
  return {
    content: response.data.choices[0].message.content,
    citations: response.data.citations || []
  };
}

/**
 * Generate an image for the content using OpenAI DALL-E if the API key is available
 */
async function generateOpenAIImage(prompt: string): Promise<string | null> {
  if (!process.env.OPENAI_API_KEY) {
    throw new Error("OpenAI API key not available");
  }
  
  try {
    // Create a fresh instance of the OpenAI client for this request
    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
    
    const imageResponse = await openai.images.generate({
      model: "dall-e-3",
      prompt: `Create a high-quality, professional image for content about: ${prompt}. The image should be visually engaging and relevant to the topic. No text or words in the image.`,
      n: 1,
      size: "1024x1024",
    });
    
    return imageResponse.data[0].url || null;
  } catch (error) {
    console.error("Error generating image:", error);
    return null;
  }
}

/**
 * Multi-service content generator that tries to use all available AI services
 * Falls back gracefully when some services are unavailable
 */
export async function generateMultiServiceContent(contentPrompt: ContentPrompt): Promise<GeneratedContent> {
  console.log("Using multi-service content generator");
  
  const { prompt, contentType } = contentPrompt;
  const result: GeneratedContent = {};
  
  // Explicitly log the presence of API keys (truncated for security)
  console.log("API Key status check:");
  console.log("OpenAI API Key:", process.env.OPENAI_API_KEY ? `Present (starts with: ${process.env.OPENAI_API_KEY.substring(0, 3)}...)` : "Missing");
  console.log("Anthropic API Key:", process.env.ANTHROPIC_API_KEY ? `Present (starts with: ${process.env.ANTHROPIC_API_KEY.substring(0, 3)}...)` : "Missing");
  console.log("Perplexity API Key:", process.env.PERPLEXITY_API_KEY ? `Present (starts with: ${process.env.PERPLEXITY_API_KEY.substring(0, 3)}...)` : "Missing");
  
  // Check which API keys are available
  const hasOpenAI = !!process.env.OPENAI_API_KEY;
  const hasAnthropic = !!process.env.ANTHROPIC_API_KEY;
  const hasPerplexity = !!process.env.PERPLEXITY_API_KEY;
  
  console.log("Available AI services:", {
    OpenAI: hasOpenAI ? "Available" : "Not available",
    Anthropic: hasAnthropic ? "Available" : "Not available",
    Perplexity: hasPerplexity ? "Available" : "Not available"
  });
  
  // If no API keys are available, return demo content
  if (!hasOpenAI && !hasAnthropic && !hasPerplexity) {
    console.log("No API keys available, returning demo content");
    
    // Generate demo content based on the prompt
    result.text = generateDemoContent(prompt, contentPrompt.platform, contentPrompt.tone);
    
    // Add a notice about the missing API keys
    result.text += "\n\n---\n*Note: This is demo content. To generate real AI content, please add API keys for OpenAI, Anthropic, or Perplexity to the environment variables.*";
    
    // Add sample image URL if image content is requested
    if (contentType === 'image' || contentType === 'both') {
      result.imageUrl = "https://placehold.co/600x400/orange/white?text=Demo+Image";
    }
    
    return result;
  }
  
  try {
    // Try to use the services in this order: Perplexity (for research), Anthropic/OpenAI (for content)
    
    // Step 1: Try to get factual information from Perplexity
    let sources = [];
    let factualInfo = "";
    if (hasPerplexity) {
      try {
        console.log("Getting factual information from Perplexity...");
        const systemPrompt = createSystemPrompt(contentPrompt);
        const perplexityResult = await generatePerplexityContent(prompt || "", systemPrompt);
        factualInfo = perplexityResult.content;
        sources = perplexityResult.citations;
        console.log("Perplexity information retrieved successfully");
      } catch (perplexityError) {
        console.error("Error getting Perplexity information:", perplexityError);
        // Continue without Perplexity data
      }
    }
    
    // Step 2: Try to generate the main content with one of the available services
    if (hasOpenAI) {
      try {
        console.log("Generating content with OpenAI...");
        // Add factual info to the prompt if available
        if (factualInfo) {
          contentPrompt.prompt = `${prompt}\n\nHere's some factual information to incorporate: ${factualInfo}`;
        }
        result.text = await generateOpenAIContent(contentPrompt);
        console.log("Content generated successfully with OpenAI");
      } catch (openAIError) {
        console.error("Error generating content with OpenAI:", openAIError);
        // Try with Anthropic if available
        if (hasAnthropic) {
          console.log("Falling back to Anthropic...");
          result.text = await generateAnthropicContent(contentPrompt);
          console.log("Content generated successfully with Anthropic");
        } else {
          throw new Error("Failed to generate content with OpenAI and no fallback available");
        }
      }
    } else if (hasAnthropic) {
      try {
        console.log("Generating content with Anthropic...");
        // Add factual info to the prompt if available
        if (factualInfo) {
          contentPrompt.prompt = `${prompt}\n\nHere's some factual information to incorporate: ${factualInfo}`;
        }
        result.text = await generateAnthropicContent(contentPrompt);
        console.log("Content generated successfully with Anthropic");
      } catch (anthropicError) {
        console.error("Error generating content with Anthropic:", anthropicError);
        throw new Error("Failed to generate content with Anthropic and no fallback available");
      }
    } else if (hasPerplexity && factualInfo) {
      // If only Perplexity is available, use its information directly
      console.log("Using Perplexity information as content");
      result.text = factualInfo;
      console.log("Content generated with Perplexity information");
    }
    
    // Step 3: Generate an image if needed
    if ((contentType === 'image' || contentType === 'both') && hasOpenAI) {
      try {
        console.log("Generating image with DALL-E...");
        const imageUrl = await generateOpenAIImage(prompt || "");
        if (imageUrl) {
          result.imageUrl = imageUrl;
          console.log("Image generated successfully");
        }
      } catch (imageError) {
        console.error("Error generating image:", imageError);
        // Continue without image
      }
    } else if (contentType === 'image' || contentType === 'both') {
      // Use placeholder if OpenAI is not available for image generation
      result.imageUrl = "https://placehold.co/600x400/orange/white?text=Image+Unavailable";
    }
    
    // Step 4: Add sources if available
    if (sources && sources.length > 0) {
      result.sources = sources.map((citation: string) => ({
        title: "Reference",
        url: citation,
        snippet: "Source from Perplexity"
      }));
    }
    
    return result;
  } catch (error) {
    console.error("Multi-service content generation failed:", error);
    
    // Final fallback to demo content if all service approaches fail
    console.log("All services failed, falling back to demo content");
    result.text = generateDemoContent(prompt, contentPrompt.platform, contentPrompt.tone);
    result.text += "\n\n---\n*Note: This is demo content because AI service calls failed. Please check your API keys.*";
    
    if (contentType === 'image' || contentType === 'both') {
      result.imageUrl = "https://placehold.co/600x400/orange/white?text=Demo+Image";
    }
    
    return result;
  }
}