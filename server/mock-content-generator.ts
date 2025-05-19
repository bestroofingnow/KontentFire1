/**
 * Mock Content Generator
 * 
 * Provides simplified content generation for testing purposes
 * when actual API services are unavailable or for specific templates.
 */

import { ContentPrompt, GeneratedContent } from './types';
import { generateBattleRoyalePrompt } from './template-handlers';

/**
 * Generate mock content for battle royale template to verify functionality
 */
export async function generateMockBattleRoyaleContent(options: ContentPrompt): Promise<GeneratedContent> {
  const { templateData, tone } = options;
  
  if (!templateData || !templateData.option1 || !templateData.option2) {
    throw new Error("Missing required template data for Battle Royale");
  }
  
  console.log("Generating mock Battle Royale content");
  
  // Generate a simple mock response for Battle Royale to verify the endpoint is working
  const { option1, option2, comparisonFocus, industry } = templateData;
  
  // Create a title for the comparison
  const title = `${option1} vs ${option2}: The Ultimate ${comparisonFocus} Showdown`;
  
  // Create a simple structured comparison
  const sampleContent = `
# ${title}

## Introduction
When it comes to ${comparisonFocus} in the ${industry || 'construction'} industry, choosing between ${option1} and ${option2} can significantly impact your project's success. This head-to-head comparison breaks down the key factors to consider.

## ROUND 1: COSTS & VALUE
**${option1}**
- Generally costs between $X-$Y per unit
- Installation typically takes X time
- Long-term value considerations

**${option2}**
- Generally costs between $A-$B per unit  
- Installation typically takes Y time
- Long-term value considerations

## ROUND 2: DURABILITY & LIFESPAN
**${option1}**
- Average lifespan: X years
- Performs well in [specific conditions]
- Common maintenance requirements

**${option2}**
- Average lifespan: Y years
- Performs well in [specific conditions]  
- Common maintenance requirements

## ROUND 3: PERFORMANCE
**${option1}**
- Key strength 1
- Key strength 2
- Limitation 1

**${option2}**
- Key strength 1
- Key strength 2
- Limitation 1

## ROUND 4: AESTHETICS & DESIGN
**${option1}**
- Available styles and options
- Design considerations

**${option2}**
- Available styles and options
- Design considerations

## FINAL VERDICT
The winner depends on your specific priorities:
- Choose ${option1} if: [specific advantages]
- Choose ${option2} if: [specific advantages]

For most customers looking for the best overall value in ${comparisonFocus}, [recommendation based on comparison].
`;

  return {
    text: sampleContent,
    title,
    sources: []
  };
}

/**
 * Generate mock content for any template or standard prompt
 */
export async function generateMockContent(options: ContentPrompt): Promise<GeneratedContent> {
  const { prompt, contentType, tone, length, personality, platform, template, templateData } = options;
  
  console.log("Generating mock content for:", { template, contentType, platform });
  
  // Handle specialized templates
  if (template === 'battle-royale') {
    return generateMockBattleRoyaleContent(options);
  }
  
  // Generate generic placeholder content for other templates
  const title = template 
    ? `Sample ${template.charAt(0).toUpperCase() + template.slice(1)} Content` 
    : 'Sample Content';
    
  const sampleText = `
# ${title}

This is generated placeholder content for ${platform || 'blog'} in a ${tone || 'professional'} tone.

The content would normally be generated using AI services, but this is a simplified version to verify functionality.

## Key Points
- This would normally contain actual ${contentType === 'both' ? 'text and image' : contentType} content
- The tone would be ${tone || 'professional'}
- The length would be ${length || 'medium'}
- The platform would be optimized for ${platform || 'blog'}

## Next Steps
To generate actual content, please ensure that ANTHROPIC_API_KEY or OPENAI_API_KEY is properly configured.
`;

  return {
    text: sampleText,
    title,
    sources: []
  };
}