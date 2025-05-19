import OpenAI from "openai";
import Anthropic from "@anthropic-ai/sdk";
import axios from "axios";
import { ContentPrompt, GeneratedContent } from "./openai";
import { generateTemplatePrompt } from './template-handlers';

// Initialize AI clients
let openai: OpenAI | null = null;
let anthropic: Anthropic | null = null;

// Set up OpenAI client if API key is available
if (process.env.OPENAI_API_KEY) {
  try {
    openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
    console.log("OpenAI client initialized");
  } catch (error) {
    console.error("OpenAI initialization error:", error);
  }
}

// Set up Anthropic client if API key is available
if (process.env.ANTHROPIC_API_KEY) {
  try {
    anthropic = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY,
    });
    console.log("Anthropic client initialized");
  } catch (error) {
    console.error("Anthropic initialization error:", error);
  }
}

/**
 * Generate content using the preferred models:
 * - GPT-4 Turbo for initial content
 * - Claude 3.7 for rewriting
 * - Perplexity for blog fact-checking
 * - DALL-E 2 for images
 */
export async function generateFixedContent(contentPrompt: ContentPrompt): Promise<GeneratedContent> {
  console.log("Using fixed content generator with preferred models");
  const { prompt, contentType, tone, length, personality, platform, template, templateData } = contentPrompt;
  const result: GeneratedContent = {};

  // Log API key status
  console.log("API Key status check:");
  console.log("OpenAI API Key:", process.env.OPENAI_API_KEY ? "Present" : "Missing");
  console.log("Anthropic API Key:", process.env.ANTHROPIC_API_KEY ? "Present" : "Missing");
  console.log("Perplexity API Key:", process.env.PERPLEXITY_API_KEY ? "Present" : "Missing");

  try {
    // Step 1: Generate base content with OpenAI GPT-4-Turbo
    if (!openai) {
      throw new Error("OpenAI client not initialized - API key may be missing");
    }

    // Get template instructions if needed
    let templateInstructions = "";
    if (template && template !== 'standard') {
      templateInstructions = generateTemplatePrompt(template, templateData);
    }

    // Create system prompt
    const systemPrompt = `You are an expert content creator specializing in ${platform || 'various platforms'}.
    Create ${length || 'medium'}-length content with a ${tone || 'professional'} tone.
    Write in a ${personality || 'thoughtful'} style.
    
    ${platform ? `Format specifically for ${platform}.` : ''}
    ${templateInstructions}
    
    Important guidelines:
    - Write in a human-like voice with natural flow
    - Use varied sentence structures and conversational language
    - Include interesting facts and insights
    - Make the content engaging and informative
    - Avoid generic statements and clichés
    `;

    console.log("Generating content with GPT-4-Turbo...");
    const openaiResponse = await openai.chat.completions.create({
      model: "gpt-4-turbo",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: `Create content about: ${prompt}${templateData ? `\n\nUse this additional information: ${JSON.stringify(templateData)}` : ''}` }
      ],
      temperature: 0.7,
      max_tokens: length === 'short' ? 500 : length === 'long' ? 2000 : 1000,
    });

    const initialContent = openaiResponse.choices[0]?.message?.content || "";

    // Step 2: Enhance with Claude (for rewriting)
    let enhancedContent = initialContent;
    if (anthropic) {
      try {
        console.log("Enhancing content with Claude 3.7...");
        const claudePrompt = `Rewrite and enhance this content to make it more engaging and human-like:
        
        ${initialContent}
        
        Use a ${tone || 'professional'} tone and make it appropriate for ${platform || 'all platforms'}.`;

        const claudeResponse = await anthropic.messages.create({
          model: "claude-3-7-sonnet-20250219",
          messages: [{ role: "user", content: claudePrompt }],
          max_tokens: 4000,
        });

        if (claudeResponse.content && claudeResponse.content.length > 0) {
          const responseContent = claudeResponse.content[0];
          if ('text' in responseContent) {
            enhancedContent = responseContent.text;
          }
        }
      } catch (error) {
        console.error("Error enhancing content with Claude:", error);
        // Continue with OpenAI content if Claude fails
      }
    }

    // Step 3: For blog posts only, fact-check with Perplexity
    let citations = [];
    if (platform === 'blog' && process.env.PERPLEXITY_API_KEY) {
      try {
        console.log("Getting factual information from Perplexity for blog content...");
        
        const response = await axios.post(
          'https://api.perplexity.ai/chat/completions',
          {
            model: "llama-3.1-sonar-small-128k-online",
            messages: [
              {
                role: "system",
                content: "Research this topic thoroughly and provide factual information with citations."
              },
              {
                role: "user",
                content: `Research this topic and provide factual information about: ${prompt}`
              }
            ],
            temperature: 0.2,
            max_tokens: 1024,
            return_related_questions: false,
          },
          {
            headers: {
              'Authorization': `Bearer ${process.env.PERPLEXITY_API_KEY}`,
              'Content-Type': 'application/json'
            }
          }
        );

        if (response.data && response.data.citations) {
          citations = response.data.citations;
          
          // If we got useful citations, integrate them into the content
          if (citations.length > 0 && anthropic) {
            console.log("Integrating citations into content...");
            const citationsText = citations.map((url: string, i: number) => 
              `[${i+1}] ${url}`).join('\n');
            
            const integrationPrompt = `Enhance this content by appropriately integrating these sources as citations:
            
            CONTENT:
            ${enhancedContent}
            
            SOURCES TO INTEGRATE:
            ${citationsText}
            
            Add citation references like [1], [2], etc. where appropriate in the content.`;
            
            const finalResponse = await anthropic.messages.create({
              model: "claude-3-7-sonnet-20250219",
              messages: [{ role: "user", content: integrationPrompt }],
              max_tokens: 4000,
            });
            
            if (finalResponse.content && finalResponse.content.length > 0) {
              const finalContent = finalResponse.content[0];
              if ('text' in finalContent) {
                enhancedContent = finalContent.text;
              }
            }
          }
        }
      } catch (perplexityError) {
        console.error("Error getting Perplexity information:", perplexityError);
        // Continue without Perplexity data
      }
    }

    // Store text content
    result.text = enhancedContent;
    
    // Add sources if available
    if (citations.length > 0) {
      result.sources = citations.map((url: string) => ({
        title: url.split('/').pop() || url,
        url: url,
        snippet: "Source citation"
      }));
    }

    // Generate image if requested
    if (contentType === 'image' || contentType === 'both') {
      if (!openai) {
        throw new Error("OpenAI client not initialized for image generation");
      }
      
      console.log("Generating image with DALL-E 2...");
      const imagePrompt = `${prompt}\n\nIMPORTANT: Create an image WITHOUT any text, words, letters, numbers, or writing of any kind. The image should be purely visual with no text elements.`;
      
      try {
        const imageResponse = await openai.images.generate({
          model: "dall-e-2",
          prompt: imagePrompt,
          n: 1,
          size: "1024x1024",
          quality: "standard",
        });

        result.imageUrl = imageResponse.data[0]?.url;
      } catch (imageError) {
        console.error("Error generating image:", imageError);
        // Continue without image
      }
    }

    return result;
  } catch (error) {
    console.error("Error in fixed content generator:", error);
    
    // Generate fallback content if all else fails
    console.log("Generating fallback content...");
    
    // Simple placeholder image
    if (contentType === 'image' || contentType === 'both') {
      result.imageUrl = "https://placehold.co/600x400/orange/white?text=Content+Image";
    }
    
    // Simple placeholder text
    const titleCasedPrompt = prompt ? prompt.split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ') : "Content";
      
    if (platform === 'blog') {
      result.text = `<h2>Guide to ${titleCasedPrompt}</h2>
      <p>This is placeholder content about ${prompt || 'the requested topic'}.</p>
      <p>The content generation service encountered an error: ${error.message}</p>`;
    } else {
      result.text = `Here's information about ${prompt || 'the requested topic'}.\n\nContent generation error: ${error.message}`;
    }
    
    result.text += "\n\nPlease check your API keys and try again.";
    
    return result;
  }
}

export default {
  generateFixedContent
};