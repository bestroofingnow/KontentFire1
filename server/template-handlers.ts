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
/**
 * Generate structured prompt for Basics 101 template - explaining fundamentals
 */
export function generateBasics101Prompt({
  templateData,
  tone = 'professional',
  personality = 'analytical',
  platform = 'blog'
}: TemplateHandlerOptions): string {
  const {
    topic,
    targetAudience = 'beginners',
    industry,
    keyPoints = [],
    includeFAQ = true,
    includeHistory = true,
    includeExamples = true
  } = templateData;

  if (!topic) {
    throw new Error('Missing required field for Basics 101 template: topic');
  }

  // Build the structured prompt
  let prompt = `Create a comprehensive "Basics 101" educational article about ${topic}`;
  
  if (industry) {
    prompt += ` for the ${industry} industry`;
  }
  
  prompt += ` aimed at ${targetAudience}.\n\n`;

  // Add introduction instructions
  prompt += `INTRODUCTION: Provide a clear, approachable introduction to ${topic} that explains why this knowledge is valuable and how it will benefit the reader. Establish the article as a foundational resource that assumes no prior knowledge of the subject.\n\n`;

  // Add core content structure
  prompt += `CORE CONTENT: Break down ${topic} into fundamental components that are easy to understand. Define all technical terms when they first appear. Use simple language and analogies to make complex ideas accessible.\n\n`;

  // Add key points if provided
  if (keyPoints && keyPoints.length > 0) {
    prompt += `Include these key learning points:\n`;
    keyPoints.forEach((point: string, index: number) => {
      prompt += `${index + 1}. ${point}\n`;
    });
    prompt += `\n`;
  }

  // Add optional sections based on preferences
  if (includeHistory) {
    prompt += `HISTORICAL CONTEXT: Include a brief section on the origins and evolution of ${topic} to provide context for why it exists in its current form.\n\n`;
  }

  if (includeExamples) {
    prompt += `PRACTICAL EXAMPLES: Provide real-world examples that illustrate ${topic} in action. Include step-by-step breakdowns or case studies that demonstrate practical applications.\n\n`;
  }

  if (includeFAQ) {
    prompt += `FREQUENTLY ASKED QUESTIONS: Include a section addressing common questions beginners have about ${topic}. Provide clear, concise answers that anticipate reader confusion points.\n\n`;
  }

  // Add conclusion instructions
  prompt += `CONCLUSION: Summarize the key takeaways about ${topic} and provide guidance on next steps for readers who want to learn more or apply this knowledge.\n\n`;

  // Add formatting guidelines
  prompt += `FORMAT: Create a well-structured educational article with clear headings, subheadings, bullet points where appropriate, and a logical progression from basic to more nuanced concepts. Use a ${tone} tone with a ${personality} personality. Optimize for ${platform} format.`;

  return prompt;
}

/**
 * Generate structured prompt for Myth Buster template - correcting misconceptions
 */
export function generateMythBusterPrompt({
  templateData,
  tone = 'professional',
  personality = 'analytical',
  platform = 'blog'
}: TemplateHandlerOptions): string {
  const {
    topic,
    industry,
    myths = [],
    includeTruthScale = true,
    includeOrigins = true,
    includeExpertQuotes = true
  } = templateData;

  if (!topic) {
    throw new Error('Missing required field for Myth Buster template: topic');
  }

  // Build the structured prompt
  let prompt = `Create a comprehensive "Myth Buster" article that addresses common misconceptions about ${topic}`;
  
  if (industry) {
    prompt += ` in the ${industry} industry`;
  }
  
  prompt += `.\n\n`;

  // Add introduction instructions
  prompt += `INTRODUCTION: Set up the problem of misinformation regarding ${topic} and why it matters to have accurate information. Explain the consequences of believing these myths and the benefits of understanding the truth.\n\n`;

  // Add myths if provided, otherwise request to identify common myths
  if (myths && myths.length > 0) {
    prompt += `ADDRESS THESE SPECIFIC MYTHS:\n`;
    myths.forEach((myth: any, index: number) => {
      const mythText = typeof myth === 'string' ? myth : myth.text;
      prompt += `MYTH #${index + 1}: "${mythText}"\n`;
      
      if (typeof myth !== 'string' && myth.reality) {
        prompt += `REALITY: ${myth.reality}\n`;
      }
      
      prompt += `\n`;
    });
  } else {
    prompt += `IDENTIFY AND ADDRESS: Research and present the 5-7 most common misconceptions about ${topic}. For each myth, clearly state the misconception, then thoroughly debunk it with evidence, explanations, and examples.\n\n`;
  }

  // Add optional sections based on preferences
  if (includeOrigins) {
    prompt += `MYTH ORIGINS: For each myth, include a brief explanation of how or why this misconception originated and why it persists.\n\n`;
  }

  if (includeTruthScale) {
    prompt += `TRUTH SCALE: For each myth, include a "Truth Scale" rating that indicates whether the myth is "Completely False," "Mostly False," "Partially True," or has a "Kernel of Truth" but is misleading. Explain the nuance behind each rating.\n\n`;
  }

  if (includeExpertQuotes) {
    prompt += `EXPERT PERSPECTIVES: Include references to what credible experts in the field say about these misconceptions. Reference recent research or authoritative sources that help debunk the myths.\n\n`;
  }

  // Add conclusion and actionable advice
  prompt += `CONCLUSION: Summarize the key truths that readers should remember about ${topic} and provide guidance on how to evaluate future claims or information they encounter on this subject.\n\n`;

  // Add formatting guidelines
  prompt += `FORMAT: Structure this as an engaging myth-busting article with clear headings for each myth, visual separation between myths and facts, and a conversational but authoritative style. Use a ${tone} tone with a ${personality} personality. Optimize for ${platform} format.`;

  return prompt;
}

/**
 * Generate structured prompt for Technical Guide template - detailed walkthrough
 */
export function generateTechnicalGuidePrompt({
  templateData,
  tone = 'professional',
  personality = 'analytical',
  platform = 'blog'
}: TemplateHandlerOptions): string {
  const {
    topic,
    audience = 'intermediate', // beginner, intermediate, advanced
    purpose, // e.g., "troubleshooting," "implementation," "optimization"
    prerequisites = [],
    sections = [],
    includeTroubleshooting = true,
    includeResourceList = true
  } = templateData;

  if (!topic) {
    throw new Error('Missing required field for Technical Guide template: topic');
  }

  // Build the structured prompt
  let prompt = `Create a comprehensive technical guide about ${topic} for ${audience}-level readers`;
  
  if (purpose) {
    prompt += ` focused on ${purpose}`;
  }
  
  prompt += `.\n\n`;

  // Add introduction instructions
  prompt += `INTRODUCTION: Provide a clear overview of what this guide covers, why ${topic} is important, and what readers will learn or be able to accomplish after reading. Define the scope of the guide and set appropriate expectations.\n\n`;

  // Add prerequisites if provided
  if (prerequisites && prerequisites.length > 0) {
    prompt += `PREREQUISITES: List these specific prerequisites readers should have before attempting to follow this guide:\n`;
    prerequisites.forEach((prereq: string, index: number) => {
      prompt += `${index + 1}. ${prereq}\n`;
    });
    prompt += `\n`;
  }

  // Add specific sections if provided, otherwise use a standard structure
  if (sections && sections.length > 0) {
    prompt += `INCLUDE THESE SPECIFIC SECTIONS:\n`;
    sections.forEach((section: any, index: number) => {
      const sectionTitle = typeof section === 'string' ? section : section.title;
      prompt += `SECTION ${index + 1}: ${sectionTitle}\n`;
      
      if (typeof section !== 'string' && section.content) {
        prompt += `${section.content}\n`;
      }
      
      prompt += `\n`;
    });
  } else {
    // Default technical guide structure
    prompt += `CORE CONTENT STRUCTURE: Organize the guide with these standard technical sections:\n`;
    prompt += `1. Overview of ${topic} - Conceptual foundation and architecture\n`;
    prompt += `2. Step-by-step implementation/process - Detailed walkthrough with code examples or precise instructions\n`;
    prompt += `3. Best practices - Industry standards and optimization techniques\n`;
    prompt += `4. Common pitfalls - Mistakes to avoid\n\n`;
  }

  // Add optional sections based on preferences
  if (includeTroubleshooting) {
    prompt += `TROUBLESHOOTING: Include a dedicated section addressing common problems and their solutions. Present these as problem-symptom-solution triads that help readers diagnose and fix issues.\n\n`;
  }

  if (includeResourceList) {
    prompt += `RESOURCE LIST: Conclude with a curated list of additional resources where readers can deepen their knowledge of ${topic}, including documentation, advanced tutorials, communities, and tools.\n\n`;
  }

  // Add formatting guidelines
  prompt += `FORMAT: Structure this as a detailed technical guide with clear headings, code blocks or technical diagrams where appropriate, numbered steps for processes, and callout boxes for important warnings or tips. Use a ${tone} tone with a ${personality} personality. Optimize for ${platform} format while maintaining technical accuracy and depth.`;

  return prompt;
}

/**
 * Generate structured prompt for The Case Against template - challenge conventional thinking
 */
export function generateCaseAgainstPrompt({
  templateData,
  tone = 'professional',
  personality = 'analytical',
  platform = 'blog'
}: TemplateHandlerOptions): string {
  const {
    topic,
    industry,
    mainArguments = [],
    audienceBeliefs = "",
    includeCounterarguments = true,
    includeAlternatives = true
  } = templateData;

  if (!topic) {
    throw new Error('Missing required field for Case Against template: topic');
  }

  // Build the structured prompt
  let prompt = `Create a thoughtful, evidence-based "The Case Against ${topic}" article`;
  
  if (industry) {
    prompt += ` focused on the ${industry} industry`;
  }
  
  prompt += `.\n\n`;

  // Add introduction instructions
  prompt += `INTRODUCTION: Begin by acknowledging the popularity or widespread acceptance of ${topic}. Establish your credibility by showing you understand why many people embrace it. Then introduce your thesis that despite its popularity, there are significant problems, limitations, or misconceptions with ${topic} that deserve critical examination.\n\n`;

  // Add context about the audience's current beliefs if provided
  if (audienceBeliefs) {
    prompt += `AUDIENCE CONTEXT: Your readers likely believe that ${audienceBeliefs}. Address these existing perspectives respectfully while challenging them.\n\n`;
  }

  // Add main arguments if provided, otherwise request to develop arguments
  if (mainArguments && mainArguments.length > 0) {
    prompt += `DEVELOP THESE MAIN ARGUMENTS AGAINST ${topic.toUpperCase()}:\n`;
    mainArguments.forEach((argument: any, index: number) => {
      const argumentText = typeof argument === 'string' ? argument : argument.text;
      prompt += `ARGUMENT #${index + 1}: ${argumentText}\n`;
      
      if (typeof argument !== 'string' && argument.evidence) {
        prompt += `EVIDENCE: ${argument.evidence}\n`;
      }
      
      prompt += `\n`;
    });
  } else {
    prompt += `DEVELOP ARGUMENTS: Research and present 3-5 substantial arguments against ${topic}, focusing on its limitations, unintended consequences, logical flaws, or evidence of ineffectiveness. For each argument, provide specific examples, data points, and reasoning.\n\n`;
  }

  // Add counter-arguments section if requested
  if (includeCounterarguments) {
    prompt += `ADDRESSING COUNTERARGUMENTS: For each main argument you make, acknowledge and respond to the strongest counterargument. This demonstrates intellectual honesty and strengthens your case by showing you've considered multiple perspectives.\n\n`;
  }

  // Add alternatives section if requested
  if (includeAlternatives) {
    prompt += `BETTER ALTERNATIVES: After making your case against ${topic}, suggest constructive alternatives or improvements. What approach would work better and why? This prevents the article from being merely critical without offering solutions.\n\n`;
  }

  // Add conclusion
  prompt += `CONCLUSION: Summarize your key arguments against ${topic} and clarify the specific contexts in which your critique applies (avoid overgeneralizing). Restate the importance of critically examining popular ideas and practices.\n\n`;

  // Add formatting guidelines
  prompt += `FORMAT: Structure this as a thoughtful contrarian piece that challenges conventional wisdom without being dismissive or disrespectful. Use evidence-based arguments rather than opinion. Maintain a ${tone} tone with a ${personality} personality. Optimize for ${platform} format while preserving nuance and intellectual depth.`;

  return prompt;
}

/**
 * Generate structured prompt for Checklist template - systematic evaluation framework
 */
export function generateChecklistPrompt({
  templateData,
  tone = 'professional',
  personality = 'analytical',
  platform = 'blog'
}: TemplateHandlerOptions): string {
  const {
    topic,
    purpose = "evaluation", // evaluation, preparation, troubleshooting, etc.
    industry,
    items = [],
    includeScoring = true,
    includePrioritization = true,
    includeResources = true
  } = templateData;

  if (!topic) {
    throw new Error('Missing required field for Checklist template: topic');
  }

  // Build the structured prompt
  let prompt = `Create a comprehensive checklist for ${purpose} of ${topic}`;
  
  if (industry) {
    prompt += ` in the ${industry} industry`;
  }
  
  prompt += `.\n\n`;

  // Add introduction instructions
  prompt += `INTRODUCTION: Explain why a systematic approach to ${topic} is important and how this checklist will help readers achieve better outcomes. Clarify who should use this checklist and when it should be used in the process.\n\n`;

  // Add checklist items if provided, otherwise request to develop items
  if (items && items.length > 0) {
    prompt += `INCLUDE THESE SPECIFIC CHECKLIST ITEMS:\n`;
    items.forEach((item: any, index: number) => {
      const itemText = typeof item === 'string' ? item : item.text;
      prompt += `ITEM #${index + 1}: ${itemText}\n`;
      
      if (typeof item !== 'string') {
        if (item.importance) prompt += `IMPORTANCE: ${item.importance}\n`;
        if (item.guidance) prompt += `GUIDANCE: ${item.guidance}\n`;
      }
      
      prompt += `\n`;
    });
  } else {
    prompt += `DEVELOP CHECKLIST: Research and present 10-15 essential items that should be on a checklist for ${topic}. For each item, provide a clear description of what to check, why it matters, and guidance on how to properly assess it.\n\n`;
  }

  // Add optional sections based on preferences
  if (includeScoring) {
    prompt += `SCORING SYSTEM: Include a simple scoring system or evaluation rubric that helps users interpret their results after completing the checklist. Explain what different scores mean and what actions they should trigger.\n\n`;
  }

  if (includePrioritization) {
    prompt += `PRIORITIZATION GUIDANCE: Label each checklist item with a priority level (Critical, High, Medium, Nice-to-have) and explain which items must be addressed first if resources are limited.\n\n`;
  }

  if (includeResources) {
    prompt += `RESOURCES AND TOOLS: For each major section of the checklist, recommend specific tools, templates, or resources that can help users more effectively complete that part of the assessment.\n\n`;
  }

  // Add instructions for implementation
  prompt += `IMPLEMENTATION GUIDE: Provide brief guidance on how to effectively use this checklist, including recommended frequency, team members who should be involved, and how to document the results.\n\n`;

  // Add formatting guidelines
  prompt += `FORMAT: Structure this as a practical, actionable checklist with clear categories, concise items, and logical organization. Make it easy to print or use digitally. Use a ${tone} tone with a ${personality} personality. Optimize for ${platform} format while maintaining utility as a practical tool.`;

  return prompt;
}

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
    
    case 'basics-101':
      return generateBasics101Prompt({ templateData, tone, personality, platform });
      
    case 'myth-buster':
      return generateMythBusterPrompt({ templateData, tone, personality, platform });
      
    case 'technical-guide':
      return generateTechnicalGuidePrompt({ templateData, tone, personality, platform });
      
    case 'case-against':
      return generateCaseAgainstPrompt({ templateData, tone, personality, platform });
      
    case 'checklist':
      return generateChecklistPrompt({ templateData, tone, personality, platform });
    
    // Default - just use the template name as context
    default:
      return templateData.prompt || `Create content about ${template}`;
  }
}