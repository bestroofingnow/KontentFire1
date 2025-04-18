import { pgTable, text, serial, integer, boolean, timestamp, date, pgEnum, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { relations } from "drizzle-orm";

// Enums
export const planEnum = pgEnum('plan_type', ['premium']);
export const contentTypeEnum = pgEnum('content_type', ['text', 'image', 'both']);
export const contentStatusEnum = pgEnum('content_status', ['draft', 'scheduled', 'published']);
export const platformEnum = pgEnum('platform_type', ['blog', 'facebook', 'instagram', 'twitter', 'linkedin', 'youtube', 'tiktok', 'pinterest', 'press-release']);
export const frequencyEnum = pgEnum('frequency_type', ['daily', 'weekly', 'bi-weekly', 'monthly']);
export const toneEnum = pgEnum('tone_type', ['professional', 'casual', 'friendly', 'authoritative', 'humorous']);
export const autoContentStatusEnum = pgEnum('auto_content_status', ['pending', 'published', 'failed']);
export const listingPlatformEnum = pgEnum('listing_platform_type', [
  'google', 'facebook', 'instagram', 'linkedin', 'foursquare', 'youtube',
  'apple_maps', 'yelp', 'bing', 'angi', 'yellowpages', 'bbb', 'chamber'
]);
export const listingSyncStatusEnum = pgEnum('listing_sync_status', ['synced', 'pending', 'failed', 'manual_required']);
export const taskStatusEnum = pgEnum('task_status', ['pending', 'in_progress', 'completed', 'failed']);

// Content Pipeline Enums
export const pipelineStatusEnum = pgEnum('pipeline_status', ['active', 'paused', 'archived']);
export const pipelineRunStatusEnum = pgEnum('pipeline_run_status', ['running', 'success', 'failed', 'cancelled']);
export const pipelineStageStatusEnum = pgEnum('pipeline_stage_status', ['running', 'success', 'failed', 'cancelled']);
export const pipelineJobStatusEnum = pgEnum('pipeline_job_status', ['running', 'success', 'failed', 'cancelled']);
export const pipelineJobTypeEnum = pgEnum('pipeline_job_type', [
  'huginn_agent', 'content_generation', 'content_publishing', 'data_transformation'
]);

// Users table
export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  username: text('username').notNull().unique(),
  email: text('email').notNull().unique(),
  password: text('password').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  plan: planEnum('plan').default('premium').notNull(),
  planStatus: text('plan_status').default('active'),
  stripeCustomerId: text('stripe_customer_id'),
  stripeSubscriptionId: text('stripe_subscription_id'),
  isAdmin: boolean('is_admin').default(false).notNull(),
  // WordPress integration fields
  wpSiteUrl: text('wp_site_url'),
  wpUsername: text('wp_username'),
  wpAuthToken: text('wp_auth_token'),
  wpIntegrationActive: boolean('wp_integration_active').default(false),
  // Shopify integration fields
  shopifyUrl: text('shopify_url'),
  shopifyApiKey: text('shopify_api_key'),
  shopifyApiSecret: text('shopify_api_secret'),
  shopifyIntegrationActive: boolean('shopify_integration_active').default(false),
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
export const companyProfilesRelations = relations(companyProfiles, ({ one, many }) => ({
  user: one(users, {
    fields: [companyProfiles.userId],
    references: [users.id],
  }),
  businessHours: one(businessHours),
  businessListings: many(businessListings),
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
  premiumPrice: integer('premium_price').default(9900).notNull(), // $99.00 in cents
  stripeProductId: text('stripe_product_id'),
  premiumPriceId: text('premium_price_id'),
  selfPromoEnabled: boolean('self_promo_enabled').default(true).notNull(),
  selfPromoInterval: integer('self_promo_interval').default(7).notNull(), // days
  customAutomationsEnabled: boolean('custom_automations_enabled').default(true).notNull(),
});

// Insert schemas
export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
  planStatus: true,
  stripeCustomerId: true,
  stripeSubscriptionId: true,
  isAdmin: true,
  wpSiteUrl: true,
  wpUsername: true,
  wpAuthToken: true,
  wpIntegrationActive: true,
  shopifyUrl: true,
  shopifyApiKey: true,
  shopifyApiSecret: true,
  shopifyIntegrationActive: true,
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

// Content Pipeline tables
export const contentPipelines = pgTable('content_pipelines', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  description: text('description'),
  automated: boolean('automated').default(false).notNull(),
  schedule: text('schedule'), // cron expression for automated pipelines
  configuration: jsonb('configuration').notNull(),
  status: pipelineStatusEnum('status').default('active').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at'),
});

// Content Pipeline relations
export const contentPipelinesRelations = relations(contentPipelines, ({ one, many }) => ({
  user: one(users, {
    fields: [contentPipelines.userId],
    references: [users.id],
  }),
  runs: many(contentPipelineRuns),
}));

// Content Pipeline Runs table
export const contentPipelineRuns = pgTable('content_pipeline_runs', {
  id: serial('id').primaryKey(),
  pipelineId: integer('pipeline_id').notNull().references(() => contentPipelines.id, { onDelete: 'cascade' }),
  status: pipelineRunStatusEnum('status').notNull(),
  params: jsonb('params').default({}).notNull(),
  result: jsonb('result'),
  errorMessage: text('error_message'),
  startTime: timestamp('start_time').notNull(),
  endTime: timestamp('end_time'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at'),
});

// Content Pipeline Runs relations
export const contentPipelineRunsRelations = relations(contentPipelineRuns, ({ one, many }) => ({
  pipeline: one(contentPipelines, {
    fields: [contentPipelineRuns.pipelineId],
    references: [contentPipelines.id],
  }),
  stages: many(contentPipelineStages),
}));

// Content Pipeline Stages table
export const contentPipelineStages = pgTable('content_pipeline_stages', {
  id: serial('id').primaryKey(),
  pipelineRunId: integer('pipeline_run_id').notNull().references(() => contentPipelineRuns.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  status: pipelineStageStatusEnum('status').notNull(),
  errorMessage: text('error_message'),
  startTime: timestamp('start_time').notNull(),
  endTime: timestamp('end_time'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at'),
});

// Content Pipeline Stages relations
export const contentPipelineStagesRelations = relations(contentPipelineStages, ({ one, many }) => ({
  pipelineRun: one(contentPipelineRuns, {
    fields: [contentPipelineStages.pipelineRunId],
    references: [contentPipelineRuns.id],
  }),
  jobs: many(contentPipelineJobs),
}));

// Content Pipeline Jobs table
export const contentPipelineJobs = pgTable('content_pipeline_jobs', {
  id: serial('id').primaryKey(),
  stageRunId: integer('stage_run_id').notNull().references(() => contentPipelineStages.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  type: pipelineJobTypeEnum('type').notNull(),
  status: pipelineJobStatusEnum('status').notNull(),
  result: jsonb('result'),
  errorMessage: text('error_message'),
  startTime: timestamp('start_time').notNull(),
  endTime: timestamp('end_time'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at'),
});

// Content Pipeline Jobs relations
export const contentPipelineJobsRelations = relations(contentPipelineJobs, ({ one }) => ({
  stage: one(contentPipelineStages, {
    fields: [contentPipelineJobs.stageRunId],
    references: [contentPipelineStages.id],
  }),
}));

// Insert schemas for content pipelines
export const insertContentPipelineSchema = createInsertSchema(contentPipelines).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertContentPipelineRunSchema = createInsertSchema(contentPipelineRuns).omit({
  id: true,
  result: true,
  errorMessage: true,
  endTime: true,
  createdAt: true,
  updatedAt: true,
});

export const insertContentPipelineStageSchema = createInsertSchema(contentPipelineStages).omit({
  id: true,
  errorMessage: true,
  endTime: true,
  createdAt: true,
  updatedAt: true,
});

export const insertContentPipelineJobSchema = createInsertSchema(contentPipelineJobs).omit({
  id: true,
  result: true,
  errorMessage: true,
  endTime: true,
  createdAt: true,
  updatedAt: true,
});

// Content Pipeline types
export type InsertContentPipeline = z.infer<typeof insertContentPipelineSchema>;
export type ContentPipeline = typeof contentPipelines.$inferSelect;

export type InsertContentPipelineRun = z.infer<typeof insertContentPipelineRunSchema>;
export type ContentPipelineRun = typeof contentPipelineRuns.$inferSelect;

export type InsertContentPipelineStage = z.infer<typeof insertContentPipelineStageSchema>;
export type ContentPipelineStage = typeof contentPipelineStages.$inferSelect;

export type InsertContentPipelineJob = z.infer<typeof insertContentPipelineJobSchema>;
export type ContentPipelineJob = typeof contentPipelineJobs.$inferSelect;

// Business Listings tables and types

// Business Hours table (extends company profile with operating hours)
export const businessHours = pgTable('business_hours', {
  id: serial('id').primaryKey(),
  companyProfileId: integer('company_profile_id').notNull().references(() => companyProfiles.id, { onDelete: 'cascade' }),
  monday: text('monday'),
  tuesday: text('tuesday'),
  wednesday: text('wednesday'),
  thursday: text('thursday'),
  friday: text('friday'),
  saturday: text('saturday'),
  sunday: text('sunday'),
  holidays: text('holidays'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at'),
});

// Business Hours relations
export const businessHoursRelations = relations(businessHours, ({ one }) => ({
  companyProfile: one(companyProfiles, {
    fields: [businessHours.companyProfileId],
    references: [companyProfiles.id],
  }),
}));

// Listings table (for each platform the business is listed on)
export const businessListings = pgTable('business_listings', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  companyProfileId: integer('company_profile_id').notNull().references(() => companyProfiles.id, { onDelete: 'cascade' }),
  platform: listingPlatformEnum('platform').notNull(),
  listingId: text('listing_id'),
  listingUrl: text('listing_url'),
  syncStatus: listingSyncStatusEnum('sync_status').default('pending').notNull(),
  lastSynced: timestamp('last_synced'),
  platformData: jsonb('platform_data'),
  platformCredentials: jsonb('platform_credentials'),
  verificationStatus: boolean('verification_status').default(false).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at'),
});

// Business Listings relations
export const businessListingsRelations = relations(businessListings, ({ one }) => ({
  user: one(users, {
    fields: [businessListings.userId],
    references: [users.id],
  }),
  companyProfile: one(companyProfiles, {
    fields: [businessListings.companyProfileId],
    references: [companyProfiles.id],
  }),
}));

// Listing Sync Tasks (for manual verification platforms)
export const listingSyncTasks = pgTable('listing_sync_tasks', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  listingId: integer('listing_id').references(() => businessListings.id, { onDelete: 'cascade' }),
  platform: listingPlatformEnum('platform').notNull(),
  taskType: text('task_type').notNull(),
  taskDescription: text('task_description').notNull(),
  status: taskStatusEnum('status').default('pending').notNull(),
  completionSteps: jsonb('completion_steps'),
  completedSteps: jsonb('completed_steps'),
  notes: text('notes'),
  dueDate: timestamp('due_date'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at'),
  completedAt: timestamp('completed_at'),
});

// Listing Sync Tasks relations
export const listingSyncTasksRelations = relations(listingSyncTasks, ({ one }) => ({
  user: one(users, {
    fields: [listingSyncTasks.userId],
    references: [users.id],
  }),
  listing: one(businessListings, {
    fields: [listingSyncTasks.listingId],
    references: [businessListings.id],
  }),
}));

// Reviews table (from various platforms)
export const businessReviews = pgTable('business_reviews', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  listingId: integer('listing_id').references(() => businessListings.id, { onDelete: 'cascade' }),
  platform: listingPlatformEnum('platform').notNull(),
  platformReviewId: text('platform_review_id'),
  authorName: text('author_name'),
  authorAvatar: text('author_avatar'),
  rating: integer('rating'),
  reviewText: text('review_text'),
  reviewDate: timestamp('review_date'),
  responseText: text('response_text'),
  responseDate: timestamp('response_date'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at'),
});

// Business Reviews relations
export const businessReviewsRelations = relations(businessReviews, ({ one }) => ({
  user: one(users, {
    fields: [businessReviews.userId],
    references: [users.id],
  }),
  listing: one(businessListings, {
    fields: [businessReviews.listingId],
    references: [businessListings.id],
  }),
}));

// Insert schemas for new tables
export const insertBusinessHoursSchema = createInsertSchema(businessHours).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertBusinessListingSchema = createInsertSchema(businessListings).omit({
  id: true,
  lastSynced: true,
  createdAt: true,
  updatedAt: true,
});

export const insertListingSyncTaskSchema = createInsertSchema(listingSyncTasks).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  completedAt: true,
});

export const insertBusinessReviewSchema = createInsertSchema(businessReviews).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

// Types for new tables
export type InsertBusinessHours = z.infer<typeof insertBusinessHoursSchema>;
export type BusinessHours = typeof businessHours.$inferSelect;

export type InsertBusinessListing = z.infer<typeof insertBusinessListingSchema>;
export type BusinessListing = typeof businessListings.$inferSelect;

export type InsertListingSyncTask = z.infer<typeof insertListingSyncTaskSchema>;
export type ListingSyncTask = typeof listingSyncTasks.$inferSelect;

export type InsertBusinessReview = z.infer<typeof insertBusinessReviewSchema>;
export type BusinessReview = typeof businessReviews.$inferSelect;

// Huginn Agent Enums
export const agentTypeEnum = pgEnum('agent_type', [
  'web_scraper', 'content_monitor', 'content_creator', 'social_media', 
  'listing_manager', 'review_responder', 'seo_tracker', 'lead_generator', 
  'competitor_monitor', 'trend_analyzer', 'custom'
]);

export const agentStatusEnum = pgEnum('agent_status', ['active', 'paused', 'error', 'configuring']);
export const agentScheduleEnum = pgEnum('agent_schedule', ['manual', 'hourly', 'daily', 'weekly', 'monthly', 'custom']);
export const agentTriggerEnum = pgEnum('agent_trigger', ['schedule', 'webhook', 'event', 'manual', 'api']);

// Huginn Agents table
export const huginnAgents = pgTable('huginn_agents', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  description: text('description'),
  type: agentTypeEnum('type').notNull(),
  status: agentStatusEnum('status').default('configuring').notNull(),
  schedule: agentScheduleEnum('schedule').default('manual').notNull(),
  customSchedule: text('custom_schedule'),
  triggerType: agentTriggerEnum('trigger_type').default('manual').notNull(),
  configuration: jsonb('configuration').notNull(),
  nextRun: timestamp('next_run'),
  workflowPosition: integer('workflow_position').default(0).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at'),
});

// Huginn Agent relations
export const huginnAgentsRelations = relations(huginnAgents, ({ one, many }) => ({
  user: one(users, {
    fields: [huginnAgents.userId],
    references: [users.id],
  }),
  events: many(huginnEvents),
  workflows: many(huginnWorkflows),
}));

// Huginn Events table (for event-driven agent communication)
export const huginnEvents = pgTable('huginn_events', {
  id: serial('id').primaryKey(),
  agentId: integer('agent_id').notNull().references(() => huginnAgents.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  payload: jsonb('payload').notNull(),
  processed: boolean('processed').default(false).notNull(),
  processedAt: timestamp('processed_at'),
  receiverId: integer('receiver_id').references(() => huginnAgents.id),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// Huginn Events relations
export const huginnEventsRelations = relations(huginnEvents, ({ one }) => ({
  agent: one(huginnAgents, {
    fields: [huginnEvents.agentId],
    references: [huginnAgents.id],
  }),
  receiver: one(huginnAgents, {
    fields: [huginnEvents.receiverId],
    references: [huginnAgents.id],
  }),
}));

// Huginn Workflows table (for connected agent workflows)
export const huginnWorkflows = pgTable('huginn_workflows', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  description: text('description'),
  agentIds: integer('agent_ids').array().notNull(),
  flowConfig: jsonb('flow_config').notNull(),
  isActive: boolean('is_active').default(true).notNull(),
  lastRun: timestamp('last_run'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at'),
});

// Huginn Workflows relations
export const huginnWorkflowsRelations = relations(huginnWorkflows, ({ one }) => ({
  user: one(users, {
    fields: [huginnWorkflows.userId],
    references: [users.id],
  }),
}));

// Huginn Log entries table
export const huginnLogs = pgTable('huginn_logs', {
  id: serial('id').primaryKey(),
  agentId: integer('agent_id').references(() => huginnAgents.id, { onDelete: 'cascade' }),
  workflowId: integer('workflow_id').references(() => huginnWorkflows.id, { onDelete: 'cascade' }),
  level: text('level').notNull(),
  message: text('message').notNull(),
  details: jsonb('details'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// Insert schemas for Huginn tables
export const insertHuginnAgentSchema = createInsertSchema(huginnAgents).omit({
  id: true,
  nextRun: true,
  createdAt: true,
  updatedAt: true,
});

export const insertHuginnEventSchema = createInsertSchema(huginnEvents).omit({
  id: true,
  processed: true,
  processedAt: true,
  createdAt: true,
});

export const insertHuginnWorkflowSchema = createInsertSchema(huginnWorkflows).omit({
  id: true,
  lastRun: true,
  createdAt: true,
  updatedAt: true,
});

export const insertHuginnLogSchema = createInsertSchema(huginnLogs).omit({
  id: true,
  createdAt: true,
});

// Types for Huginn tables
export type InsertHuginnAgent = z.infer<typeof insertHuginnAgentSchema>;
export type HuginnAgent = typeof huginnAgents.$inferSelect;

export type InsertHuginnEvent = z.infer<typeof insertHuginnEventSchema>;
export type HuginnEvent = typeof huginnEvents.$inferSelect;

export type InsertHuginnWorkflow = z.infer<typeof insertHuginnWorkflowSchema>;
export type HuginnWorkflow = typeof huginnWorkflows.$inferSelect;

export type InsertHuginnLog = z.infer<typeof insertHuginnLogSchema>;
export type HuginnLog = typeof huginnLogs.$inferSelect;

// Content Pipeline Status Enum
export const pipelineStatusEnum = pgEnum('pipeline_status', [
  'active', 'paused', 'archived', 'deleted'
]);

// Pipeline Run Status Enum
export const pipelineRunStatusEnum = pgEnum('pipeline_run_status', [
  'pending', 'running', 'completed', 'failed', 'cancelled'
]);

// Pipeline Stage/Job Status Enum
export const pipelineStageStatusEnum = pgEnum('pipeline_stage_status', [
  'pending', 'running', 'completed', 'failed', 'cancelled', 'skipped'
]);

// Pipeline Tables
export const contentPipelines = pgTable('content_pipelines', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  description: text('description'),
  status: pipelineStatusEnum('status').default('active').notNull(),
  createdBy: integer('created_by').references(() => users.id),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
  schedule: text('schedule'),
  template: text('template'),
  config: jsonb('config')
});

export const contentPipelineRuns = pgTable('content_pipeline_runs', {
  id: serial('id').primaryKey(),
  pipelineId: integer('pipeline_id').references(() => contentPipelines.id, { onDelete: 'cascade' }),
  status: pipelineRunStatusEnum('status').default('pending').notNull(),
  startTime: timestamp('start_time').defaultNow().notNull(),
  endTime: timestamp('end_time'),
  result: jsonb('result'),
  errorMessage: text('error_message'),
  createdBy: integer('created_by').references(() => users.id),
  params: jsonb('params')
});

export const contentPipelineStages = pgTable('content_pipeline_stages', {
  id: serial('id').primaryKey(),
  pipelineRunId: integer('pipeline_run_id').references(() => contentPipelineRuns.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  status: pipelineStageStatusEnum('status').default('pending').notNull(),
  startTime: timestamp('start_time'),
  endTime: timestamp('end_time'),
  position: integer('position'),
  config: jsonb('config')
});

export const contentPipelineJobs = pgTable('content_pipeline_jobs', {
  id: serial('id').primaryKey(),
  stageId: integer('stage_id').references(() => contentPipelineStages.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  type: text('type').notNull(),
  status: pipelineStageStatusEnum('status').default('pending').notNull(),
  startTime: timestamp('start_time'),
  endTime: timestamp('end_time'),
  result: jsonb('result'),
  errorMessage: text('error_message'),
  config: jsonb('config')
});

export const contentPipelineLogs = pgTable('content_pipeline_logs', {
  id: serial('id').primaryKey(),
  pipelineRunId: integer('pipeline_run_id').references(() => contentPipelineRuns.id, { onDelete: 'cascade' }),
  stageId: integer('stage_id').references(() => contentPipelineStages.id, { onDelete: 'set null' }),
  jobId: integer('job_id').references(() => contentPipelineJobs.id, { onDelete: 'set null' }),
  level: text('level').notNull(),
  message: text('message').notNull(),
  timestamp: timestamp('timestamp').defaultNow().notNull(),
  metadata: jsonb('metadata')
});

// Pipeline relations
export const contentPipelinesRelations = relations(contentPipelines, ({ one, many }) => ({
  createdByUser: one(users, {
    fields: [contentPipelines.createdBy],
    references: [users.id],
  }),
  runs: many(contentPipelineRuns)
}));

export const contentPipelineRunsRelations = relations(contentPipelineRuns, ({ one, many }) => ({
  pipeline: one(contentPipelines, {
    fields: [contentPipelineRuns.pipelineId],
    references: [contentPipelines.id],
  }),
  createdByUser: one(users, {
    fields: [contentPipelineRuns.createdBy],
    references: [users.id],
  }),
  stages: many(contentPipelineStages),
  logs: many(contentPipelineLogs)
}));

export const contentPipelineStagesRelations = relations(contentPipelineStages, ({ one, many }) => ({
  pipelineRun: one(contentPipelineRuns, {
    fields: [contentPipelineStages.pipelineRunId],
    references: [contentPipelineRuns.id],
  }),
  jobs: many(contentPipelineJobs),
  logs: many(contentPipelineLogs)
}));

export const contentPipelineJobsRelations = relations(contentPipelineJobs, ({ one, many }) => ({
  stage: one(contentPipelineStages, {
    fields: [contentPipelineJobs.stageId],
    references: [contentPipelineStages.id],
  }),
  logs: many(contentPipelineLogs)
}));

export const contentPipelineLogsRelations = relations(contentPipelineLogs, ({ one }) => ({
  pipelineRun: one(contentPipelineRuns, {
    fields: [contentPipelineLogs.pipelineRunId],
    references: [contentPipelineRuns.id],
  }),
  stage: one(contentPipelineStages, {
    fields: [contentPipelineLogs.stageId],
    references: [contentPipelineStages.id],
  }),
  job: one(contentPipelineJobs, {
    fields: [contentPipelineLogs.jobId],
    references: [contentPipelineJobs.id],
  })
}));

// Insert schemas for Pipeline tables
export const insertContentPipelineSchema = createInsertSchema(contentPipelines).omit({
  id: true,
  createdAt: true,
  updatedAt: true
});

export const insertContentPipelineRunSchema = createInsertSchema(contentPipelineRuns).omit({
  id: true,
  startTime: true
});

export const insertContentPipelineStageSchema = createInsertSchema(contentPipelineStages).omit({
  id: true
});

export const insertContentPipelineJobSchema = createInsertSchema(contentPipelineJobs).omit({
  id: true
});

export const insertContentPipelineLogSchema = createInsertSchema(contentPipelineLogs).omit({
  id: true,
  timestamp: true
});

// Types for Pipeline tables
export type InsertContentPipeline = z.infer<typeof insertContentPipelineSchema>;
export type ContentPipeline = typeof contentPipelines.$inferSelect;

export type InsertContentPipelineRun = z.infer<typeof insertContentPipelineRunSchema>;
export type ContentPipelineRun = typeof contentPipelineRuns.$inferSelect;

export type InsertContentPipelineStage = z.infer<typeof insertContentPipelineStageSchema>;
export type ContentPipelineStage = typeof contentPipelineStages.$inferSelect;

export type InsertContentPipelineJob = z.infer<typeof insertContentPipelineJobSchema>;
export type ContentPipelineJob = typeof contentPipelineJobs.$inferSelect;

export type InsertContentPipelineLog = z.infer<typeof insertContentPipelineLogSchema>;
export type ContentPipelineLog = typeof contentPipelineLogs.$inferSelect;
