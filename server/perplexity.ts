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
            content: "You are a fact-checking expert. Analyze the statement for factual accuracy. Return your response in the following format: result (accurate/inaccurate/unverifiable), explanation, list of corrections if any, and supporting citations. Include a confidence score between 0 and 1."
          },
          {
            role: "user",
            content: prompt
          }
        ],
        temperature: 0.2,
        response_format: { type: "json_object" }
      })
    });

    if (!response.ok) {
      throw new Error(`Perplexity API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    const resultContent = JSON.parse(data.choices[0].message.content);
    
    // Extract citations from the response
    const citations = data.citations || [];

    return {
      result: resultContent.result,
      explanation: resultContent.explanation,
      corrections: resultContent.corrections,
      citations: citations,
      confidence: resultContent.confidence
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
            content: `You are a reference search assistant. Find ${count} reliable sources related to the query and return them in JSON format with title, url, and a short snippet for each reference.`
          },
          {
            role: "user",
            content: query
          }
        ],
        temperature: 0.3,
        response_format: { type: "json_object" }
      })
    });

    if (!response.ok) {
      throw new Error(`Perplexity API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    const resultContent = JSON.parse(data.choices[0].message.content);
    
    // Extract citations from the response
    const references = resultContent.references || [];

    return {
      references: references.map((ref: any) => ({
        title: ref.title,
        url: ref.url,
        snippet: ref.snippet
      }))
    };
  } catch (error) {
    console.error("Error fetching references:", error);
    throw error;
  }
}