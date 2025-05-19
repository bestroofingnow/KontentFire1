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
        top_p: 0.9
        // Removed response_format parameter since it's causing issues
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
    
    let resultContent;
    try {
      // Try to parse JSON from the content
      const contentText = data.choices[0].message.content;
      // Try to find JSON in the response, which might be wrapped in markdown code blocks
      const jsonMatch = contentText.match(/```(?:json)?\s*({[\s\S]*?})\s*```/) || 
                        contentText.match(/{[\s\S]*?}/);
      
      if (jsonMatch) {
        resultContent = JSON.parse(jsonMatch[1] || jsonMatch[0]);
      } else {
        // If no JSON found, create a basic structure
        resultContent = {
          result: 'unverifiable',
          explanation: contentText,
          confidence: 0.5
        };
      }
    } catch (parseError) {
      console.warn("Failed to parse JSON from response:", parseError);
      resultContent = {
        result: 'unverifiable',
        explanation: data.choices[0].message.content,
        confidence: 0.5
      };
    }
    
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
    console.error('PERPLEXITY_API_KEY is not defined');
    throw new Error('Perplexity API key is missing - unable to retrieve references');
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
        top_p: 0.9
        // Removed response_format parameter since it's causing issues
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
    
    let resultContent;
    try {
      // Try to parse JSON from the content
      const contentText = data.choices[0].message.content;
      // Try to find JSON in the response, which might be wrapped in markdown code blocks
      const jsonMatch = contentText.match(/```(?:json)?\s*({[\s\S]*?})\s*```/) || 
                        contentText.match(/{[\s\S]*?}/);
      
      if (jsonMatch) {
        resultContent = JSON.parse(jsonMatch[1] || jsonMatch[0]);
      } else {
        // If no JSON found, create a basic structure with references
        resultContent = {
          references: []
        };
      }
    } catch (parseError) {
      console.warn("Failed to parse JSON from response:", parseError);
      resultContent = {
        references: []
      };
    }
    
    // Extract references from the response
    const references = resultContent.references || [];

    // If references is empty, try to extract references from citations
    if (references.length === 0 && data.citations && data.citations.length > 0) {
      data.citations.forEach((citation: string, index: number) => {
        references.push({
          title: `Reference ${index + 1}`,
          url: citation,
          snippet: "Citation from Perplexity"
        });
      });
    }

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