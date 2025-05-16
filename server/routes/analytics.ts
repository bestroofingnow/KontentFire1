import { Router, Request, Response } from 'express';
import { db } from '../db';
import { 
  sentimentAnalysis, 
  competitorAnalysis, 
  contentPerformancePredictions, 
  topicTrendForecasts,
  analytics as analyticsTable
} from '@shared/schema';
import { eq, and, desc, gte, lte, sql } from 'drizzle-orm';
import openai from '../openai';
import { format, subDays } from 'date-fns';

export const router = Router();

// Get user's analytics overview
router.get('/overview', async (req: Request, res: Response) => {
  if (!req.isAuthenticated()) {
    return res.status(401).json({ message: 'Not authenticated' });
  }
  
  try {
    const userId = req.user.id;
    
    // Get content metrics
    const contentMetrics = await db.select({
      count: sql`count(*)`,
      status: analyticsTable.platform
    })
    .from(analyticsTable)
    .where(eq(analyticsTable.userId, userId))
    .groupBy(analyticsTable.platform);
    
    // Get recent sentiment analysis
    const sentiments = await db.select()
      .from(sentimentAnalysis)
      .where(eq(sentimentAnalysis.userId, userId))
      .orderBy(desc(sentimentAnalysis.dateAnalyzed))
      .limit(5);
    
    // Get trend forecasts
    const trends = await db.select()
      .from(topicTrendForecasts)
      .where(eq(topicTrendForecasts.userId, userId))
      .orderBy(desc(topicTrendForecasts.createdAt))
      .limit(5);
    
    // Get competitor insights
    const competitors = await db.select()
      .from(competitorAnalysis)
      .where(eq(competitorAnalysis.userId, userId))
      .orderBy(desc(competitorAnalysis.dateAnalyzed))
      .limit(5);
    
    return res.json({
      contentMetrics,
      recentSentiments: sentiments,
      trendForecasts: trends,
      competitorInsights: competitors
    });
  } catch (error: any) {
    console.error('Error fetching analytics overview:', error);
    return res.status(500).json({ message: `Error fetching analytics: ${error.message}` });
  }
});

// Get competitor analysis data
router.get('/competitors', async (req: Request, res: Response) => {
  if (!req.isAuthenticated()) {
    return res.status(401).json({ message: 'Not authenticated' });
  }
  
  try {
    const userId = req.user.id;
    
    // Get timeframe from query parameters (default to last 30 days)
    const days = parseInt(req.query.days as string) || 30;
    const fromDate = subDays(new Date(), days);
    
    const competitors = await db.select()
      .from(competitorAnalysis)
      .where(
        and(
          eq(competitorAnalysis.userId, userId),
          gte(competitorAnalysis.dateAnalyzed, fromDate)
        )
      )
      .orderBy(desc(competitorAnalysis.dateAnalyzed));
    
    return res.json({ competitors });
  } catch (error: any) {
    console.error('Error fetching competitor analysis:', error);
    return res.status(500).json({ message: `Error fetching competitor data: ${error.message}` });
  }
});

// Add a new competitor analysis
router.post('/competitors', async (req: Request, res: Response) => {
  if (!req.isAuthenticated()) {
    return res.status(401).json({ message: 'Not authenticated' });
  }
  
  try {
    const userId = req.user.id;
    const { competitorName, competitorUrl, contentUrl } = req.body;
    
    if (!competitorName) {
      return res.status(400).json({ message: 'Competitor name is required' });
    }
    
    // If URL is provided, analyze the content
    let analysis = null;
    if (contentUrl) {
      // Here we would use AI to analyze the content at the URL
      analysis = await analyzeCompetitorContent(competitorName, contentUrl);
    }
    
    // Insert the new competitor analysis
    const [newAnalysis] = await db.insert(competitorAnalysis)
      .values({
        userId,
        competitorName,
        competitorUrl,
        contentUrl,
        summary: analysis?.summary || null,
        strengths: analysis?.strengths || null,
        weaknesses: analysis?.weaknesses || null,
        topics: analysis?.topics || null,
        keyInsights: analysis?.keyInsights || null,
        metadata: analysis?.metadata || null
      })
      .returning();
    
    return res.status(201).json(newAnalysis);
  } catch (error: any) {
    console.error('Error creating competitor analysis:', error);
    return res.status(500).json({ message: `Error creating analysis: ${error.message}` });
  }
});

// Get sentiment analysis data
router.get('/sentiment', async (req: Request, res: Response) => {
  if (!req.isAuthenticated()) {
    return res.status(401).json({ message: 'Not authenticated' });
  }
  
  try {
    const userId = req.user.id;
    
    // Get timeframe from query parameters (default to last 30 days)
    const days = parseInt(req.query.days as string) || 30;
    const fromDate = subDays(new Date(), days);
    
    const sentiments = await db.select()
      .from(sentimentAnalysis)
      .where(
        and(
          eq(sentimentAnalysis.userId, userId),
          gte(sentimentAnalysis.dateAnalyzed, fromDate)
        )
      )
      .orderBy(desc(sentimentAnalysis.dateAnalyzed));
    
    return res.json({ sentiments });
  } catch (error: any) {
    console.error('Error fetching sentiment analysis:', error);
    return res.status(500).json({ message: `Error fetching sentiment data: ${error.message}` });
  }
});

// Analyze sentiment of content or feedback
router.post('/sentiment', async (req: Request, res: Response) => {
  if (!req.isAuthenticated()) {
    return res.status(401).json({ message: 'Not authenticated' });
  }
  
  try {
    const userId = req.user.id;
    const { contentId, platform, text } = req.body;
    
    if (!text) {
      return res.status(400).json({ message: 'Text content is required for sentiment analysis' });
    }
    
    // Analyze sentiment using AI
    const sentimentResult = await analyzeSentiment(text);
    
    // Insert the sentiment analysis
    const [newSentiment] = await db.insert(sentimentAnalysis)
      .values({
        userId,
        contentId: contentId || null,
        platform: platform || 'general',
        sentiment: sentimentResult.sentiment,
        confidenceScore: sentimentResult.confidenceScore,
        keywords: sentimentResult.keywords,
        positiveAspects: sentimentResult.positiveAspects,
        negativeAspects: sentimentResult.negativeAspects,
        neutralAspects: sentimentResult.neutralAspects,
        feedbackSources: sentimentResult.feedbackSources || null,
        audienceSegment: sentimentResult.audienceSegment || null
      })
      .returning();
    
    return res.status(201).json(newSentiment);
  } catch (error: any) {
    console.error('Error analyzing sentiment:', error);
    return res.status(500).json({ message: `Error analyzing sentiment: ${error.message}` });
  }
});

// Get content performance predictions
router.get('/performance', async (req: Request, res: Response) => {
  if (!req.isAuthenticated()) {
    return res.status(401).json({ message: 'Not authenticated' });
  }
  
  try {
    const userId = req.user.id;
    
    // Get timeframe from query parameters (default to last 30 days)
    const days = parseInt(req.query.days as string) || 30;
    const fromDate = subDays(new Date(), days);
    
    const predictions = await db.select()
      .from(contentPerformancePredictions)
      .where(
        and(
          eq(contentPerformancePredictions.userId, userId),
          gte(contentPerformancePredictions.dateAnalyzed, fromDate)
        )
      )
      .orderBy(desc(contentPerformancePredictions.dateAnalyzed));
    
    return res.json({ predictions });
  } catch (error: any) {
    console.error('Error fetching performance predictions:', error);
    return res.status(500).json({ message: `Error fetching performance data: ${error.message}` });
  }
});

// Predict content performance
router.post('/performance', async (req: Request, res: Response) => {
  if (!req.isAuthenticated()) {
    return res.status(401).json({ message: 'Not authenticated' });
  }
  
  try {
    const userId = req.user.id;
    const { contentId, platform, content, title } = req.body;
    
    if (!content) {
      return res.status(400).json({ message: 'Content is required for performance prediction' });
    }
    
    if (!platform) {
      return res.status(400).json({ message: 'Platform is required for performance prediction' });
    }
    
    // Predict performance using AI
    const prediction = await predictContentPerformance(content, title, platform);
    
    // Insert the performance prediction
    const [newPrediction] = await db.insert(contentPerformancePredictions)
      .values({
        userId,
        contentId: contentId || null,
        platform,
        predictedEngagementScore: prediction.engagementScore,
        predictedReach: prediction.reach,
        predictedLikes: prediction.likes,
        predictedShares: prediction.shares,
        predictedComments: prediction.comments,
        predictedClicks: prediction.clicks,
        confidenceScore: prediction.confidenceScore,
        factors: prediction.factors,
        improvementSuggestions: prediction.improvementSuggestions,
        bestTimeToPublish: prediction.bestTimeToPublish ? new Date(prediction.bestTimeToPublish) : null,
        audienceMatch: prediction.audienceMatch
      })
      .returning();
    
    return res.status(201).json(newPrediction);
  } catch (error: any) {
    console.error('Error predicting content performance:', error);
    return res.status(500).json({ message: `Error predicting performance: ${error.message}` });
  }
});

// Get topic trend forecasts
router.get('/trends', async (req: Request, res: Response) => {
  if (!req.isAuthenticated()) {
    return res.status(401).json({ message: 'Not authenticated' });
  }
  
  try {
    const userId = req.user.id;
    
    const trends = await db.select()
      .from(topicTrendForecasts)
      .where(eq(topicTrendForecasts.userId, userId))
      .orderBy(desc(topicTrendForecasts.createdAt));
    
    return res.json({ trends });
  } catch (error: any) {
    console.error('Error fetching trend forecasts:', error);
    return res.status(500).json({ message: `Error fetching trend data: ${error.message}` });
  }
});

// Generate a new topic trend forecast
router.post('/trends', async (req: Request, res: Response) => {
  if (!req.isAuthenticated()) {
    return res.status(401).json({ message: 'Not authenticated' });
  }
  
  try {
    const userId = req.user.id;
    const { topic, industry, forecastPeriodDays } = req.body;
    
    if (!topic) {
      return res.status(400).json({ message: 'Topic is required for trend forecasting' });
    }
    
    if (!industry) {
      return res.status(400).json({ message: 'Industry is required for trend forecasting' });
    }
    
    // Generate forecast using AI
    const forecast = await forecastTopicTrend(topic, industry);
    
    // Calculate forecast end date
    const forecastEndDate = new Date();
    forecastEndDate.setDate(forecastEndDate.getDate() + (forecastPeriodDays || 90));
    
    // Insert the trend forecast
    const [newForecast] = await db.insert(topicTrendForecasts)
      .values({
        userId,
        topic,
        industry,
        trendDirection: forecast.direction,
        trendStrength: forecast.strength,
        currentPopularity: forecast.currentPopularity,
        predictedPopularity: forecast.predictedPopularity,
        relatedTopics: forecast.relatedTopics,
        supportingData: forecast.supportingData,
        recommendedActions: forecast.recommendedActions,
        forecastEndDate,
        confidence: forecast.confidence
      })
      .returning();
    
    return res.status(201).json(newForecast);
  } catch (error: any) {
    console.error('Error generating trend forecast:', error);
    return res.status(500).json({ message: `Error generating forecast: ${error.message}` });
  }
});

// Helper function to analyze competitor content
async function analyzeCompetitorContent(competitorName: string, contentUrl: string) {
  try {
    const prompt = `You are an expert content marketing analyst. Analyze the competitor content from ${competitorName} at ${contentUrl} and provide a detailed evaluation in JSON format.

Please analyze this content and provide:
1. A brief summary
2. Key strengths
3. Any weaknesses
4. Main topics covered
5. Key insights for competitive advantage
    
Format your response as a JSON object with these keys: summary, strengths (array), weaknesses (array), topics (array), keyInsights (array), metadata (object)`;

    // Generate AI response
    const response = await openai.generateText(prompt, 'professional', 'medium', 'analytical');
    
    // Parse the response
    try {
      // Extract JSON from the response - the model should return JSON but may include markdown backticks
      const jsonPart = response.match(/```json\n([\s\S]*?)\n```/) || 
                      response.match(/```\n([\s\S]*?)\n```/) || 
                      response.match(/(\{[\s\S]*\})/);
      
      const jsonString = jsonPart ? jsonPart[1] : response;
      const result = JSON.parse(jsonString);
      return result;
    } catch (parseError) {
      console.error("Error parsing JSON from response:", parseError);
      
      // If we can't parse JSON, return a basic structure
      return {
        summary: response.substring(0, 200) + "...",
        strengths: [],
        weaknesses: [],
        topics: [],
        keyInsights: [],
        metadata: {}
      };
    }
  } catch (error) {
    console.error("Error analyzing competitor content:", error);
    return null;
  }
}

// Helper function to analyze sentiment
async function analyzeSentiment(text: string) {
  try {
    const prompt = `You are an expert in sentiment analysis. Analyze the provided text and categorize its sentiment in JSON format.

Analyze the sentiment of this text: "${text.substring(0, 1000)}${text.length > 1000 ? '...' : ''}". 
            
Provide a detailed sentiment analysis with the following information:
- Overall sentiment (positive, negative, neutral, or mixed)
- Confidence score (0-100)
- Key sentiment-influencing keywords
- Positive aspects
- Negative aspects
- Neutral aspects
            
Format your response as a JSON object with these keys: sentiment, confidenceScore, keywords (array), positiveAspects (array), negativeAspects (array), neutralAspects (array)`;

    // Generate AI response
    const response = await openai.generateText(prompt, 'professional', 'medium', 'analytical');
    
    // Parse the response
    try {
      // Extract JSON from the response - the model should return JSON but may include markdown backticks
      const jsonPart = response.match(/```json\n([\s\S]*?)\n```/) || 
                      response.match(/```\n([\s\S]*?)\n```/) || 
                      response.match(/(\{[\s\S]*\})/);
      
      const jsonString = jsonPart ? jsonPart[1] : response;
      const result = JSON.parse(jsonString);
      return result;
    } catch (parseError) {
      console.error("Error parsing JSON from response:", parseError);
      
      // If we can't parse JSON, return a basic structure
      return {
        sentiment: "neutral",
        confidenceScore: 50,
        keywords: [],
        positiveAspects: [],
        negativeAspects: [],
        neutralAspects: ["Unable to analyze sentiment properly"]
      };
    }
  } catch (error) {
    console.error("Error analyzing sentiment:", error);
    return {
      sentiment: "neutral",
      confidenceScore: 0,
      keywords: [],
      positiveAspects: [],
      negativeAspects: [],
      neutralAspects: ["Unable to analyze sentiment due to an error"]
    };
  }
}

// Helper function to predict content performance
async function predictContentPerformance(content: string, title: string, platform: string) {
  try {
    const prompt = `You are an expert content marketing analyst. Predict the performance of content on ${platform}.

Title: ${title || 'Untitled'}
            
Content: ${content.substring(0, 1000)}${content.length > 1000 ? '...' : ''}
            
Predict the performance of this content on ${platform}. Provide:
            
1. Overall engagement score (0-100)
2. Predicted reach
3. Predicted likes
4. Predicted shares
5. Predicted comments
6. Predicted clicks (if applicable)
7. Confidence score for this prediction (0-100)
8. Factors affecting performance (array)
9. Suggestions for improvement (array)
10. Best time to publish (ISO date string)
11. Audience match rating (excellent, good, fair, poor)
            
Format your response as a JSON object with these keys: engagementScore, reach, likes, shares, comments, clicks, confidenceScore, factors (array), improvementSuggestions (array), bestTimeToPublish, audienceMatch`;

    // Generate AI response
    const response = await openai.generateText(prompt, 'professional', 'medium', 'analytical');
    
    // Parse the response
    try {
      // Extract JSON from the response - the model should return JSON but may include markdown backticks
      const jsonPart = response.match(/```json\n([\s\S]*?)\n```/) || 
                      response.match(/```\n([\s\S]*?)\n```/) || 
                      response.match(/(\{[\s\S]*\})/);
      
      const jsonString = jsonPart ? jsonPart[1] : response;
      const result = JSON.parse(jsonString);
      return result;
    } catch (parseError) {
      console.error("Error parsing JSON from response:", parseError);
      
      // If we can't parse JSON, return a basic structure
      return {
        engagementScore: 50,
        reach: 1000,
        likes: 50,
        shares: 10,
        comments: 5,
        clicks: 100,
        confidenceScore: 50,
        factors: ["Content length", "Topic relevance"],
        improvementSuggestions: ["Unable to analyze properly - try again later"],
        bestTimeToPublish: new Date().toISOString(),
        audienceMatch: "fair"
      };
    }
  } catch (error) {
    console.error("Error predicting content performance:", error);
    return {
      engagementScore: 50,
      reach: 0,
      likes: 0,
      shares: 0,
      comments: 0,
      clicks: 0,
      confidenceScore: 0,
      factors: ["Unable to predict performance due to an error"],
      improvementSuggestions: ["Try again later"],
      bestTimeToPublish: null,
      audienceMatch: "unknown"
    };
  }
}

// Helper function to forecast topic trends
async function forecastTopicTrend(topic: string, industry: string) {
  try {
    const prompt = `You are an expert trend forecaster for the ${industry} industry. Forecast the trend trajectory for a topic.

Forecast the trend for "${topic}" in the ${industry} industry over the next 90 days.
            
Provide:
1. Trend direction (rising, falling, stable)
2. Trend strength (0-100)
3. Current popularity (0-100)
4. Predicted popularity in 90 days (0-100)
5. Related topics that may influence this trend (array)
6. Supporting data points (array)
7. Recommended actions based on this forecast (array)
8. Confidence in this prediction (0-100)
            
Format your response as a JSON object with these keys: direction, strength, currentPopularity, predictedPopularity, relatedTopics (array), supportingData (array), recommendedActions (array), confidence`;

    // Generate AI response
    const response = await openai.generateText(prompt, 'professional', 'medium', 'analytical');
    
    // Parse the response
    try {
      // Extract JSON from the response - the model should return JSON but may include markdown backticks
      const jsonPart = response.match(/```json\n([\s\S]*?)\n```/) || 
                      response.match(/```\n([\s\S]*?)\n```/) || 
                      response.match(/(\{[\s\S]*\})/);
      
      const jsonString = jsonPart ? jsonPart[1] : response;
      const result = JSON.parse(jsonString);
      return result;
    } catch (parseError) {
      console.error("Error parsing JSON from response:", parseError);
      
      // If we can't parse JSON, return a basic structure
      return {
        direction: "stable",
        strength: 60,
        currentPopularity: 55,
        predictedPopularity: 65,
        relatedTopics: [topic],
        supportingData: ["Unable to analyze properly - try again later"],
        recommendedActions: ["Monitor the topic for changes"],
        confidence: 40
      };
    }
  } catch (error) {
    console.error("Error forecasting topic trend:", error);
    return {
      direction: "stable",
      strength: 50,
      currentPopularity: 50,
      predictedPopularity: 50,
      relatedTopics: [],
      supportingData: ["Unable to forecast trend due to an error"],
      recommendedActions: ["Try again later"],
      confidence: 0
    };
  }
}
      supportingData: ["Unable to forecast trend due to an error"],
      recommendedActions: ["Try again later"],
      confidence: 0
    };
  }
}

export default router;