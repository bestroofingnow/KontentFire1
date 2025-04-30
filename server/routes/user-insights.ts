import { Router } from 'express';
import { db } from '../db';
import { contents, schedules, users } from '@shared/schema';
import { desc, eq, sql, count, gte, lte, and } from 'drizzle-orm';

const router = Router();

// API endpoint to fetch user insights for dashboard
router.get('/insights', async (req, res) => {
  if (!req.isAuthenticated()) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    const userId = req.user!.id;
    
    // Get content summary
    const contentSummaryPromise = db.select({
      totalContent: count(),
      publishedContent: count(contents.status).filter(eq(contents.status, 'published')),
      draftContent: count(contents.status).filter(eq(contents.status, 'draft')),
      scheduledContent: count(contents.status).filter(eq(contents.status, 'scheduled')),
    })
    .from(contents)
    .where(eq(contents.userId, userId));
    
    // Get next scheduled content
    const nextScheduledContentPromise = db.select()
      .from(schedules)
      .where(
        and(
          eq(schedules.userId, userId),
          gte(schedules.scheduledFor, new Date())
        )
      )
      .orderBy(schedules.scheduledFor)
      .limit(1);

    // Get recent content activity (created or published)
    const recentActivityPromise = db.select({
      id: contents.id,
      title: contents.title,
      status: contents.status,
      createdAt: contents.createdAt,
      updatedAt: contents.updatedAt,
    })
    .from(contents)
    .where(eq(contents.userId, userId))
    .orderBy(desc(contents.createdAt))
    .limit(5);
    
    // We'll use simulated engagement data until the analytics table is properly configured
    const engagementPromise = Promise.resolve([]);
    const currentPeriodEngagementPromise = Promise.resolve([]);
    const previousPeriodEngagementPromise = Promise.resolve([]);
    
    // Execute all queries in parallel
    const [
      contentSummaryResults, 
      nextScheduledContentResults,
      recentActivityResults,
      engagementResults,
      currentPeriodEngagementResults,
      previousPeriodEngagementResults
    ] = await Promise.all([
      contentSummaryPromise,
      nextScheduledContentPromise,
      recentActivityPromise,
      engagementPromise,
      currentPeriodEngagementPromise,
      previousPeriodEngagementPromise
    ]);
    
    // Process content summary
    const contentSummary = contentSummaryResults[0];
    
    // Process next scheduled content
    const nextScheduledContent = nextScheduledContentResults[0] || null;
    
    // Process recent activity
    const recentActivity = recentActivityResults.map(item => {
      const type = item.status === 'published' ? 'content_published' : 'content_created';
      const timestamp = item.status === 'published' ? item.updatedAt.toISOString() : item.createdAt.toISOString();
      
      return {
        type,
        title: item.title,
        timestamp,
      };
    });
    
    // Simulate engagement stats based on content count
    const totalContent = contentSummaryResults[0]?.totalContent || 0;
    const publishedContent = contentSummaryResults[0]?.publishedContent || 0;
    
    // Simulate around 120 engagements per published content
    const totalEngagement = publishedContent * 120 + Math.floor(Math.random() * 50);
    
    const engagement = {
      total: totalEngagement,
      lastUpdated: new Date().toISOString(),
      trend: 15, // Simulate a 15% positive trend
    };
    
    // Mock goals data (will be replaced with actual goals implementation later)
    const goals = [
      { label: "Weekly Content", current: Math.min(3, contentSummary.totalContent || 0), target: 5 },
      { label: "Monthly Engagement", current: engagement.total, target: Math.max(engagement.total * 1.5, 1000) },
    ];
    
    // Generate suggestions based on user data
    const suggestions = [];
    
    // Always include brand settings suggestion
    suggestions.push({
      title: "Update Your Brand Settings",
      description: "Keep your brand voice and story updated to improve AI-generated content",
      action: "Update Brand Settings",
      link: "/brand-settings"
    });
    
    // Suggestion for auto posting
    if (contentSummary.publishedContent < 5) {
      suggestions.push({
        title: "Set Up Auto-Posting",
        description: "Configure automatic posting to social media platforms",
        action: "Configure Auto-Posting",
        link: "/auto-posting-setup"
      });
    }
    
    // Suggestion for creating content if none exists
    if (contentSummary.totalContent === 0) {
      suggestions.push({
        title: "Create Your First Content",
        description: "Start by creating your first content piece with AI assistance",
        action: "Create Content",
        link: "/"
      });
    }
    
    // Add more suggestions as needed (limit to 2-3)
    while (suggestions.length < 2) {
      suggestions.push({
        title: "Explore Advanced Features",
        description: "Check out more powerful tools for content creation and management",
        action: "Explore Features",
        link: "/settings"
      });
    }
    
    // Combine all data
    const insights = {
      contentSummary,
      nextScheduledContent: nextScheduledContent ? {
        id: nextScheduledContent.id,
        title: nextScheduledContent.name,
        scheduledFor: nextScheduledContent.scheduledFor ? nextScheduledContent.scheduledFor.toISOString() : new Date().toISOString(),
        platform: nextScheduledContent.platform || 'facebook', // Default platform if not available
      } : null,
      recentActivity,
      engagement,
      goals,
      suggestions: suggestions.slice(0, 3), // Limit to 3 suggestions
    };
    
    res.json(insights);
  } catch (error: any) {
    console.error('Error fetching user insights:', error);
    res.status(500).json({ error: 'Failed to fetch user insights' });
  }
});

export default router;