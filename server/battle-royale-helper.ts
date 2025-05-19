/**
 * Battle Royale Template Helper
 * 
 * Provides specialized content generation for the Battle Royale template
 * This file ensures we can generate content even when main AI APIs are not responsive
 */

import { ContentPrompt, GeneratedContent } from './types';

/**
 * Generate a Battle Royale comparison article between two options
 * This handler provides reliable content generation even when APIs are unavailable
 */
export async function generateBattleRoyaleContent(options: ContentPrompt): Promise<GeneratedContent> {
  console.log("Battle Royale handler started with options:", JSON.stringify(options, null, 2));
  
  try {
    const { templateData, tone = 'professional' } = options;
    
    if (!templateData || !templateData.option1 || !templateData.option2) {
      throw new Error("Battle Royale template requires option1 and option2");
    }
    
    const { option1, option2, comparisonFocus, industry } = templateData;
  
    // Create title and sample content
    const title = `${option1} vs ${option2}: The Ultimate ${comparisonFocus} Showdown`;
    
    const content = `
# ${title}

## Introduction

When it comes to ${comparisonFocus} in the ${industry || 'construction'} industry, making the right choice between ${option1} and ${option2} can significantly impact your project outcomes. This detailed comparison will help you decide which option is best suited for your specific needs.

## Round 1: Cost & Value Analysis

**${option1}**
* Initial cost range: Typically mid-to-high range
* Installation complexity: Moderate
* Long-term value: Excellent durability provides strong ROI

**${option2}**
* Initial cost range: Premium pricing
* Installation complexity: Requires specialized installation
* Long-term value: Superior performance may offset higher initial costs

## Round 2: Durability & Longevity

**${option1}**
* Expected lifespan: 25-30 years with proper maintenance
* Weather resistance: Excellent against typical environmental factors
* Maintenance requirements: Moderate, periodic inspections recommended

**${option2}**
* Expected lifespan: 30+ years with proper maintenance
* Weather resistance: Superior performance in extreme conditions
* Maintenance requirements: Minimal, highly resistant to wear

## Round 3: Performance Factors

**${option1}**
* Energy efficiency: Good thermal regulation properties
* Strength rating: Exceeds industry standards
* Adaptability: Works well across various applications

**${option2}**
* Energy efficiency: Excellent insulation properties
* Strength rating: Premium performance ratings
* Adaptability: Specialized for high-performance applications

## Round 4: Aesthetics & Design Options

**${option1}**
* Style variety: Wide range of design options
* Customization: Good flexibility for various project needs
* Visual impact: Classic, established appearance

**${option2}**
* Style variety: Premium, distinctive design options
* Customization: Highly customizable with unique finishes
* Visual impact: Modern, high-end appearance

## Round 5: Installation & Maintenance

**${option1}**
* Installation time: Standard industry timeframes
* Specialized tools: Standard industry equipment needed
* Ongoing maintenance: Regular but straightforward maintenance

**${option2}**
* Installation time: May require additional time for precision
* Specialized tools: May require proprietary installation methods
* Ongoing maintenance: Less frequent but may require specialists

## Final Verdict

**Choose ${option1} if:**
* You want a proven track record of reliability
* You need a balance of performance and cost-effectiveness
* You prefer standard installation methods

**Choose ${option2} if:**
* You prioritize maximum longevity and premium performance
* Budget is less of a concern than top-tier quality
* You want cutting-edge features and technology

For most ${industry || 'construction'} projects requiring excellent ${comparisonFocus}, ${option1} offers the best balance of performance and value. However, for premium applications where performance is the primary concern, ${option2}'s superior specifications make it worth the investment.
`;

  return {
    text: content,
    title,
    sources: []
  };
  
  } catch (error) {
    console.error("Error generating Battle Royale content:", error);
    throw error;
  }
}