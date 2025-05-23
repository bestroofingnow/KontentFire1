/**
 * Daily Posting Limits Service for Inferno Plan
 * 
 * Enforces best practice posting limits:
 * - Blog posts: Maximum 6 per day
 * - Social media platforms: Maximum 12 posts per day per platform
 */

import { db } from './db';
import { dailyPostingLimits, users } from '@shared/schema';
import { eq, and } from 'drizzle-orm';

// Define posting limits for Inferno plan
export const INFERNO_POSTING_LIMITS = {
  blog: 6,          // Max 6 blog posts per day
  facebook: 12,     // Max 12 Facebook posts per day
  linkedin: 12,     // Max 12 LinkedIn posts per day
  instagram: 12,    // Max 12 Instagram posts per day
  twitter: 12,      // Max 12 Twitter posts per day
  pinterest: 12,    // Max 12 Pinterest posts per day
  youtube: 12,      // Max 12 YouTube posts per day
  tiktok: 12,       // Max 12 TikTok posts per day
} as const;

// Get current date in YYYY-MM-DD format
function getCurrentDateString(): string {
  return new Date().toISOString().split('T')[0];
}

/**
 * Check if user can post to a specific platform today
 */
export async function canUserPost(userId: number, platform: string): Promise<{
  canPost: boolean;
  currentCount: number;
  limit: number;
  remaining: number;
}> {
  const dateString = getCurrentDateString();
  
  // Get current post count for today
  const [existingLimit] = await db.select()
    .from(dailyPostingLimits)
    .where(
      and(
        eq(dailyPostingLimits.userId, userId),
        eq(dailyPostingLimits.date, dateString),
        eq(dailyPostingLimits.platform, platform)
      )
    );

  const currentCount = existingLimit?.postCount || 0;
  const limit = INFERNO_POSTING_LIMITS[platform as keyof typeof INFERNO_POSTING_LIMITS] || 12;
  const remaining = Math.max(0, limit - currentCount);
  
  return {
    canPost: currentCount < limit,
    currentCount,
    limit,
    remaining
  };
}

/**
 * Record a post for a user on a specific platform
 */
export async function recordPost(userId: number, platform: string): Promise<void> {
  const dateString = getCurrentDateString();
  
  // Check if record exists for today
  const [existingLimit] = await db.select()
    .from(dailyPostingLimits)
    .where(
      and(
        eq(dailyPostingLimits.userId, userId),
        eq(dailyPostingLimits.date, dateString),
        eq(dailyPostingLimits.platform, platform)
      )
    );

  if (existingLimit) {
    // Update existing record
    await db.update(dailyPostingLimits)
      .set({
        postCount: existingLimit.postCount + 1,
        updatedAt: new Date()
      })
      .where(eq(dailyPostingLimits.id, existingLimit.id));
  } else {
    // Create new record
    await db.insert(dailyPostingLimits)
      .values({
        userId,
        date: dateString,
        platform,
        postCount: 1
      });
  }
}

/**
 * Get daily posting summary for a user
 */
export async function getDailyPostingSummary(userId: number): Promise<{
  date: string;
  platforms: Array<{
    platform: string;
    currentCount: number;
    limit: number;
    remaining: number;
    canPost: boolean;
  }>;
}> {
  const dateString = getCurrentDateString();
  
  // Get all platform limits for today
  const todayLimits = await db.select()
    .from(dailyPostingLimits)
    .where(
      and(
        eq(dailyPostingLimits.userId, userId),
        eq(dailyPostingLimits.date, dateString)
      )
    );

  // Create summary for all platforms
  const platforms = Object.entries(INFERNO_POSTING_LIMITS).map(([platform, limit]) => {
    const existingLimit = todayLimits.find(l => l.platform === platform);
    const currentCount = existingLimit?.postCount || 0;
    const remaining = Math.max(0, limit - currentCount);
    
    return {
      platform,
      currentCount,
      limit,
      remaining,
      canPost: currentCount < limit
    };
  });

  return {
    date: dateString,
    platforms
  };
}

/**
 * Check if user can post multiple items to different platforms
 */
export async function canUserPostMultiple(userId: number, platformCounts: Record<string, number>): Promise<{
  canPost: boolean;
  violations: Array<{
    platform: string;
    requested: number;
    available: number;
    limit: number;
  }>;
}> {
  const violations: Array<{
    platform: string;
    requested: number;
    available: number;
    limit: number;
  }> = [];

  for (const [platform, requestedCount] of Object.entries(platformCounts)) {
    const { canPost, remaining, limit } = await canUserPost(userId, platform);
    
    if (requestedCount > remaining) {
      violations.push({
        platform,
        requested: requestedCount,
        available: remaining,
        limit
      });
    }
  }

  return {
    canPost: violations.length === 0,
    violations
  };
}

/**
 * Reset daily limits (called by scheduler at midnight)
 */
export async function resetDailyLimits(): Promise<void> {
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayString = yesterday.toISOString().split('T')[0];
  
  // Delete records older than yesterday to keep the table clean
  await db.delete(dailyPostingLimits)
    .where(eq(dailyPostingLimits.date, yesterdayString));
    
  console.log(`Reset daily posting limits for ${yesterdayString}`);
}