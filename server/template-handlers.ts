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

/**
 * Generate structured prompt for Deep Dive (5 Whys) template - root cause analysis
 */
export function generateDeepDivePrompt({
  templateData,
  tone = 'professional',
  personality = 'analytical',
  platform = 'blog'
}: TemplateHandlerOptions): string {
  const {
    topic,
    industry,
    areas = [],
    includeActionItems = true,
    includeExpertInsights = true
  } = templateData;

  if (!topic) {
    throw new Error('Missing required field for Deep Dive template: topic');
  }

  // Build the structured prompt
  let prompt = `Create a comprehensive "Deep Dive (5 Whys)" analysis of ${topic}`;
  
  if (industry) {
    prompt += ` within the ${industry} industry`;
  }
  
  prompt += `.\n\n`;

  // Add introduction instructions
  prompt += `INTRODUCTION: Provide an overview of ${topic} and why understanding its root causes matters. Explain the 5 Whys methodology as a technique for identifying underlying issues by repeatedly asking "Why?" to dig deeper beyond surface-level problems.\n\n`;

  // Add content structure for breaking down the topic into areas
  prompt += `CORE STRUCTURE: Break down ${topic} into 6 distinct areas of importance. For each area:\n`;
  prompt += `1. Identify and describe the area clearly\n`;
  prompt += `2. List 3 specific problems or challenges within this area\n`;
  prompt += `3. For each problem, apply the "5 Whys" format - ask "Why?" five times, with each answer being a single, clear sentence that leads deeper toward the root cause\n`;
  prompt += `4. After the fifth "Why," identify the root cause and its implications\n\n`;

  // Add specific areas if provided
  if (areas && areas.length > 0) {
    prompt += `INCLUDE THESE SPECIFIC AREAS:\n`;
    areas.forEach((area: string, index: number) => {
      prompt += `AREA ${index + 1}: ${area}\n`;
    });
    prompt += `\n`;
  }

  // Add optional sections based on preferences
  if (includeActionItems) {
    prompt += `ACTION ITEMS: For each area, after identifying root causes, provide 2-3 specific, actionable recommendations to address these fundamental issues. Make these practical and implementable.\n\n`;
  }

  if (includeExpertInsights) {
    prompt += `EXPERT INSIGHTS: Include relevant expert perspectives or industry best practices that provide additional context for understanding and addressing each area's root causes.\n\n`;
  }

  // Add conclusion instructions
  prompt += `CONCLUSION: Synthesize the key findings across all areas. Identify common patterns or interconnections between different root causes. Provide a holistic perspective on addressing ${topic} based on this deep analysis.\n\n`;

  // Add formatting guidelines
  prompt += `FORMAT: Structure this as an analytical deep dive with clear headings for each area, visual distinction for each level of "Why" questions, and a professional presentation that makes complex analysis accessible. Use a ${tone} tone with a ${personality} personality. Optimize for ${platform} format.`;

  return prompt;
}

/**
 * Generate structured prompt for Rookie or Pro template - solution evaluation
 */
export function generateRookieOrProPrompt({
  templateData,
  tone = 'professional',
  personality = 'analytical',
  platform = 'blog'
}: TemplateHandlerOptions): string {
  const {
    topic,
    industry,
    scenarios = [],
    includeRatings = true,
    includeExpertQuotes = true
  } = templateData;

  if (!topic) {
    throw new Error('Missing required field for Rookie or Pro template: topic');
  }

  // Build the structured prompt
  let prompt = `Create an engaging "Rookie or Pro?" analysis article about solutions for ${topic}`;
  
  if (industry) {
    prompt += ` in the ${industry} industry`;
  }
  
  prompt += `.\n\n`;

  // Add introduction instructions
  prompt += `INTRODUCTION: Set up the importance of making good decisions regarding ${topic}. Explain that this article will present various scenarios and solutions, asking readers to evaluate whether each approach is a "Rookie move" or a "Pro move" before revealing the answer.\n\n`;

  // Add content structure for scenarios
  prompt += `CORE STRUCTURE: For each scenario:\n`;
  prompt += `1. Describe a specific problem related to ${topic}\n`;
  prompt += `2. Present a potential solution in detail without indicating whether it's good or bad\n`;
  prompt += `3. Pose the question: "Is this a Rookie or Pro move?"\n`;
  prompt += `4. Provide the answer: "It's a Pro move" or "It's a Rookie move"\n`;
  prompt += `5. Explain in detail why this solution is effective (Pro) or ineffective (Rookie)\n`;
  prompt += `6. If it's a Rookie move, provide the Pro alternative solution\n\n`;

  // Add specific scenarios if provided
  if (scenarios && scenarios.length > 0) {
    prompt += `INCLUDE THESE SPECIFIC SCENARIOS:\n`;
    scenarios.forEach((scenario: any, index: number) => {
      const scenarioDesc = typeof scenario === 'string' ? scenario : scenario.problem;
      prompt += `SCENARIO ${index + 1}: ${scenarioDesc}\n`;
      
      if (typeof scenario !== 'string' && scenario.solution) {
        prompt += `Potential solution: ${scenario.solution}\n`;
        if (scenario.isProMove !== undefined) {
          prompt += `This is a ${scenario.isProMove ? 'Pro' : 'Rookie'} move.\n`;
        }
      }
      
      prompt += `\n`;
    });
  } else {
    prompt += `CREATE 5-7 DIVERSE SCENARIOS: Develop a range of realistic problems related to ${topic} that represent common challenges or decisions. Create a mix of Pro and Rookie solutions.\n\n`;
  }

  // Add optional sections based on preferences
  if (includeRatings) {
    prompt += `EFFECTIVENESS RATINGS: For each Pro solution, include a rating scale (1-10) that evaluates the solution on factors like cost-effectiveness, time efficiency, and long-term sustainability.\n\n`;
  }

  if (includeExpertQuotes) {
    prompt += `EXPERT PERSPECTIVES: Include quotes or insights from industry professionals that reinforce why the Pro solutions are recommended and explain the pitfalls of Rookie approaches.\n\n`;
  }

  // Add conclusion instructions
  prompt += `CONCLUSION: Summarize the key patterns that distinguish Rookie from Pro approaches to ${topic}. Provide general principles that readers can apply to evaluate other solutions they encounter.\n\n`;

  // Add formatting guidelines
  prompt += `FORMAT: Structure this as an interactive and engaging article with clear scenario breakdowns, visually distinct "Rookie or Pro?" questions, and reveal sections. Make it conversational yet informative. Use a ${tone} tone with a ${personality} personality. Optimize for ${platform} format.`;

  return prompt;
}

/**
 * Generate structured prompt for Resource Roundup template - curated resources
 */
export function generateResourceRoundupPrompt({
  templateData,
  tone = 'professional',
  personality = 'analytical',
  platform = 'blog'
}: TemplateHandlerOptions): string {
  const {
    topic,
    industry,
    resourceCategories = [],
    includeRatings = true,
    includePricingInfo = true,
    includeDifficultyLevels = true
  } = templateData;

  if (!topic) {
    throw new Error('Missing required field for Resource Roundup template: topic');
  }

  // Build the structured prompt
  let prompt = `Create a comprehensive "Resource Roundup" article with curated resources about ${topic}`;
  
  if (industry) {
    prompt += ` for the ${industry} industry`;
  }
  
  prompt += `.\n\n`;

  // Add introduction instructions
  prompt += `INTRODUCTION: Explain why ${topic} is important and why having access to quality resources is valuable. Set up the purpose of this roundup as saving readers time by providing carefully selected, high-quality resources.\n\n`;

  // Add content structure for resource categories
  prompt += `CORE STRUCTURE: Organize resources into clear categories. For each category:\n`;
  prompt += `1. Provide a brief overview of why this type of resource is helpful for ${topic}\n`;
  prompt += `2. List 3-7 specific resources with descriptions of each\n`;
  prompt += `3. For each resource, include a direct link (or placeholder), a concise description, and what makes it uniquely valuable\n\n`;

  // Add specific resource categories if provided
  if (resourceCategories && resourceCategories.length > 0) {
    prompt += `INCLUDE THESE SPECIFIC RESOURCE CATEGORIES:\n`;
    resourceCategories.forEach((category: string, index: number) => {
      prompt += `CATEGORY ${index + 1}: ${category}\n`;
    });
    prompt += `\n`;
  } else {
    prompt += `CREATE THESE STANDARD RESOURCE CATEGORIES:\n`;
    prompt += `1. Educational Content (courses, tutorials, guides)\n`;
    prompt += `2. Tools & Software\n`;
    prompt += `3. Communities & Forums\n`;
    prompt += `4. Books & Publications\n`;
    prompt += `5. Expert Blogs & Websites\n\n`;
  }

  // Add optional sections based on preferences
  if (includeRatings) {
    prompt += `RESOURCE RATINGS: Include a 1-5 star rating for each resource based on quality, comprehensiveness, and usefulness for the specific topic.\n\n`;
  }

  if (includePricingInfo) {
    prompt += `PRICING INFORMATION: For each resource, indicate whether it's free, freemium, one-time purchase, or subscription-based. Include approximate cost ranges where applicable.\n\n`;
  }

  if (includeDifficultyLevels) {
    prompt += `DIFFICULTY LEVELS: Indicate whether each resource is suitable for beginners, intermediate users, or advanced practitioners.\n\n`;
  }

  // Add conclusion instructions
  prompt += `CONCLUSION: Provide guidance on how to best utilize these resources together. Suggest potential learning paths or resource combinations for different goals related to ${topic}.\n\n`;

  // Add formatting guidelines
  prompt += `FORMAT: Structure this as a well-organized resource guide with clear category headings, visually distinct resource listings, and easy-to-scan descriptions. Include a table of contents for navigation. Use a ${tone} tone with a ${personality} personality. Optimize for ${platform} format.`;

  return prompt;
}

/**
 * Generate structured prompt for Buyer's Guide template - purchasing decisions
 */
export function generateBuyersGuidePrompt({
  templateData,
  tone = 'professional',
  personality = 'analytical',
  platform = 'blog'
}: TemplateHandlerOptions): string {
  const {
    topic,
    industry,
    criteria = [],
    includeComparisons = true,
    includePriceRanges = true,
    includeExpertTips = true
  } = templateData;

  if (!topic) {
    throw new Error('Missing required field for Buyer\'s Guide template: topic');
  }

  // Build the structured prompt
  let prompt = `Create a comprehensive "Buyer's Guide" for ${topic}`;
  
  if (industry) {
    prompt += ` within the ${industry} industry`;
  }
  
  prompt += `.\n\n`;

  // Add introduction instructions
  prompt += `INTRODUCTION: Explain why purchasing decisions for ${topic} are important and potentially challenging. Establish the purpose of this guide as helping readers make informed decisions that align with their specific needs and budget.\n\n`;

  // Add content structure for evaluation criteria
  prompt += `CORE STRUCTURE: Organize the guide around key decision criteria. For each criterion:\n`;
  prompt += `1. Explain why this factor matters when purchasing ${topic}\n`;
  prompt += `2. Describe what to look for and what to avoid\n`;
  prompt += `3. Provide specific examples or benchmarks that illustrate quality differences\n`;
  prompt += `4. Include questions buyers should ask sellers or manufacturers about this criterion\n\n`;

  // Add specific criteria if provided
  if (criteria && criteria.length > 0) {
    prompt += `INCLUDE THESE SPECIFIC EVALUATION CRITERIA:\n`;
    criteria.forEach((criterion: string, index: number) => {
      prompt += `CRITERION ${index + 1}: ${criterion}\n`;
    });
    prompt += `\n`;
  } else {
    prompt += `INCLUDE THESE STANDARD EVALUATION CRITERIA:\n`;
    prompt += `1. Quality & Performance\n`;
    prompt += `2. Cost Considerations (initial and long-term)\n`;
    prompt += `3. Reliability & Durability\n`;
    prompt += `4. Features & Specifications\n`;
    prompt += `5. Support & Warranty\n`;
    prompt += `6. Compatibility & Integration\n\n`;
  }

  // Add optional sections based on preferences
  if (includeComparisons) {
    prompt += `PRODUCT COMPARISONS: Include a section comparing representative examples from different categories or price points. Create a comparison table highlighting how they rate on the key criteria.\n\n`;
  }

  if (includePriceRanges) {
    prompt += `PRICE RANGE BREAKDOWN: Include a section that breaks down what buyers can expect at different price ranges (budget, mid-range, premium) and when it makes sense to spend more or less.\n\n`;
  }

  if (includeExpertTips) {
    prompt += `EXPERT BUYING TIPS: Include a section with insider knowledge and expert tips for getting the best value, avoiding common pitfalls, and negotiating effectively when purchasing ${topic}.\n\n`;
  }

  // Add needs assessment section
  prompt += `NEEDS ASSESSMENT: Provide guidance for readers to evaluate their specific requirements before making a purchase. Include questions they should ask themselves to clarify their needs and priorities.\n\n`;

  // Add conclusion instructions
  prompt += `CONCLUSION: Summarize the key considerations for making an informed purchase of ${topic}. Provide a simple decision framework or checklist readers can use during their buying process.\n\n`;

  // Add formatting guidelines
  prompt += `FORMAT: Structure this as a practical buying guide with clear sections, comparison tables, visual callouts for important warnings or tips, and a reader-friendly organization. Use a ${tone} tone with a ${personality} personality. Optimize for ${platform} format.`;

  return prompt;
}

/**
 * Generate structured prompt for Glossary template - key terms and definitions
 */
export function generateGlossaryPrompt({
  templateData,
  tone = 'professional',
  personality = 'analytical',
  platform = 'blog'
}: TemplateHandlerOptions): string {
  const {
    topic,
    industry,
    terms = [],
    includeCategories = true,
    includeRelatedTerms = true,
    includeRealWorldExamples = true
  } = templateData;

  if (!topic) {
    throw new Error('Missing required field for Glossary template: topic');
  }

  // Build the structured prompt
  let prompt = `Create a comprehensive glossary of key terms and definitions related to ${topic}`;
  
  if (industry) {
    prompt += ` in the ${industry} industry`;
  }
  
  prompt += `.\n\n`;

  // Add introduction instructions
  prompt += `INTRODUCTION: Explain why understanding the terminology of ${topic} is important for professionals or enthusiasts. Establish the purpose of this glossary as demystifying technical language and creating a shared vocabulary.\n\n`;

  // Add content structure for terms
  prompt += `CORE STRUCTURE: For each term in the glossary:\n`;
  prompt += `1. Provide the term in bold, followed by its pronunciation if relevant\n`;
  prompt += `2. Write a clear, concise definition that explains the concept in accessible language\n`;
  prompt += `3. Add depth with additional context on how the term is used in practice\n\n`;

  // Add specific terms if provided
  if (terms && terms.length > 0) {
    prompt += `INCLUDE THESE SPECIFIC TERMS:\n`;
    terms.forEach((term: any, index: number) => {
      const termName = typeof term === 'string' ? term : term.name;
      prompt += `TERM ${index + 1}: ${termName}\n`;
      
      if (typeof term !== 'string' && term.definition) {
        prompt += `Definition: ${term.definition}\n`;
      }
      
      prompt += `\n`;
    });
  } else {
    prompt += `RESEARCH AND INCLUDE: Identify 25-30 of the most important terms related to ${topic} that someone would need to understand to be conversant in the subject. Include a mix of fundamental concepts, technical terminology, industry jargon, and emerging terms.\n\n`;
  }

  // Add optional sections based on preferences
  if (includeCategories) {
    prompt += `TERM CATEGORIES: Organize the terms into logical categories or themes. Provide a brief introduction to each category explaining how these terms relate to each other.\n\n`;
  }

  if (includeRelatedTerms) {
    prompt += `RELATED TERMS: For each entry, include cross-references to 2-3 related terms in the glossary that would deepen understanding of the concept.\n\n`;
  }

  if (includeRealWorldExamples) {
    prompt += `REAL-WORLD EXAMPLES: For key terms, include a brief real-world example or use case that illustrates the concept in action.\n\n`;
  }

  // Add additional sections
  prompt += `VISUAL NAVIGATION: Include an alphabetical index at the beginning of the glossary and/or navigation by category to help readers quickly find terms.\n\n`;

  // Add conclusion instructions
  prompt += `CONCLUSION: Provide guidance on how to best use this glossary and suggestions for further resources where readers can deepen their understanding of these terms and ${topic} more broadly.\n\n`;

  // Add formatting guidelines
  prompt += `FORMAT: Structure this as an accessible reference document with clear alphabetical organization, visually distinct term entries, and easy-to-scan definitions. Use a ${tone} tone with a ${personality} personality. Optimize for ${platform} format while maintaining technical accuracy.`;

  return prompt;
}

/**
 * Generate structured prompt for White Paper template - authoritative report
 */
export function generateWhitePaperPrompt({
  templateData,
  tone = 'professional',
  personality = 'analytical',
  platform = 'blog'
}: TemplateHandlerOptions): string {
  const {
    topic,
    industry,
    problem = "",
    sections = [],
    includeExecutiveSummary = true,
    includeMarketAnalysis = true,
    includeCaseStudies = true
  } = templateData;

  if (!topic) {
    throw new Error('Missing required field for White Paper template: topic');
  }

  // Build the structured prompt
  let prompt = `Create a comprehensive and authoritative white paper on ${topic}`;
  
  if (industry) {
    prompt += ` for the ${industry} industry`;
  }
  
  prompt += `.\n\n`;

  // Add introduction instructions
  prompt += `EXECUTIVE SUMMARY: ${includeExecutiveSummary ? `Provide a concise overview of the entire white paper, highlighting the problem, key findings, and recommended solutions. This should be a standalone section that gives busy readers the essential takeaways in 1-2 paragraphs.` : `Omit the executive summary.`}\n\n`;

  // Add problem statement
  prompt += `PROBLEM STATEMENT: ${problem || `Clearly articulate the significant challenge, issue, or opportunity related to ${topic} that this white paper addresses. Establish urgency by describing the consequences of not addressing this problem and the potential benefits of resolving it.`}\n\n`;

  // Add content structure for the main sections
  prompt += `CORE STRUCTURE: Develop a thorough analysis of ${topic} with these components:\n`;
  prompt += `1. Background and context\n`;
  prompt += `2. Detailed analysis of the problem and its causes\n`;
  prompt += `3. Exploration of potential solutions with evidence-based evaluation\n`;
  prompt += `4. Recommended approach with implementation considerations\n\n`;

  // Add specific sections if provided
  if (sections && sections.length > 0) {
    prompt += `INCLUDE THESE SPECIFIC SECTIONS:\n`;
    sections.forEach((section: any, index: number) => {
      const sectionTitle = typeof section === 'string' ? section : section.title;
      prompt += `SECTION ${index + 1}: ${sectionTitle}\n`;
      
      if (typeof section !== 'string' && section.content) {
        prompt += `Content focus: ${section.content}\n`;
      }
      
      prompt += `\n`;
    });
  }

  // Add optional sections based on preferences
  if (includeMarketAnalysis) {
    prompt += `MARKET ANALYSIS: Include relevant data, statistics, and market trends that illustrate the scope and impact of the problem. Cite specific research findings and industry reports to establish credibility.\n\n`;
  }

  if (includeCaseStudies) {
    prompt += `CASE STUDIES: Include 1-2 real-world examples that demonstrate either the problem in action or the successful implementation of solutions similar to those being recommended.\n\n`;
  }

  // Add conclusion and recommendations
  prompt += `CONCLUSION AND RECOMMENDATIONS: Provide a clear summary of the key points and insights from the white paper. Offer specific, actionable recommendations for addressing the problem, including implementation steps, resource requirements, and expected outcomes.\n\n`;

  // Add references section
  prompt += `REFERENCES AND RESOURCES: Include a section listing credible sources cited throughout the paper. Organize these by type (academic research, industry reports, case studies, etc.).\n\n`;

  // Add formatting guidelines
  prompt += `FORMAT: Structure this as a professional white paper with clear section headings, executive summary, data visualizations (described rather than created), pull quotes for important insights, and a logical flow from problem to solution. Use a ${tone} tone with a ${personality} personality. Include appropriate citations throughout.`;

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
    
    case 'deep-dive':
      return generateDeepDivePrompt({ templateData, tone, personality, platform });
    
    case 'rookie-or-pro':
      return generateRookieOrProPrompt({ templateData, tone, personality, platform });
    
    case 'resource-roundup':
      return generateResourceRoundupPrompt({ templateData, tone, personality, platform });
    
    case 'buyers-guide':
      return generateBuyersGuidePrompt({ templateData, tone, personality, platform });
    
    case 'glossary':
      return generateGlossaryPrompt({ templateData, tone, personality, platform });
    
    case 'white-paper':
      return generateWhitePaperPrompt({ templateData, tone, personality, platform });
    
    // Default - just use the template name as context
    default:
      return templateData.prompt || `Create content about ${template}`;
  }
}