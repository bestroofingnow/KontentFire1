/**
 * Perplexity API integration for fact-checking and references
 */

export interface PerplexityResult {
  text: string;
  citations: string[];
  confidence: number;
}

export interface FactCheckRequest {
  text: string;
  context?: string;
}

export interface FactCheckResponse {
  result: 'accurate' | 'inaccurate' | 'unverifiable';
  explanation: string;
  corrections?: { original: string; corrected: string }[];
  citations: string[];
  confidence: number;
}

export interface ReferencesRequest {
  query: string;
  count?: number;
}

export interface ReferencesResponse {
  references: Array<{
    title: string;
    url: string;
    snippet: string;
  }>;
}

export async function factCheck(request: FactCheckRequest): Promise<FactCheckResponse> {
  const apiKey = process.env.PERPLEXITY_API_KEY;
  if (!apiKey) {
    throw new Error('PERPLEXITY_API_KEY is not defined');
  }

  const { text, context } = request;
  const prompt = context 
    ? `Please fact check the following statement in the context of ${context}:\n\n${text}` 
    : `Please fact check the following statement:\n\n${text}`;

  try {
    console.log("Making Perplexity API call for fact-checking...");
    const response = await fetch('https://api.perplexity.ai/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: "llama-3.1-sonar-small-128k-online",
        messages: [
          {
            role: "system",
            content: "You are a fact-checking expert. Analyze the statement for factual accuracy. Return your response in the following JSON format with fields: result (accurate/inaccurate/unverifiable), explanation, corrections (if any), and a confidence score between 0 and 1."
          },
          {
            role: "user",
            content: prompt
          }
        ],
        temperature: 0.2,
        max_tokens: 1000,
        top_p: 0.9,
        response_format: { type: "json_object" }
      })
    });

    if (!response.ok) {
      console.error(`Perplexity API error response: ${response.status} ${response.statusText}`);
      const errorText = await response.text();
      console.error(`Error response body: ${errorText}`);
      throw new Error(`Perplexity API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    console.log("Perplexity fact check response:", JSON.stringify(data, null, 2));
    
    const resultContent = JSON.parse(data.choices[0].message.content);
    
    // Extract citations from the response
    const citations = data.citations || [];

    return {
      result: resultContent.result || 'unverifiable',
      explanation: resultContent.explanation || 'Unable to verify this statement',
      corrections: resultContent.corrections || [],
      citations: citations,
      confidence: resultContent.confidence || 0.5
    };
  } catch (error) {
    console.error("Error during fact-checking:", error);
    throw error;
  }
}

export async function getReferences(request: ReferencesRequest): Promise<ReferencesResponse> {
  const apiKey = process.env.PERPLEXITY_API_KEY;
  if (!apiKey) {
    throw new Error('PERPLEXITY_API_KEY is not defined');
  }

  const { query, count = 5 } = request;

  try {
    console.log("Making Perplexity API call for references...");
    const response = await fetch('https://api.perplexity.ai/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: "llama-3.1-sonar-small-128k-online",
        messages: [
          {
            role: "system",
            content: `You are a reference search assistant. Find ${count} reliable sources related to the query and return them in JSON format with an array called "references" containing objects with title, url, and a short snippet for each reference.`
          },
          {
            role: "user",
            content: query
          }
        ],
        temperature: 0.3,
        max_tokens: 1000,
        top_p: 0.9,
        response_format: { type: "json_object" }
      })
    });

    if (!response.ok) {
      console.error(`Perplexity API error response: ${response.status} ${response.statusText}`);
      const errorText = await response.text();
      console.error(`Error response body: ${errorText}`);
      throw new Error(`Perplexity API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    console.log("Perplexity references response:", JSON.stringify(data, null, 2));
    
    const resultContent = JSON.parse(data.choices[0].message.content);
    
    // Extract references from the response
    const references = resultContent.references || [];

    return {
      references: references.map((ref: any) => ({
        title: ref.title || "Untitled Reference",
        url: ref.url || "#",
        snippet: ref.snippet || "No snippet available"
      }))
    };
  } catch (error) {
    console.error("Error fetching references:", error);
    throw error;
  }
}