import { users, contents, schedules, socialAccounts, adminSettings, companyProfiles, type User, type InsertUser, type Content, type InsertContent, type Schedule, type InsertSchedule, type SocialAccount, type InsertSocialAccount, type AdminSettings, type InsertAdminSettings, type CompanyProfile, type InsertCompanyProfile } from "@shared/schema";
import { db, pool } from "./db";
import { eq, and, desc, gte, sql } from "drizzle-orm";
import session from "express-session";
import connectPg from "connect-pg-simple";

const PostgresSessionStore = connectPg(session);

// Interface for storage operations
export interface IStorage {
  // User operations
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: number, data: Partial<User>): Promise<User>;
  updateStripeInfo(id: number, stripeCustomerId: string, stripeSubscriptionId: string): Promise<User>;
  
  // Content operations
  createContent(content: InsertContent): Promise<Content>;
  getContent(id: number): Promise<Content | undefined>;
  getUserContents(userId: number, limit?: number): Promise<Content[]>;
  updateContent(id: number, data: Partial<Content>): Promise<Content>;
  deleteContent(id: number): Promise<boolean>;
  
  // Schedule operations
  createSchedule(schedule: InsertSchedule): Promise<Schedule>;
  getSchedule(id: number): Promise<Schedule | undefined>;
  getContentSchedules(contentId: number): Promise<Schedule[]>;
  getUpcomingSchedules(userId: number, limit?: number): Promise<(Schedule & { content: Content })[]>;
  markSchedulePublished(id: number, metrics?: string): Promise<Schedule>;
  deleteSchedule(id: number): Promise<boolean>;
  
  // Social account operations
  createSocialAccount(account: InsertSocialAccount): Promise<SocialAccount>;
  getUserSocialAccounts(userId: number): Promise<SocialAccount[]>;
  updateSocialAccount(id: number, data: Partial<SocialAccount>): Promise<SocialAccount>;
  deleteSocialAccount(id: number): Promise<boolean>;
  
  // Company profile operations
  getCompanyProfile(userId: number): Promise<CompanyProfile | undefined>;
  createCompanyProfile(profile: InsertCompanyProfile): Promise<CompanyProfile>;
  updateCompanyProfile(id: number, data: Partial<CompanyProfile>): Promise<CompanyProfile>;
  
  // Admin settings operations
  getAdminSettings(): Promise<AdminSettings | undefined>;
  createOrUpdateAdminSettings(settings: InsertAdminSettings): Promise<AdminSettings>;
  
  // Analytics
  getContentStats(userId: number): Promise<{ 
    totalContent: number, 
    publishedContent: number, 
    totalImages: number,
    totalEngagement: number
  }>;
  
  // Session store
  sessionStore: any; // Using any type for SessionStore to avoid TypeScript issues
}

// Database storage implementation
export class DatabaseStorage implements IStorage {
  sessionStore: any; // Using any type for SessionStore to avoid TypeScript issues
  
  constructor() {
    this.sessionStore = new PostgresSessionStore({ 
      pool, 
      tableName: 'session',
      createTableIfMissing: true 
    });
  }
  
  // User operations
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }
  
  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user;
  }
  
  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user;
  }
  
  async createUser(user: InsertUser): Promise<User> {
    const [createdUser] = await db.insert(users).values(user).returning();
    return createdUser;
  }
  
  async updateUser(id: number, data: Partial<User>): Promise<User> {
    const [updatedUser] = await db
      .update(users)
      .set(data)
      .where(eq(users.id, id))
      .returning();
    return updatedUser;
  }
  
  async updateStripeInfo(id: number, stripeCustomerId: string, stripeSubscriptionId: string): Promise<User> {
    const [updatedUser] = await db
      .update(users)
      .set({ 
        stripeCustomerId,
        stripeSubscriptionId
      })
      .where(eq(users.id, id))
      .returning();
    return updatedUser;
  }
  
  // Content operations
  async createContent(content: InsertContent): Promise<Content> {
    const [createdContent] = await db.insert(contents).values(content).returning();
    return createdContent;
  }
  
  async getContent(id: number): Promise<Content | undefined> {
    const [content] = await db.select().from(contents).where(eq(contents.id, id));
    return content;
  }
  
  async getUserContents(userId: number, limit?: number): Promise<Content[]> {
    let query = db.select()
      .from(contents)
      .where(eq(contents.userId, userId))
      .orderBy(desc(contents.createdAt));
    
    if (limit) {
      query = query.limit(limit);
    }
    
    return await query;
  }
  
  async updateContent(id: number, data: Partial<Content>): Promise<Content> {
    const [updatedContent] = await db
      .update(contents)
      .set({
        ...data,
        updatedAt: new Date()
      })
      .where(eq(contents.id, id))
      .returning();
    return updatedContent;
  }
  
  async deleteContent(id: number): Promise<boolean> {
    const result = await db.delete(contents).where(eq(contents.id, id));
    return true;
  }
  
  // Schedule operations
  async createSchedule(schedule: InsertSchedule): Promise<Schedule> {
    const [createdSchedule] = await db.insert(schedules).values(schedule).returning();
    return createdSchedule;
  }
  
  async getSchedule(id: number): Promise<Schedule | undefined> {
    const [schedule] = await db.select().from(schedules).where(eq(schedules.id, id));
    return schedule;
  }
  
  async getContentSchedules(contentId: number): Promise<Schedule[]> {
    return await db.select()
      .from(schedules)
      .where(eq(schedules.contentId, contentId));
  }
  
  async getUpcomingSchedules(userId: number, limit?: number): Promise<(Schedule & { content: Content })[]> {
    const now = new Date();
    
    let query = db.select({
      schedule: schedules,
      content: contents
    })
    .from(schedules)
    .innerJoin(contents, eq(schedules.contentId, contents.id))
    .where(
      and(
        eq(contents.userId, userId),
        gte(schedules.scheduledDate, now),
        eq(schedules.published, false)
      )
    )
    .orderBy(schedules.scheduledDate);
    
    if (limit) {
      query = query.limit(limit);
    }
    
    const results = await query;
    return results.map(r => ({ ...r.schedule, content: r.content }));
  }
  
  async markSchedulePublished(id: number, metrics?: string): Promise<Schedule> {
    const [updatedSchedule] = await db
      .update(schedules)
      .set({
        published: true,
        publishedDate: new Date(),
        engagementMetrics: metrics || null
      })
      .where(eq(schedules.id, id))
      .returning();
    return updatedSchedule;
  }
  
  async deleteSchedule(id: number): Promise<boolean> {
    await db.delete(schedules).where(eq(schedules.id, id));
    return true;
  }
  
  // Social account operations
  async createSocialAccount(account: InsertSocialAccount): Promise<SocialAccount> {
    const [createdAccount] = await db.insert(socialAccounts).values(account).returning();
    return createdAccount;
  }
  
  async getUserSocialAccounts(userId: number): Promise<SocialAccount[]> {
    return await db.select()
      .from(socialAccounts)
      .where(eq(socialAccounts.userId, userId));
  }
  
  async updateSocialAccount(id: number, data: Partial<SocialAccount>): Promise<SocialAccount> {
    const [updatedAccount] = await db
      .update(socialAccounts)
      .set(data)
      .where(eq(socialAccounts.id, id))
      .returning();
    return updatedAccount;
  }
  
  async deleteSocialAccount(id: number): Promise<boolean> {
    await db.delete(socialAccounts).where(eq(socialAccounts.id, id));
    return true;
  }
  
  // Company profile operations
  async getCompanyProfile(userId: number): Promise<CompanyProfile | undefined> {
    const [profile] = await db
      .select()
      .from(companyProfiles)
      .where(eq(companyProfiles.userId, userId));
    return profile;
  }
  
  async createCompanyProfile(profile: InsertCompanyProfile): Promise<CompanyProfile> {
    const [createdProfile] = await db
      .insert(companyProfiles)
      .values(profile)
      .returning();
    return createdProfile;
  }
  
  async updateCompanyProfile(id: number, data: Partial<CompanyProfile>): Promise<CompanyProfile> {
    const [updatedProfile] = await db
      .update(companyProfiles)
      .set({
        ...data,
        updatedAt: new Date()
      })
      .where(eq(companyProfiles.id, id))
      .returning();
    return updatedProfile;
  }
  
  // Admin settings operations
  async getAdminSettings(): Promise<AdminSettings | undefined> {
    const [settings] = await db.select().from(adminSettings);
    return settings;
  }
  
  async createOrUpdateAdminSettings(settings: InsertAdminSettings): Promise<AdminSettings> {
    // Check if settings exist
    const existingSettings = await this.getAdminSettings();
    
    if (existingSettings) {
      // Update
      const [updatedSettings] = await db
        .update(adminSettings)
        .set(settings)
        .where(eq(adminSettings.id, existingSettings.id))
        .returning();
      return updatedSettings;
    } else {
      // Create
      const [createdSettings] = await db
        .insert(adminSettings)
        .values(settings)
        .returning();
      return createdSettings;
    }
  }
  
  // Analytics
  async getContentStats(userId: number): Promise<{ 
    totalContent: number, 
    publishedContent: number, 
    totalImages: number,
    totalEngagement: number
  }> {
    // Total content count
    const [totalContentResult] = await db
      .select({ count: sql<number>`count(*)` })
      .from(contents)
      .where(eq(contents.userId, userId));
      
    // Published content count (via schedules)
    const [publishedContentResult] = await db
      .select({ count: sql<number>`count(distinct ${contents.id})` })
      .from(contents)
      .innerJoin(schedules, eq(contents.id, schedules.contentId))
      .where(
        and(
          eq(contents.userId, userId),
          eq(schedules.published, true)
        )
      );
      
    // Images count
    const [imagesResult] = await db
      .select({ count: sql<number>`count(*)` })
      .from(contents)
      .where(
        and(
          eq(contents.userId, userId),
          sql`${contents.imageUrl} is not null`
        )
      );
      
    // Get total engagement (sum of all engagement metrics that are numbers)
    const [engagementResult] = await db
      .select({
        totalEngagement: sql<number>`coalesce(sum((${schedules.engagementMetrics}::jsonb->>'total')::int), 0)`
      })
      .from(schedules)
      .innerJoin(contents, eq(schedules.contentId, contents.id))
      .where(
        and(
          eq(contents.userId, userId),
          eq(schedules.published, true),
          sql`${schedules.engagementMetrics} is not null`
        )
      );
      
    return {
      totalContent: totalContentResult.count || 0,
      publishedContent: publishedContentResult.count || 0,
      totalImages: imagesResult.count || 0,
      totalEngagement: engagementResult.totalEngagement || 0
    };
  }
}

export const storage = new DatabaseStorage();
