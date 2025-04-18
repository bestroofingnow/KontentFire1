/**
 * AI Assistant API service
 * Handles integrating Claude API for chat assistant capabilities.
 */
import Anthropic from '@anthropic-ai/sdk';
import OpenAI from 'openai';
import { getReferences } from './perplexity';

let anthropic: Anthropic;
let openai: OpenAI;

try {
  // Initialize the Anthropic and OpenAI APIs
  anthropic = new Anthropic({
    apiKey: process.env.ANTHROPIC_API_KEY,
  });

  openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  });
} catch (error) {
  console.error("Error initializing AI assistants:", error);
}

/**
 * Main assistant function to handle user messages
 * Uses Claude for conversational responses and integrates knowledge from Perplexity
 */
export async function processAssistantMessage(
  message: string, 
  history: Array<{role: string, content: string}> = []
): Promise<string> {
  try {
    // For certain content requests, we can enhance responses with Perplexity references
    let enrichedPrompt = message;
    let references: Array<{title: string, snippet: string}> = [];

    // Check if the message is asking for facts or industry insights
    const needsFactualInfo = /industry|trends|statistics|data|facts|research|information about/i.test(message);
    
    if (needsFactualInfo) {
      try {
        // Get relevant information using Perplexity
        const referencesData = await getReferences({ 
          query: message,
          count: 3
        });
        
        if (referencesData && referencesData.references.length > 0) {
          references = referencesData.references;
          
          // Enrich the prompt with the references
          enrichedPrompt = `${message}\n\nHere are some relevant facts that might help you provide a better response:\n\n${
            references.map((ref, i) => `${i+1}. ${ref.title}: ${ref.snippet}`).join('\n\n')
          }`;
        }
      } catch (error) {
        console.error("Error enriching assistant prompt with references:", error);
      }
    }

    // Decide which model to use based on the request
    let useClaudeForResponse = true;
    
    // For content creation strategy, SEO advice, or business guidance, prefer Claude
    const requiresCreativity = /strategy|content ideas|brainstorm|creative|marketing|campaign/i.test(message);
    
    // For technical questions or specific platform details, prefer OpenAI
    const requiresTechnical = /code|html|css|wordpress|shopify|api|integration|plugin/i.test(message);
    
    if (requiresTechnical && !requiresCreativity) {
      useClaudeForResponse = false;
    }
    
    // Format conversation history for the AI models
    const formattedHistory = history.map(msg => ({
      role: msg.role as 'user' | 'assistant',
      content: msg.content
    }));
    
    let response = "";
    
    if (useClaudeForResponse && anthropic) {
      // Use Claude for most responses (better for creative, strategic content)
      // Claude API v2 uses system prompt as a separate parameter
      const claudeResponse = await anthropic.messages.create({
        model: 'claude-3-7-sonnet-20250219', // the newest Anthropic model is "claude-3-7-sonnet-20250219" which was released February 24, 2025
        max_tokens: 1000,
        system: `You are a helpful AI assistant for Kontent Fire, a content creation and management platform. 
          Your expertise is in content marketing, social media strategy, SEO, and content repurposing.
          You help users understand how to create effective content, optimize it for various platforms, 
          and manage their content workflow across blogs and social media.
          Provide concise, actionable advice that users can immediately apply to their content strategy.
          For WordPress and Shopify integrations, explain that users need to connect their accounts in the 
          Integrations section and provide high-level guidance on optimizing content for these platforms.`,
        messages: [
          ...formattedHistory,
          { role: 'user', content: enrichedPrompt }
        ],
      });
      
      // Access the text content of the first content block
      response = claudeResponse.content[0].type === 'text' 
        ? claudeResponse.content[0].text 
        : "Could not process response from Claude";
    } else if (openai) {
      // Use OpenAI for technical questions
      const openAIResponse = await openai.chat.completions.create({
        model: "gpt-4o", // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
        messages: [
          {
            role: 'system',
            content: `You are a helpful AI assistant for Kontent Fire, a content creation and management platform. 
            Your expertise is in content marketing, social media strategy, SEO, and content repurposing.
            You specialize in technical guidance for WordPress and Shopify integrations, API usage,
            and platform-specific optimizations. Provide practical, implementable advice that users
            can apply when setting up their content workflows and integrations.`
          },
          ...formattedHistory.map(msg => ({
            role: msg.role as 'user' | 'assistant',
            content: msg.content
          })),
          { role: 'user', content: enrichedPrompt }
        ],
        max_tokens: 1000,
      });
      
      response = openAIResponse.choices[0].message.content || "";
    } else {
      throw new Error("No AI assistant service is available");
    }
    
    // If we have references and they weren't directly acknowledged in the response,
    // append a note about them
    if (references.length > 0 && !response.includes("According to") && !response.includes("Based on")) {
      response += `\n\n(This information is supported by content from ${references.map(r => r.title).join(", ")})`;
    }
    
    return response;
  } catch (error) {
    console.error("Error processing assistant message:", error);
    return "I'm having trouble responding right now. Please try again later.";
  }
}