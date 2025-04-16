import Anthropic from '@anthropic-ai/sdk';

// Check for Anthropic API key
if (!process.env.ANTHROPIC_API_KEY) {
  console.error("Error: ANTHROPIC_API_KEY environment variable is not set");
}

// the newest Anthropic model is "claude-3-7-sonnet-20250219" which was released February 24, 2025
const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY || "",
});

/**
 * Enhance content by rewriting it with a more human-like approach
 * and integrating sources properly
 */
export async function enhanceContent(
  content: string, 
  sources: Array<{title: string, url: string, snippet: string}> = [],
  tone: string = 'professional',
  personality: string = 'thoughtful',
  platform: string = ''
): Promise<string> {
  
  // Define personality traits
  const personalityTraits: Record<string, string> = {
    thoughtful: "carefully consider different perspectives and present nuanced viewpoints. Ask reflective questions and acknowledge complexity. Show depth of thought and consideration.",
    enthusiastic: "be energetic and passionate about the topic. Use exclamation points occasionally, show genuine excitement, and focus on positive aspects. Be vibrant and uplifting.",
    skeptical: "question assumptions and conventional wisdom. Don't be cynical, but don't accept claims without evidence. Acknowledge uncertainties and examine issues from multiple angles.",
    inspirational: "focus on motivating and uplifting the reader. Use powerful metaphors, share personal anecdotes when relevant, and emphasize possibility. Evoke emotion and encourage action.",
    analytical: "break down complex topics systematically. Use logical reasoning, present evidence, and analyze causes and effects. Be clear, structured, and data-informed where possible."
  };
  
  // Platform-specific formatting instructions
  const platformFormatting: Record<string, string> = {
    blog: `
      Format your content with semantic HTML for a blog post:
      - Use <h2> and <h3> tags for headings (never <h1> which is reserved for the blog title)
      - Use <p> tags for paragraphs
      - Use <ul> and <li> tags for unordered lists
      - Use <ol> and <li> tags for ordered lists
      - Use <blockquote> tags for quotes
      - Use <strong> for important text and <em> for emphasized text
      - Include a proper structure with introduction, body (with subheadings), and conclusion
      - Add a call to action at the end
      - Make the content SEO-friendly with relevant keywords naturally integrated
      - Break up text with subheadings every 2-3 paragraphs for readability
      - IMPORTANT: When citing sources, use <a href="source-url">anchor text</a> format to properly link to them
    `,
    facebook: "Format for Facebook with short paragraphs and occasional emojis. Include a question or call to action at the end to encourage engagement.",
    instagram: "Format for Instagram with concise, engaging caption text. Use emojis and paragraph breaks strategically. Include relevant hashtags at the end.",
    gmb: "Format for Google My Business with concise, local-focused content. Highlight business information, services, or special offers clearly and directly.",
    linkedin: "Format for LinkedIn with professional, business-focused content structured in short paragraphs. Include industry insights and a professional call to action.",
    youtube: "Format as a video script with clear [INTRO], [BODY], and [CONCLUSION] sections. Include talking points, engagement prompts, and calls to action.",
    tiktok: "Format as a very brief, engaging script for TikTok with hooks, trends, and quick points that can be delivered in a fast-paced vertical video.",
    pinterest: "Create descriptive, inspirational text suitable for Pinterest pins. Focus on the visual aspects and include a clear, actionable headline."
  };

  // Prepare source information for Claude
  let sourcesText = '';
  if (sources && sources.length > 0) {
    sourcesText = "\n\nHere are sources to integrate into the content:\n";
    sources.forEach((source, index) => {
      sourcesText += `${index + 1}. Title: ${source.title}\n   URL: ${source.url}\n   Info: ${source.snippet}\n\n`;
    });
  }

  // Create the system prompt
  const systemPrompt = `You are an expert content editor and rewriter. You will rewrite the provided content to make it more human-like, engaging, and informative.

Use a ${tone} tone and a ${personality} perspective. ${personalityTraits[personality] || ""}

Your rewrite should:
1. Sound like it was written by a real human, with an authentic voice
2. Use varied sentence structures and occasional imperfections
3. Include personal observations or reflections where appropriate
4. Properly integrate the provided sources in a way that's natural and adds value
5. Include proper citations or links to sources where relevant
6. Enhance the factual accuracy using the provided sources
7. Maintain or improve the overall structure and flow
8. Optimize the content for the specified platform

${platform && platformFormatting[platform.toLowerCase()] ? platformFormatting[platform.toLowerCase()] : ''}

Write as a real human would:
- Use contractions (don't, can't, I've) and conversational language
- Include personal observations or asides occasionally
- Vary sentence length, including some shorter sentences for emphasis
- Use transitional phrases naturally, not formulaically
- Don't overuse adjectives or adverbs
- Include specific details rather than generic statements
- Express opinions when appropriate for the topic
`;

  try {
    console.log("Enhancing content with Claude...");
    
    // Check API key again before making the API call
    if (!process.env.ANTHROPIC_API_KEY) {
      console.error("ANTHROPIC_API_KEY is not set or is empty");
      return "Content enhancement failed: Anthropic API key is missing. Please check your environment variables.";
    }

    try {
      const message = await anthropic.messages.create({
        model: "claude-3-7-sonnet-20250219",
        max_tokens: 4000,
        temperature: 0.7,
        system: systemPrompt,
        messages: [
          { 
            role: 'user', 
            content: `Here is the content to rewrite and enhance:\n\n${content}${sourcesText}\n\nPlease rewrite this content to make it more human-like, engaging, and informative while properly integrating the sources provided.` 
          }
        ],
      });

      if (message.content && message.content.length > 0) {
        const responseContent = message.content[0];
        if ('text' in responseContent) {
          return responseContent.text;
        }
      }
      return "Unable to enhance content. The API response was not in the expected format.";
    } catch (apiError: any) {
      console.error("Anthropic API call failed:", apiError);
      if (apiError.message && apiError.message.includes("authentication")) {
        console.error("This appears to be an authentication issue with the Anthropic API key");
        return "Content enhancement failed: There was an authentication issue with the Anthropic API. Please check your API key.";
      }
      throw apiError;
    }
  } catch (error: any) {
    console.error("Error enhancing content with Claude:", error.message);
    throw new Error(`Failed to enhance content: ${error.message}`);
  }
}

export default {
  enhanceContent
};