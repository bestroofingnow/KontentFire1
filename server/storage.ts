import { 
  users, 
  contents, 
  contentPipelines,
  contentPipelineRuns,
  contentPipelineJobs,
  platformIntegrations,
  platformIntegrationEnum,
  type User, 
  type InsertUser, 
  type Content, 
  type InsertContent,
  type PlatformIntegration
} from "@shared/schema";
import { db, pool } from "./db";
import { eq, desc, and } from "drizzle-orm";
import session from "express-session";
import connectPg from "connect-pg-simple";

const PostgresSessionStore = connectPg(session);

// LinkedIn integration type
export interface LinkedInConnection {
  linkedinId: string;
  accessToken: string;
  refreshToken?: string;
  expiresAt: Date;
  name: string;
  profilePicture: string | null;
  email: string | null;
}

// Social share record type
export interface SocialShareRecord {
  platform: string;
  contentType: string;
  postId: string;
  text: string;
  mediaUrl: string | null;
  timestamp: Date;
}

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
  
  // LinkedIn operations
  saveLinkedInConnection(userId: number, connection: LinkedInConnection): Promise<PlatformIntegration>;
  getLinkedInConnection(userId: number): Promise<PlatformIntegration | undefined>;
  removeLinkedInConnection(userId: number): Promise<boolean>;
  
  // Social sharing
  recordSocialShare(userId: number, shareData: SocialShareRecord): Promise<any>;
  
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
  
  // LinkedIn operations
  async saveLinkedInConnection(userId: number, connection: LinkedInConnection): Promise<PlatformIntegration> {
    // Check if there's an existing LinkedIn integration for this user
    const [existingIntegration] = await db
      .select()
      .from(platformIntegrations)
      .where(
        and(
          eq(platformIntegrations.userId, userId),
          eq(platformIntegrations.platform, 'linkedin')
        )
      );
    
    if (existingIntegration) {
      // Update existing integration
      const [updated] = await db
        .update(platformIntegrations)
        .set({
          accessToken: connection.accessToken,
          refreshToken: connection.refreshToken || null,
          tokenExpiry: connection.expiresAt,
          accountId: connection.linkedinId,
          accountName: connection.name,
          profileImageUrl: connection.profilePicture,
          isActive: true,
          lastUsed: new Date(),
          updatedAt: new Date(),
          metadata: {
            email: connection.email,
            linkedinId: connection.linkedinId
          }
        })
        .where(eq(platformIntegrations.id, existingIntegration.id))
        .returning();
      
      return updated;
    } else {
      // Create new integration
      const [created] = await db
        .insert(platformIntegrations)
        .values({
          userId,
          platform: 'linkedin',
          accessToken: connection.accessToken,
          refreshToken: connection.refreshToken || null,
          tokenExpiry: connection.expiresAt,
          accountId: connection.linkedinId,
          accountName: connection.name,
          accountType: 'profile',
          profileImageUrl: connection.profilePicture,
          isActive: true,
          lastUsed: new Date(),
          metadata: {
            email: connection.email,
            linkedinId: connection.linkedinId
          }
        })
        .returning();
      
      return created;
    }
  }
  
  async getLinkedInConnection(userId: number): Promise<PlatformIntegration | undefined> {
    const [integration] = await db
      .select()
      .from(platformIntegrations)
      .where(
        and(
          eq(platformIntegrations.userId, userId),
          eq(platformIntegrations.platform, 'linkedin'),
          eq(platformIntegrations.isActive, true)
        )
      );
    
    return integration;
  }
  
  async removeLinkedInConnection(userId: number): Promise<boolean> {
    const result = await db
      .update(platformIntegrations)
      .set({
        isActive: false,
        accessToken: null,
        refreshToken: null,
        updatedAt: new Date()
      })
      .where(
        and(
          eq(platformIntegrations.userId, userId),
          eq(platformIntegrations.platform, 'linkedin')
        )
      );
    
    return true;
  }
  
  // Social sharing
  async recordSocialShare(userId: number, shareData: SocialShareRecord): Promise<any> {
    // Since we don't have an analytics table yet, we'll just log the share
    // TODO: Create an analytics table and record the share there
    console.log('Social share recorded:', {
      userId,
      platform: shareData.platform,
      contentType: shareData.contentType,
      postId: shareData.postId,
      timestamp: shareData.timestamp.toISOString(),
    });
    
    // Update the lastUsed timestamp on the integration
    await db
      .update(platformIntegrations)
      .set({
        lastUsed: new Date(),
      })
      .where(
        and(
          eq(platformIntegrations.userId, userId),
          eq(platformIntegrations.platform, shareData.platform as any)
        )
      );
    
    return { success: true };
  }
}

export const storage = new DatabaseStorage();
