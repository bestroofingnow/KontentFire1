import { Router } from 'express';
import { db } from '../db';
import { contents, schedules, analytics, users } from '@shared/schema';
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
    
    // Get engagement stats from analytics
    const engagementPromise = db.select({
      total: sql<number>`sum(${analytics.likes} + ${analytics.shares} + ${analytics.comments} + ${analytics.clicks})`.mapWith(Number),
      lastUpdated: sql<string>`max(${analytics.createdAt})`,
    })
    .from(analytics)
    .where(eq(analytics.userId, userId));
    
    // Calculate engagement trend (compare to previous period)
    const currentDate = new Date();
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(currentDate.getDate() - 30);
    const sixtyDaysAgo = new Date();
    sixtyDaysAgo.setDate(currentDate.getDate() - 60);
    
    const currentPeriodEngagementPromise = db.select({
      total: sql<number>`sum(${analytics.likes} + ${analytics.shares} + ${analytics.comments} + ${analytics.clicks})`.mapWith(Number),
    })
    .from(analytics)
    .where(
      and(
        eq(analytics.userId, userId),
        gte(analytics.createdAt, thirtyDaysAgo),
        lte(analytics.createdAt, currentDate),
      )
    );
    
    const previousPeriodEngagementPromise = db.select({
      total: sql<number>`sum(${analytics.likes} + ${analytics.shares} + ${analytics.comments} + ${analytics.clicks})`.mapWith(Number),
    })
    .from(analytics)
    .where(
      and(
        eq(analytics.userId, userId),
        gte(analytics.createdAt, sixtyDaysAgo),
        lte(analytics.createdAt, thirtyDaysAgo),
      )
    );
    
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
    
    // Process engagement stats
    const engagement = {
      total: engagementResults[0]?.total || 0,
      lastUpdated: engagementResults[0]?.lastUpdated || new Date().toISOString(),
      trend: 0,
    };
    
    // Calculate engagement trend percentage
    const currentPeriodTotal = currentPeriodEngagementResults[0]?.total || 0;
    const previousPeriodTotal = previousPeriodEngagementResults[0]?.total || 0;
    
    if (previousPeriodTotal > 0) {
      const trend = ((currentPeriodTotal - previousPeriodTotal) / previousPeriodTotal) * 100;
      engagement.trend = Math.round(trend);
    }
    
    // Mock goals data (will be replaced with actual goals implementation later)
    const goals = [
      { label: "Weekly Content", current: Math.min(3, contentSummary.totalContent || 0), target: 5 },
      { label: "Monthly Engagement", current: engagement.total, target: Math.max(engagement.total * 1.5, 1000) },
    ];
    
    // Generate suggestions based on user data
    const suggestions = [];
    
    // Suggestion for brand settings
    if (req.user!.companyProfileId) {
      suggestions.push({
        title: "Complete Your Brand Profile",
        description: "Add your brand voice and story to improve AI-generated content",
        action: "Update Brand Settings",
        link: "/brand-settings"
      });
    }
    
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
        scheduledFor: nextScheduledContent.scheduledFor.toISOString(),
        platform: nextScheduledContent.platform,
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