/**
 * Template handlers for structured content generation
 * Each handler generates a specialized prompt based on template data
 */

interface TemplateHandlerOptions {
  templateData: any;
  tone?: string;
  personality?: string;
  platform?: string;
}

/**
 * Generate structured prompt for Battle Royale template - comparing two options
 */
export function generateBattleRoyalePrompt({
  templateData,
  tone = 'professional',
  personality = 'analytical',
  platform = 'blog'
}: TemplateHandlerOptions): string {
  const {
    option1,
    option2,
    comparisonFocus,
    industry,
    introduction,
    rounds = ['costs', 'durability', 'performance', 'maintenance', 'sustainability'] as string[],
    roundLabels = {} as Record<string, string>
  } = templateData;

  if (!option1 || !option2 || !comparisonFocus) {
    throw new Error('Missing required fields for Battle Royale template');
  }

  // Define default round titles and descriptions
  const defaultRoundInfo = {
    costs: {
      title: "ROUND 1: INITIAL COSTS & INSTALLATION",
      description: `Compare ${option1} and ${option2} on upfront investment and implementation factors related to ${comparisonFocus}. Evaluate material expenses, installation complexity, and project timeline requirements. Score each contender on cost-effectiveness, ease of application, and speed-to-completion for ${industry || ''} projects.`
    },
    durability: {
      title: "ROUND 2: DURABILITY & LIFESPAN",
      description: `Pit ${option1} against ${option2} in longevity and resilience for ${comparisonFocus} applications. Assess weather resistance capabilities, structural integrity under stress, and expected service life in real-world conditions. Score each contender on how effectively it withstands environmental challenges while maintaining performance over time.`
    },
    performance: {
      title: "ROUND 3: PERFORMANCE FACTORS",
      description: `Challenge ${option1} and ${option2} on functional capabilities specific to ${comparisonFocus}. Measure energy efficiency contributions, load capacity specifications, and adaptability across different conditions. Score each contender on how effectively it delivers on key performance metrics that impact ${industry || 'business'} operations.`
    },
    maintenance: {
      title: "ROUND 4: MAINTENANCE REQUIREMENTS",
      description: `Test ${option1} versus ${option2} on long-term care demands for ${comparisonFocus} systems. Evaluate routine maintenance needs, repair complexity when issues arise, and projected costs over the system's lifetime. Score each contender on how efficiently it minimizes maintenance burden and associated expenses.`
    },
    sustainability: {
      title: "ROUND 5: SUSTAINABILITY CREDENTIALS",
      description: `Match ${option1} against ${option2} on environmental impact related to ${comparisonFocus}. Assess recycled content percentages, end-of-life recyclability options, and overall ecological footprint. Score each contender on how effectively it supports sustainability goals while ensuring regulatory compliance.`
    },
    specialized: {
      title: "ROUND 6: SPECIALIZED APPLICATIONS",
      description: `Challenge ${option1} and ${option2} in specialized scenarios involving ${comparisonFocus}. Evaluate unique advantages for specific situations, benefits for particular ${industry || 'business'} types, and compatibility with existing systems. Score each contender on flexibility and effectiveness across diverse application requirements.`
    }
  };

  // Build the structured prompt
  let prompt = `Create a detailed "Battle Royale" comparison between ${option1} and ${option2} in the context of ${comparisonFocus}`;
  
  if (industry) {
    prompt += ` for the ${industry} industry`;
  }
  
  prompt += ".\n\n";

  // Add introduction
  prompt += `INTRODUCTION: ${introduction || `Set the stage for today's Battle Royale by highlighting the high-stakes nature of ${comparisonFocus} decisions ${industry ? `in ${industry}` : ''}. Emphasize financial implications and consequences of wrong choices. Create urgency by framing this as a critical business decision affecting long-term bottom line.`}\n\n`;

  // Add each round
  rounds.forEach((round: string, index: number) => {
    const roundKey = round.toLowerCase().replace(/\s+/g, '-');
    const customTitle = roundLabels[roundKey] || '';
    
    // Use default round info if available, otherwise use custom round info
    const roundInfo = defaultRoundInfo[roundKey as keyof typeof defaultRoundInfo] || {
      title: customTitle || `ROUND ${index + 1}: ${roundKey.toUpperCase().replace(/-/g, ' ')}`,
      description: `Compare ${option1} and ${option2} on aspects related to ${roundKey} in the context of ${comparisonFocus}.`
    };

    prompt += `${roundInfo.title}\n${roundInfo.description}\n\n`;
  });

  // Add final verdict instructions
  prompt += `FINAL VERDICT: Based on all rounds, provide a clear assessment of which option (${option1} or ${option2}) is better for different scenarios. Explain which option would be best for different types of users or situations. Create a simple scoring summary showing which option won each round, and declare an overall champion based on the total score.\n\n`;

  // Add formatting guidelines
  prompt += `FORMAT: Format this Battle Royale as a well-structured article with clear headings, engaging battle metaphors, and visually distinguishable sections. For each round, declare a clear winner and explain why. Use a ${tone} tone with a ${personality} personality.`;

  return prompt;
}

/**
 * Creates a template-specific prompt based on template type and data
 */
export function generateTemplatePrompt(
  template: string,
  templateData: any,
  tone: string = 'professional',
  personality: string = 'analytical',
  platform: string = 'blog'
): string {
  // Select template handler based on template type
  switch (template) {
    case 'battle-royale':
      return generateBattleRoyalePrompt({ templateData, tone, personality, platform });
    
    // Additional template handlers to be implemented
    case 'basics-101':
    case 'myth-buster':
    case 'technical-guide':
    case 'case-against':
    case 'checklist':
      // Placeholder for future template implementations
      throw new Error(`Template ${template} not yet implemented`);
    
    // Default - just use the template name as context
    default:
      return templateData.prompt || `Create content about ${template}`;
  }
}