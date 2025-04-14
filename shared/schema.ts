import { pgTable, text, serial, integer, boolean, timestamp, date, pgEnum } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { relations } from "drizzle-orm";

// Enums
export const planEnum = pgEnum('plan_type', ['blaze', 'inferno']);
export const contentTypeEnum = pgEnum('content_type', ['text', 'image', 'both']);
export const contentStatusEnum = pgEnum('content_status', ['draft', 'scheduled', 'published']);
export const platformEnum = pgEnum('platform_type', ['blog', 'facebook', 'instagram', 'twitter', 'linkedin', 'youtube', 'tiktok', 'pinterest']);
export const frequencyEnum = pgEnum('frequency_type', ['daily', 'weekly', 'bi-weekly', 'monthly']);
export const toneEnum = pgEnum('tone_type', ['professional', 'casual', 'friendly', 'authoritative', 'humorous']);
export const autoContentStatusEnum = pgEnum('auto_content_status', ['pending', 'published', 'failed']);

// Users table
export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  username: text('username').notNull().unique(),
  email: text('email').notNull().unique(),
  password: text('password').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  plan: planEnum('plan').default('blaze').notNull(),
  stripeCustomerId: text('stripe_customer_id'),
  stripeSubscriptionId: text('stripe_subscription_id'),
  isAdmin: boolean('is_admin').default(false).notNull(),
});

// User relations
export const usersRelations = relations(users, ({ many }) => ({
  contents: many(contents),
  socialAccounts: many(socialAccounts),
}));

// Social Accounts table
export const socialAccounts = pgTable('social_accounts', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  platform: platformEnum('platform').notNull(),
  accessToken: text('access_token').notNull(),
  refreshToken: text('refresh_token'),
  tokenExpiry: timestamp('token_expiry'),
  platformUserId: text('platform_user_id'),
  platformUsername: text('platform_username'),
});

// Social Account relations
export const socialAccountsRelations = relations(socialAccounts, ({ one }) => ({
  user: one(users, {
    fields: [socialAccounts.userId],
    references: [users.id],
  }),
}));

// Contents table
export const contents = pgTable('contents', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  title: text('title').notNull(),
  textContent: text('text_content'),
  imageUrl: text('image_url'),
  contentType: contentTypeEnum('content_type').notNull(),
  status: contentStatusEnum('status').default('draft').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at'),
});

// Content relations
export const contentsRelations = relations(contents, ({ one, many }) => ({
  user: one(users, {
    fields: [contents.userId],
    references: [users.id],
  }),
  schedules: many(schedules),
}));

// Schedules table
export const schedules = pgTable('schedules', {
  id: serial('id').primaryKey(),
  contentId: integer('content_id').notNull().references(() => contents.id, { onDelete: 'cascade' }),
  platform: platformEnum('platform').notNull(),
  scheduledDate: timestamp('scheduled_date').notNull(),
  published: boolean('published').default(false).notNull(),
  publishedDate: timestamp('published_date'),
  engagementMetrics: text('engagement_metrics'),
});

// Schedule relations
export const schedulesRelations = relations(schedules, ({ one }) => ({
  content: one(contents, {
    fields: [schedules.contentId],
    references: [contents.id],
  }),
}));

// Company Profiles table
export const companyProfiles = pgTable('company_profiles', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  companyName: text('company_name').notNull(),
  industry: text('industry'),
  description: text('description'),
  websiteUrl: text('website_url'),
  logoUrl: text('logo_url'),
  primaryColor: text('primary_color'),
  secondaryColor: text('secondary_color'),
  facebookUrl: text('facebook_url'),
  twitterUrl: text('twitter_url'),
  instagramUrl: text('instagram_url'),
  linkedinUrl: text('linkedin_url'),
  youtubeUrl: text('youtube_url'),
  tiktokUrl: text('tiktok_url'),
  pinterestUrl: text('pinterest_url'),
  additionalInfo: text('additional_info'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at'),
});

// Company Profile relations
export const companyProfilesRelations = relations(companyProfiles, ({ one }) => ({
  user: one(users, {
    fields: [companyProfiles.userId],
    references: [users.id],
  }),
}));

// Auto Content Configuration table
export const autoContentConfigs = pgTable('auto_content_configs', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  enabled: boolean('enabled').default(false).notNull(),
  postFrequency: frequencyEnum('post_frequency').default('weekly').notNull(),
  platforms: text('platforms').array().notNull(),
  topicCategories: text('topic_categories').array().notNull(),
  contentTone: toneEnum('content_tone').default('professional').notNull(),
  includeImages: boolean('include_images').default(true).notNull(),
  customNotes: text('custom_notes'),
  defaultHashtags: text('default_hashtags'),
  bestTimeToPost: boolean('best_time_to_post').default(true).notNull(),
  specificPostTime: text('specific_post_time'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at'),
});

// Auto Content Configuration relations
export const autoContentConfigsRelations = relations(autoContentConfigs, ({ one }) => ({
  user: one(users, {
    fields: [autoContentConfigs.userId],
    references: [users.id],
  }),
}));

// Auto Generated Content table
export const autoGeneratedContents = pgTable('auto_generated_contents', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  configId: integer('config_id').notNull().references(() => autoContentConfigs.id, { onDelete: 'cascade' }),
  title: text('title').notNull(),
  textContent: text('text_content'),
  imageUrl: text('image_url'),
  contentType: contentTypeEnum('content_type').notNull(),
  platform: platformEnum('platform').notNull(),
  scheduledDate: timestamp('scheduled_date').notNull(),
  status: autoContentStatusEnum('status').default('pending').notNull(),
  generationPrompt: text('generation_prompt'),
  publishedDate: timestamp('published_date'),
  engagementMetrics: text('engagement_metrics'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// Auto Generated Content relations
export const autoGeneratedContentsRelations = relations(autoGeneratedContents, ({ one }) => ({
  user: one(users, {
    fields: [autoGeneratedContents.userId],
    references: [users.id],
  }),
  config: one(autoContentConfigs, {
    fields: [autoGeneratedContents.configId],
    references: [autoContentConfigs.id],
  }),
}));

// Admin Settings table
export const adminSettings = pgTable('admin_settings', {
  id: serial('id').primaryKey(),
  infernoPrice: integer('inferno_price').notNull(), // in cents
  blazePrice: integer('blaze_price').default(9900).notNull(), // $99.00 in cents
  stripeProductId: text('stripe_product_id'),
  blazePriceId: text('blaze_price_id'),
  infernoPriceId: text('inferno_price_id'),
  selfPromoEnabled: boolean('self_promo_enabled').default(true).notNull(),
  selfPromoInterval: integer('self_promo_interval').default(7).notNull(), // days
});

// Insert schemas
export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
  stripeCustomerId: true,
  stripeSubscriptionId: true,
  isAdmin: true,
});

export const insertSocialAccountSchema = createInsertSchema(socialAccounts).omit({
  id: true,
});

export const insertContentSchema = createInsertSchema(contents).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertScheduleSchema = createInsertSchema(schedules).omit({
  id: true,
  published: true,
  publishedDate: true,
  engagementMetrics: true,
});

export const insertAdminSettingsSchema = createInsertSchema(adminSettings).omit({
  id: true,
});

export const insertCompanyProfileSchema = createInsertSchema(companyProfiles).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertAutoContentConfigSchema = createInsertSchema(autoContentConfigs).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertAutoGeneratedContentSchema = createInsertSchema(autoGeneratedContents).omit({
  id: true,
  createdAt: true,
  publishedDate: true,
  engagementMetrics: true,
});

// Types
export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

export type InsertSocialAccount = z.infer<typeof insertSocialAccountSchema>;
export type SocialAccount = typeof socialAccounts.$inferSelect;

export type InsertContent = z.infer<typeof insertContentSchema>;
export type Content = typeof contents.$inferSelect;

export type InsertSchedule = z.infer<typeof insertScheduleSchema>;
export type Schedule = typeof schedules.$inferSelect;

export type InsertAdminSettings = z.infer<typeof insertAdminSettingsSchema>;
export type AdminSettings = typeof adminSettings.$inferSelect;

export type InsertCompanyProfile = z.infer<typeof insertCompanyProfileSchema>;
export type CompanyProfile = typeof companyProfiles.$inferSelect;

export type InsertAutoContentConfig = z.infer<typeof insertAutoContentConfigSchema>;
export type AutoContentConfig = typeof autoContentConfigs.$inferSelect;

export type InsertAutoGeneratedContent = z.infer<typeof insertAutoGeneratedContentSchema>;
export type AutoGeneratedContent = typeof autoGeneratedContents.$inferSelect;
