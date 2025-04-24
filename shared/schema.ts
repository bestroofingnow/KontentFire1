import { pgTable, serial, text, timestamp, integer, boolean, json, pgEnum } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { createInsertSchema } from 'drizzle-zod';
import { z } from 'zod';

// Plan type enum
export const planTypeEnum = pgEnum('plan_type', [
  'blaze',
  'inferno', 
  'ember'
]);

// Users table
export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  username: text('username').notNull().unique(),
  email: text('email').notNull(),
  password: text('password').notNull(),
  isAdmin: boolean('is_admin').default(false),
  plan: planTypeEnum('plan').default('blaze'),
  planStatus: text('plan_status').default('active'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  wpIntegrationActive: boolean('wp_integration_active').default(false),
  shopifyIntegrationActive: boolean('shopify_integration_active').default(false),
  wpSiteUrl: text('wp_site_url'),
  wpUsername: text('wp_username'),
  wpAuthToken: text('wp_auth_token'),
  shopifyUrl: text('shopify_url'),
  shopifyApiKey: text('shopify_api_key'),
  shopifyApiSecret: text('shopify_api_secret'),
  stripeCustomerId: text('stripe_customer_id'),
  stripeSubscriptionId: text('stripe_subscription_id'),
});

export const usersRelations = relations(users, ({ many }) => ({
  contents: many(contents),
  schedules: many(schedules),
  contentPipelines: many(contentPipelines),
}));

// Content statuses enum
export const contentStatusEnum = pgEnum('content_status', [
  'draft',
  'scheduled',
  'published',
  'archived',
]);

// Content types enum
export const contentTypeEnum = pgEnum('content_type', [
  'article',
  'social',
  'video',
  'newsletter',
]);

// Content templates enum
export const contentTemplateEnum = pgEnum('content_template', [
  'standard',
  'battle-royale',
  'basics-101',
  'myth-buster',
  'technical-guide',
  'case-against',
  'checklist',
]);

// Content personalities enum
export const contentPersonalityEnum = pgEnum('content_personality', [
  'thoughtful',
  'enthusiastic',
  'skeptical',
  'inspirational',
  'analytical',
]);

// Tone enum
export const toneEnum = pgEnum('tone', [
  'professional',
  'casual',
  'friendly',
  'formal',
  'humorous',
  'authoritative',
]);

// Platform enum
export const platformEnum = pgEnum('platform', [
  'website',
  'twitter',
  'facebook',
  'instagram',
  'linkedin',
  'youtube',
  'tiktok',
]);

// Frequency enum
export const frequencyEnum = pgEnum('frequency', [
  'daily',
  'weekly',
  'monthly',
  'custom',
]);

// Contents table
export const contents = pgTable('contents', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').references(() => users.id).notNull(),
  title: text('title').notNull(),
  textContent: text('text_content'),
  imageUrl: text('image_url'),
  status: contentStatusEnum('status').default('draft').notNull(),
  contentType: contentTypeEnum('content_type').default('article').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const contentsRelations = relations(contents, ({ one, many }) => ({
  user: one(users, {
    fields: [contents.userId],
    references: [users.id],
  }),
  images: many(contentImages),
  pipelineRuns: many(contentPipelineRuns),
}));

// Content images table
export const contentImages = pgTable('content_images', {
  id: serial('id').primaryKey(),
  contentId: integer('content_id').references(() => contents.id).notNull(),
  url: text('url').notNull(),
  alt: text('alt'),
  caption: text('caption'),
  order: integer('order').default(0),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const contentImagesRelations = relations(contentImages, ({ one }) => ({
  content: one(contents, {
    fields: [contentImages.contentId],
    references: [contents.id],
  }),
}));

// Schedules table
export const schedules = pgTable('schedules', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').references(() => users.id).notNull(),
  name: text('name').notNull(),
  description: text('description'),
  frequency: text('frequency').notNull(), // cron expression
  template: contentTemplateEnum('template').default('standard').notNull(),
  type: contentTypeEnum('type').default('article').notNull(),
  personality: contentPersonalityEnum('personality').default('thoughtful').notNull(),
  keywords: text('keywords'),
  active: boolean('active').default(true).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
  lastRunAt: timestamp('last_run_at'),
  metadata: json('metadata'),
});

export const schedulesRelations = relations(schedules, ({ one }) => ({
  user: one(users, {
    fields: [schedules.userId],
    references: [users.id],
  }),
}));

// Company profiles table
export const companyProfiles = pgTable('company_profiles', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').references(() => users.id).notNull(),
  name: text('name').notNull(),
  description: text('description'),
  industry: text('industry'),
  website: text('website'),
  logo: text('logo'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
  metadata: json('metadata'),
});

export const companyProfilesRelations = relations(companyProfiles, ({ one }) => ({
  user: one(users, {
    fields: [companyProfiles.userId],
    references: [users.id],
  }),
}));

// Platform integrations enum
export const platformIntegrationEnum = pgEnum('platform_integration', [
  'wordpress',
  'shopify',
  'twitter',
  'facebook',
  'instagram',
  'linkedin',
  'youtube',
  'tiktok',
]);

// Platform integrations table
export const platformIntegrations = pgTable('platform_integrations', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').references(() => users.id).notNull(),
  platform: platformIntegrationEnum('platform').notNull(),
  accessToken: text('access_token'),
  refreshToken: text('refresh_token'),
  tokenExpiry: timestamp('token_expiry'),
  metadata: json('metadata'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const platformIntegrationsRelations = relations(platformIntegrations, ({ one }) => ({
  user: one(users, {
    fields: [platformIntegrations.userId],
    references: [users.id],
  }),
}));

// Analytics table
export const analytics = pgTable('analytics', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').references(() => users.id).notNull(),
  contentId: integer('content_id').references(() => contents.id),
  event: text('event').notNull(),
  platform: text('platform'),
  value: integer('value'),
  metadata: json('metadata'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const analyticsRelations = relations(analytics, ({ one }) => ({
  user: one(users, {
    fields: [analytics.userId],
    references: [users.id],
  }),
  content: one(contents, {
    fields: [analytics.contentId],
    references: [contents.id],
  }),
}));

// Pipeline stages enum
export const pipelineStageEnum = pgEnum('pipeline_stage', [
  'content_generation',
  'research',
  'editing',
  'review',
  'approval',
  'publishing',
  'distribution',
]);

// Content pipelines table
export const contentPipelines = pgTable('content_pipelines', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').references(() => users.id).notNull(),
  name: text('name').notNull(),
  description: text('description'),
  stages: json('stages').notNull(), // Array of stage definitions
  isActive: boolean('is_active').default(true).notNull(),
  isAutomated: boolean('is_automated').default(false).notNull(),
  triggerSchedule: text('trigger_schedule'), // cron expression for automated pipelines
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
  lastRunAt: timestamp('last_run_at'),
  metadata: json('metadata'),
});

export const contentPipelinesRelations = relations(contentPipelines, ({ one, many }) => ({
  user: one(users, {
    fields: [contentPipelines.userId],
    references: [users.id],
  }),
  runs: many(contentPipelineRuns),
}));

// Pipeline run statuses enum
export const pipelineRunStatusEnum = pgEnum('pipeline_run_status', [
  'pending',
  'running',
  'completed',
  'failed',
  'cancelled',
]);

// Content pipeline runs table
export const contentPipelineRuns = pgTable('content_pipeline_runs', {
  id: serial('id').primaryKey(),
  pipelineId: integer('pipeline_id').references(() => contentPipelines.id).notNull(),
  contentId: integer('content_id').references(() => contents.id),
  status: pipelineRunStatusEnum('status').default('pending').notNull(),
  currentStage: integer('current_stage').default(0),
  results: json('results'), // Results of each stage
  startedAt: timestamp('started_at').defaultNow().notNull(),
  completedAt: timestamp('completed_at'),
  error: text('error'),
  metadata: json('metadata'),
});

export const contentPipelineRunsRelations = relations(contentPipelineRuns, ({ one, many }) => ({
  pipeline: one(contentPipelines, {
    fields: [contentPipelineRuns.pipelineId],
    references: [contentPipelines.id],
  }),
  content: one(contents, {
    fields: [contentPipelineRuns.contentId],
    references: [contents.id],
  }),
  jobs: many(contentPipelineJobs),
}));

// Pipeline job statuses enum
export const pipelineJobStatusEnum = pgEnum('pipeline_job_status', [
  'pending',
  'running',
  'completed',
  'failed',
  'cancelled',
]);

// Content pipeline jobs table
export const contentPipelineJobs = pgTable('content_pipeline_jobs', {
  id: serial('id').primaryKey(),
  runId: integer('run_id').references(() => contentPipelineRuns.id).notNull(),
  stage: integer('stage').notNull(),
  type: text('type').notNull(), // e.g., 'openai', 'perplexity', 'anthropic', 'distribution'
  status: pipelineJobStatusEnum('status').default('pending').notNull(),
  config: json('config').notNull(), // Job-specific configuration
  result: json('result'), // Result of the job
  startedAt: timestamp('started_at'),
  completedAt: timestamp('completed_at'),
  error: text('error'),
  metadata: json('metadata'),
});

export const contentPipelineJobsRelations = relations(contentPipelineJobs, ({ one }) => ({
  run: one(contentPipelineRuns, {
    fields: [contentPipelineJobs.runId],
    references: [contentPipelineRuns.id],
  }),
}));

// Schemas for data validation and type generation

// User schemas
export const insertUserSchema = createInsertSchema(users).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

// Content schemas
export const insertContentSchema = createInsertSchema(contents).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertContent = z.infer<typeof insertContentSchema>;
export type Content = typeof contents.$inferSelect;

// Content image schemas
export const insertContentImageSchema = createInsertSchema(contentImages).omit({ id: true, createdAt: true });
export type InsertContentImage = z.infer<typeof insertContentImageSchema>;
export type ContentImage = typeof contentImages.$inferSelect;

// Schedule schemas
export const insertScheduleSchema = createInsertSchema(schedules).omit({ id: true, createdAt: true, updatedAt: true, lastRunAt: true });
export type InsertSchedule = z.infer<typeof insertScheduleSchema>;
export type Schedule = typeof schedules.$inferSelect;

// Company profile schemas
export const insertCompanyProfileSchema = createInsertSchema(companyProfiles).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertCompanyProfile = z.infer<typeof insertCompanyProfileSchema>;
export type CompanyProfile = typeof companyProfiles.$inferSelect;

// Platform integration schemas
export const insertPlatformIntegrationSchema = createInsertSchema(platformIntegrations).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertPlatformIntegration = z.infer<typeof insertPlatformIntegrationSchema>;
export type PlatformIntegration = typeof platformIntegrations.$inferSelect;

// Analytics schemas
export const insertAnalyticsSchema = createInsertSchema(analytics).omit({ id: true, createdAt: true });
export type InsertAnalytics = z.infer<typeof insertAnalyticsSchema>;
export type Analytics = typeof analytics.$inferSelect;

// Content pipeline schemas
export const insertContentPipelineSchema = createInsertSchema(contentPipelines).omit({ id: true, createdAt: true, updatedAt: true, lastRunAt: true });
export type InsertContentPipeline = z.infer<typeof insertContentPipelineSchema>;
export type ContentPipeline = typeof contentPipelines.$inferSelect;

// Content pipeline run schemas
export const insertContentPipelineRunSchema = createInsertSchema(contentPipelineRuns).omit({ id: true, startedAt: true, completedAt: true });
export type InsertContentPipelineRun = z.infer<typeof insertContentPipelineRunSchema>;
export type ContentPipelineRun = typeof contentPipelineRuns.$inferSelect;

// Content pipeline job schemas
export const insertContentPipelineJobSchema = createInsertSchema(contentPipelineJobs).omit({ id: true, startedAt: true, completedAt: true });
export type InsertContentPipelineJob = z.infer<typeof insertContentPipelineJobSchema>;
export type ContentPipelineJob = typeof contentPipelineJobs.$inferSelect;

// Stage definition for content pipelines
export interface PipelineStageDefinition {
  id: string;
  name: string;
  type: string; // e.g., 'openai', 'perplexity', 'anthropic', 'distribution'
  config: Record<string, any>;
  dependsOn?: string[]; // IDs of stages that must complete before this one
  condition?: string; // Expression to determine if this stage should run
}

// Stage result for pipeline runs
export interface PipelineStageResult {
  stageId: string;
  status: 'pending' | 'running' | 'completed' | 'failed' | 'skipped';
  startedAt?: string;
  completedAt?: string;
  output?: any;
  error?: string;
}

// Admin settings table for global configuration
export const adminSettings = pgTable('admin_settings', {
  id: serial('id').primaryKey(),
  platformName: text('platform_name').default('Kontent Fire').notNull(),
  platformLogo: text('platform_logo'),
  primaryColor: text('primary_color').default('#ff5722'),
  secondaryColor: text('secondary_color').default('#2196f3'),
  featuresEnabled: json('features_enabled'), // JSON object with feature flags
  apiKeys: json('api_keys'), // Encrypted/hashed API keys
  emailConfig: json('email_config'), 
  integrationConfig: json('integration_config'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Admin settings schema
export const insertAdminSettingsSchema = createInsertSchema(adminSettings).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertAdminSettings = z.infer<typeof insertAdminSettingsSchema>;
export type AdminSettings = typeof adminSettings.$inferSelect;

// Auto content status enum
export const autoContentStatusEnum = pgEnum('auto_content_status', [
  'pending',
  'generating',
  'reviewing',
  'publishing',
  'completed',
  'failed',
]);

// Auto content configuration table
export const autoContentConfigs = pgTable('auto_content_configs', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').references(() => users.id).notNull(),
  name: text('name').notNull(),
  description: text('description'),
  topics: json('topics'), // Array of topics to generate content about
  contentTypes: json('content_types'), // Array of content types to generate
  platforms: json('platforms'), // Array of platforms to publish to
  schedule: text('schedule').notNull(), // CRON expression
  maxContentPerRun: integer('max_content_per_run').default(1),
  isActive: boolean('is_active').default(true),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
  lastRunAt: timestamp('last_run_at'),
  metadata: json('metadata'),
});

export const autoContentConfigsRelations = relations(autoContentConfigs, ({ one, many }) => ({
  user: one(users, {
    fields: [autoContentConfigs.userId],
    references: [users.id],
  }),
  generatedContents: many(autoGeneratedContents),
}));

// Auto generated contents table
export const autoGeneratedContents = pgTable('auto_generated_contents', {
  id: serial('id').primaryKey(),
  configId: integer('config_id').references(() => autoContentConfigs.id).notNull(),
  contentId: integer('content_id').references(() => contents.id),
  topic: text('topic'),
  status: autoContentStatusEnum('status').default('pending').notNull(),
  scheduledFor: timestamp('scheduled_for'),
  publishedAt: timestamp('published_at'),
  error: text('error'),
  metadata: json('metadata'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const autoGeneratedContentsRelations = relations(autoGeneratedContents, ({ one }) => ({
  config: one(autoContentConfigs, {
    fields: [autoGeneratedContents.configId],
    references: [autoContentConfigs.id],
  }),
  content: one(contents, {
    fields: [autoGeneratedContents.contentId],
    references: [contents.id],
  }),
}));

// Auto content configuration schema
export const insertAutoContentConfigSchema = createInsertSchema(autoContentConfigs).omit({ id: true, createdAt: true, updatedAt: true, lastRunAt: true });
export type InsertAutoContentConfig = z.infer<typeof insertAutoContentConfigSchema>;
export type AutoContentConfig = typeof autoContentConfigs.$inferSelect;

// Auto generated content schema
export const insertAutoGeneratedContentSchema = createInsertSchema(autoGeneratedContents).omit({ id: true, createdAt: true });
export type InsertAutoGeneratedContent = z.infer<typeof insertAutoGeneratedContentSchema>;
export type AutoGeneratedContent = typeof autoGeneratedContents.$inferSelect;

// Business listing related schema components

// Listing platform enum
export const listingPlatformEnum = pgEnum('listing_platform', [
  'google',
  'yelp',
  'facebook',
  'tripadvisor',
  'bing',
  'apple',
  'yellowpages',
]);

// Listing sync status enum
export const listingSyncStatusEnum = pgEnum('listing_sync_status', [
  'pending',
  'syncing',
  'synced',
  'failed',
  'incomplete',
]);

// Task status enum
export const taskStatusEnum = pgEnum('task_status', [
  'pending',
  'in_progress',
  'completed',
  'failed',
]);

// Business hours table
export const businessHours = pgTable('business_hours', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').references(() => users.id).notNull(),
  monday: json('monday'),
  tuesday: json('tuesday'),
  wednesday: json('wednesday'),
  thursday: json('thursday'),
  friday: json('friday'),
  saturday: json('saturday'),
  sunday: json('sunday'),
  holidayHours: json('holiday_hours'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const businessHoursRelations = relations(businessHours, ({ one }) => ({
  user: one(users, {
    fields: [businessHours.userId],
    references: [users.id],
  }),
}));

// Business listings table
export const businessListings = pgTable('business_listings', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').references(() => users.id).notNull(),
  platform: listingPlatformEnum('platform').notNull(),
  status: listingSyncStatusEnum('status').default('pending').notNull(),
  name: text('name').notNull(),
  address: text('address'),
  city: text('city'),
  state: text('state'),
  zip: text('zip'),
  phone: text('phone'),
  website: text('website'),
  category: text('category'),
  description: text('description'),
  photos: json('photos'),
  lastSynced: timestamp('last_synced'),
  platformListingId: text('platform_listing_id'),
  platformUrl: text('platform_url'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
  metadata: json('metadata'),
});

export const businessListingsRelations = relations(businessListings, ({ one, many }) => ({
  user: one(users, {
    fields: [businessListings.userId],
    references: [users.id],
  }),
  syncTasks: many(listingSyncTasks),
  reviews: many(businessReviews),
}));

// Listing sync tasks table
export const listingSyncTasks = pgTable('listing_sync_tasks', {
  id: serial('id').primaryKey(),
  listingId: integer('listing_id').references(() => businessListings.id).notNull(),
  type: text('type').notNull(), // e.g., 'update_name', 'update_hours', 'add_photo'
  status: taskStatusEnum('status').default('pending').notNull(),
  data: json('data'), // Task-specific data
  notes: text('notes'),
  completedAt: timestamp('completed_at'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const listingSyncTasksRelations = relations(listingSyncTasks, ({ one }) => ({
  listing: one(businessListings, {
    fields: [listingSyncTasks.listingId],
    references: [businessListings.id],
  }),
}));

// Business reviews table
export const businessReviews = pgTable('business_reviews', {
  id: serial('id').primaryKey(),
  listingId: integer('listing_id').references(() => businessListings.id).notNull(),
  platform: listingPlatformEnum('platform').notNull(),
  rating: integer('rating').notNull(),
  reviewText: text('review_text'),
  reviewerName: text('reviewer_name'),
  reviewDate: timestamp('review_date').notNull(),
  response: text('response'),
  responseDate: timestamp('response_date'),
  isResponded: boolean('is_responded').default(false),
  platformReviewId: text('platform_review_id'),
  platformReviewUrl: text('platform_review_url'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const businessReviewsRelations = relations(businessReviews, ({ one }) => ({
  listing: one(businessListings, {
    fields: [businessReviews.listingId],
    references: [businessListings.id],
  }),
}));

// Huginn agent types enum
export const agentTypeEnum = pgEnum('agent_type', [
  'browser',
  'scheduler',
  'rss_reader',
  'webhook',
  'email',
  'twitter',
  'api',
  'data_transformation',
  'notification',
]);

// Huginn agent schedule enum
export const agentScheduleEnum = pgEnum('agent_schedule', [
  'none',
  'every_5m',
  'every_15m',
  'every_30m',
  'hourly',
  'daily',
  'weekly',
]);

// Huginn agent trigger enum
export const agentTriggerEnum = pgEnum('agent_trigger', [
  'manual',
  'scheduled',
  'event',
  'webhook',
]);

// Huginn agent status enum
export const agentStatusEnum = pgEnum('agent_status', [
  'active',
  'inactive',
  'error',
]);

// Huginn agents table
export const huginnAgents = pgTable('huginn_agents', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').references(() => users.id).notNull(),
  name: text('name').notNull(),
  type: agentTypeEnum('type').notNull(),
  status: agentStatusEnum('status').default('active').notNull(),
  schedule: agentScheduleEnum('schedule').default('none').notNull(),
  trigger: agentTriggerEnum('trigger').default('manual').notNull(),
  configuration: json('configuration').notNull(),
  lastRunAt: timestamp('last_run_at'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const huginnAgentsRelations = relations(huginnAgents, ({ one, many }) => ({
  user: one(users, {
    fields: [huginnAgents.userId],
    references: [users.id],
  }),
  logs: many(huginnLogs),
}));

// Huginn workflows table
export const huginnWorkflows = pgTable('huginn_workflows', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').references(() => users.id).notNull(),
  name: text('name').notNull(),
  description: text('description'),
  agents: json('agents').notNull(), // Array of agent IDs and their connections
  schedule: agentScheduleEnum('schedule').default('none'),
  isActive: boolean('is_active').default(true),
  lastRunAt: timestamp('last_run_at'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const huginnWorkflowsRelations = relations(huginnWorkflows, ({ one }) => ({
  user: one(users, {
    fields: [huginnWorkflows.userId],
    references: [users.id],
  }),
}));

// Huginn logs table
export const huginnLogs = pgTable('huginn_logs', {
  id: serial('id').primaryKey(),
  agentId: integer('agent_id').references(() => huginnAgents.id).notNull(),
  level: text('level').default('info'),
  message: text('message').notNull(),
  details: json('details'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const huginnLogsRelations = relations(huginnLogs, ({ one }) => ({
  agent: one(huginnAgents, {
    fields: [huginnLogs.agentId],
    references: [huginnAgents.id],
  }),
}));

// Content pipeline stages table - represents a running stage in a pipeline
export const contentPipelineStages = pgTable('content_pipeline_stages', {
  id: serial('id').primaryKey(),
  runId: integer('run_id').references(() => contentPipelineRuns.id).notNull(),
  stageId: text('stage_id').notNull(), // Reference to the stage ID in the pipeline definition
  name: text('name').notNull(),
  status: pipelineRunStatusEnum('status').default('pending').notNull(),
  order: integer('order').default(0),
  startedAt: timestamp('started_at'),
  completedAt: timestamp('completed_at'),
  output: json('output'),
  error: text('error'),
  metadata: json('metadata'),
});

export const contentPipelineStagesRelations = relations(contentPipelineStages, ({ one, many }) => ({
  run: one(contentPipelineRuns, {
    fields: [contentPipelineStages.runId],
    references: [contentPipelineRuns.id],
  }),
  jobs: many(contentPipelineJobs),
}));

// Insert schema for pipeline stage
export const insertContentPipelineStageSchema = createInsertSchema(contentPipelineStages).omit({ id: true, startedAt: true, completedAt: true });
export type InsertContentPipelineStage = z.infer<typeof insertContentPipelineStageSchema>;
export type ContentPipelineStage = typeof contentPipelineStages.$inferSelect;