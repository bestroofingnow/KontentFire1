import { 
  users, 
  contents, 
  contentPipelines,
  contentPipelineRuns,
  contentPipelineJobs,
  type User, 
  type InsertUser, 
  type Content, 
  type InsertContent
} from "@shared/schema";
import { db, pool } from "./db";
import { eq, desc } from "drizzle-orm";
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
}

export const storage = new DatabaseStorage();
