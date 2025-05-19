import Anthropic from "@anthropic-ai/sdk";
import axios from "axios";
import { ContentPrompt, GeneratedContent } from "./openai";
import { generateTemplatePrompt } from './template-handlers';

// Initialize AI clients with proper error handling
let anthropic: Anthropic | null = null;

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
 * Generate content using available API keys:
 * - Primarily uses Claude 3.7 since that API key is working
 * - Falls back to Perplexity for research if available
 */
export async function generateAdaptiveContent(contentPrompt: ContentPrompt): Promise<GeneratedContent> {
  console.log("Using adaptive content generator with Claude 3.7");
  console.log("Content prompt:", JSON.stringify(contentPrompt, null, 2));
  
  const { prompt, contentType, tone, length, personality, platform, template, templateData } = contentPrompt;
  const result: GeneratedContent = {
    text: "",
    sources: []
  };

  // Log API key status
  console.log("API Key status check:");
  console.log("Anthropic API Key:", process.env.ANTHROPIC_API_KEY ? "Present" : "Missing");
  console.log("Perplexity API Key:", process.env.PERPLEXITY_API_KEY ? "Present" : "Missing");

  try {
    // Step 1: Use Claude 3.7 for main content generation
    if (!anthropic) {
      throw new Error("Anthropic client not initialized - API key may be missing");
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

    If generating images is requested, please describe what the image should look like within [IMAGE DESCRIPTION] tags.
    
    Important guidelines:
    - Write in a human-like voice with natural flow
    - Use varied sentence structures and conversational language
    - Include interesting facts and insights
    - Make the content engaging and informative
    - Avoid generic statements and clichés
    `;

    console.log("Generating content with Claude 3.7...");
    const claudeResponse = await anthropic.messages.create({
      model: "claude-3-7-sonnet-20250219",
      system: systemPrompt,
      messages: [
        { role: "user", content: `Create content about: ${prompt}${templateData ? `\n\nUse this additional information: ${JSON.stringify(templateData)}` : ''}` }
      ],
      max_tokens: length === 'short' ? 1000 : length === 'long' ? 4000 : 2000,
    });

    let mainContent = "";
    if (claudeResponse.content && claudeResponse.content.length > 0) {
      const responseContent = claudeResponse.content[0];
      if ('text' in responseContent) {
        mainContent = responseContent.text;
      }
    }

    // Extract image description if present
    let imageDescription = "";
    const imageDescMatch = mainContent.match(/\[IMAGE DESCRIPTION\](.*?)\[\/IMAGE DESCRIPTION\]/s);
    if (imageDescMatch && imageDescMatch[1]) {
      imageDescription = imageDescMatch[1].trim();
      // Remove the image description from the main content
      mainContent = mainContent.replace(/\[IMAGE DESCRIPTION\](.*?)\[\/IMAGE DESCRIPTION\]/s, "");
    }
    
    // Step 2: For blog posts only, add research with Perplexity
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
          const citations = response.data.citations;
          
          // If we got useful citations, integrate them into the content
          if (citations.length > 0 && anthropic) {
            console.log("Integrating citations into content...");
            const citationsText = citations.map((url: string, i: number) => 
              `[${i+1}] ${url}`).join('\n');
            
            const integrationPrompt = `Enhance this content by appropriately integrating these sources as citations:
            
            CONTENT:
            ${mainContent}
            
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
                mainContent = finalContent.text;
              }
            }
            
            // Add sources to result
            result.sources = citations.map((url: string) => ({
              title: url.split('/').pop() || url,
              url: url,
              snippet: "Source citation"
            }));
          }
        }
      } catch (perplexityError) {
        console.error("Error getting Perplexity information:", perplexityError);
        // Continue without Perplexity data
      }
    }

    // Store text content
    result.text = mainContent;
    
    // Generate image if requested and we have an image description
    if ((contentType === 'image' || contentType === 'both') && imageDescription) {
      result.imageUrl = `https://placehold.co/600x400/orange/white?text=${encodeURIComponent("Image would be generated here")}`;
      
      // Note: In production, you'd integrate with your image generation API here
      console.log("Image would be generated with description:", imageDescription);
    }

    return result;
  } catch (error: any) {
    console.error("Error in adaptive content generator:", error);
    
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
  generateAdaptiveContent
};