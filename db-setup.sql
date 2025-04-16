-- Create enums
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'content_type') THEN
        CREATE TYPE "content_type" AS ENUM ('text', 'image', 'both');
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'content_status') THEN
        CREATE TYPE "content_status" AS ENUM ('draft', 'scheduled', 'published');
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'platform_type') THEN
        CREATE TYPE "platform_type" AS ENUM ('blog', 'facebook', 'instagram', 'twitter', 'linkedin', 'youtube', 'tiktok', 'pinterest');
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'frequency_type') THEN
        CREATE TYPE "frequency_type" AS ENUM ('daily', 'weekly', 'bi-weekly', 'monthly');
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'tone_type') THEN
        CREATE TYPE "tone_type" AS ENUM ('professional', 'casual', 'friendly', 'authoritative', 'humorous');
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'auto_content_status') THEN
        CREATE TYPE "auto_content_status" AS ENUM ('pending', 'published', 'failed');
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'plan_type') THEN
        CREATE TYPE "plan_type" AS ENUM ('premium');
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'listing_platform_type') THEN
        CREATE TYPE "listing_platform_type" AS ENUM (
          'google', 'facebook', 'instagram', 'linkedin', 'foursquare', 'youtube',
          'apple_maps', 'yelp', 'bing', 'angi', 'yellowpages', 'bbb', 'chamber'
        );
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'listing_sync_status') THEN
        CREATE TYPE "listing_sync_status" AS ENUM ('synced', 'pending', 'failed', 'manual_required');
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'task_status') THEN
        CREATE TYPE "task_status" AS ENUM ('pending', 'in_progress', 'completed', 'failed');
    END IF;
END $$;

-- Create company_profiles table if it doesn't exist
CREATE TABLE IF NOT EXISTS "company_profiles" (
  "id" SERIAL PRIMARY KEY,
  "user_id" INTEGER NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "company_name" TEXT NOT NULL,
  "industry" TEXT,
  "description" TEXT,
  "website_url" TEXT,
  "logo_url" TEXT,
  "primary_color" TEXT,
  "secondary_color" TEXT,
  "facebook_url" TEXT,
  "twitter_url" TEXT,
  "instagram_url" TEXT,
  "linkedin_url" TEXT,
  "youtube_url" TEXT,
  "tiktok_url" TEXT,
  "pinterest_url" TEXT,
  "additional_info" TEXT,
  "created_at" TIMESTAMP NOT NULL DEFAULT NOW(),
  "updated_at" TIMESTAMP
);

-- Create auto_content_configs table if it doesn't exist
CREATE TABLE IF NOT EXISTS "auto_content_configs" (
  "id" SERIAL PRIMARY KEY,
  "user_id" INTEGER NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "enabled" BOOLEAN NOT NULL DEFAULT FALSE,
  "post_frequency" frequency_type NOT NULL DEFAULT 'weekly',
  "platforms" TEXT[] NOT NULL,
  "topic_categories" TEXT[] NOT NULL,
  "content_tone" tone_type NOT NULL DEFAULT 'professional',
  "include_images" BOOLEAN NOT NULL DEFAULT TRUE,
  "custom_notes" TEXT,
  "default_hashtags" TEXT,
  "best_time_to_post" BOOLEAN NOT NULL DEFAULT TRUE,
  "specific_post_time" TEXT,
  "created_at" TIMESTAMP NOT NULL DEFAULT NOW(),
  "updated_at" TIMESTAMP
);

-- Create auto_generated_contents table if it doesn't exist
CREATE TABLE IF NOT EXISTS "auto_generated_contents" (
  "id" SERIAL PRIMARY KEY,
  "user_id" INTEGER NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "config_id" INTEGER NOT NULL REFERENCES "auto_content_configs"("id") ON DELETE CASCADE,
  "title" TEXT NOT NULL,
  "text_content" TEXT,
  "image_url" TEXT,
  "content_type" content_type NOT NULL,
  "platform" platform_type NOT NULL,
  "scheduled_date" TIMESTAMP NOT NULL,
  "status" auto_content_status NOT NULL DEFAULT 'pending',
  "generation_prompt" TEXT,
  "published_date" TIMESTAMP,
  "engagement_metrics" TEXT,
  "created_at" TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Create business_hours table if it doesn't exist
CREATE TABLE IF NOT EXISTS "business_hours" (
  "id" SERIAL PRIMARY KEY,
  "company_profile_id" INTEGER NOT NULL REFERENCES "company_profiles"("id") ON DELETE CASCADE,
  "monday" TEXT,
  "tuesday" TEXT,
  "wednesday" TEXT,
  "thursday" TEXT,
  "friday" TEXT,
  "saturday" TEXT,
  "sunday" TEXT,
  "holidays" TEXT,
  "created_at" TIMESTAMP NOT NULL DEFAULT NOW(),
  "updated_at" TIMESTAMP
);

-- Create business_listings table if it doesn't exist
CREATE TABLE IF NOT EXISTS "business_listings" (
  "id" SERIAL PRIMARY KEY,
  "user_id" INTEGER NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "company_profile_id" INTEGER NOT NULL REFERENCES "company_profiles"("id") ON DELETE CASCADE,
  "platform" listing_platform_type NOT NULL,
  "listing_id" TEXT,
  "listing_url" TEXT,
  "sync_status" listing_sync_status NOT NULL DEFAULT 'pending',
  "last_synced" TIMESTAMP,
  "platform_data" JSONB,
  "platform_credentials" JSONB,
  "verification_status" BOOLEAN NOT NULL DEFAULT FALSE,
  "created_at" TIMESTAMP NOT NULL DEFAULT NOW(),
  "updated_at" TIMESTAMP
);

-- Create listing_sync_tasks table if it doesn't exist
CREATE TABLE IF NOT EXISTS "listing_sync_tasks" (
  "id" SERIAL PRIMARY KEY,
  "user_id" INTEGER NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "listing_id" INTEGER REFERENCES "business_listings"("id") ON DELETE CASCADE,
  "platform" listing_platform_type NOT NULL,
  "task_type" TEXT NOT NULL,
  "task_description" TEXT NOT NULL,
  "status" task_status NOT NULL DEFAULT 'pending',
  "completion_steps" JSONB,
  "completed_steps" JSONB,
  "notes" TEXT,
  "due_date" TIMESTAMP,
  "created_at" TIMESTAMP NOT NULL DEFAULT NOW(),
  "updated_at" TIMESTAMP,
  "completed_at" TIMESTAMP
);

-- Create business_reviews table if it doesn't exist
CREATE TABLE IF NOT EXISTS "business_reviews" (
  "id" SERIAL PRIMARY KEY,
  "user_id" INTEGER NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "listing_id" INTEGER REFERENCES "business_listings"("id") ON DELETE CASCADE,
  "platform" listing_platform_type NOT NULL,
  "platform_review_id" TEXT,
  "author_name" TEXT,
  "author_avatar" TEXT,
  "rating" INTEGER,
  "review_text" TEXT,
  "review_date" TIMESTAMP,
  "response_text" TEXT,
  "response_date" TIMESTAMP,
  "created_at" TIMESTAMP NOT NULL DEFAULT NOW(),
  "updated_at" TIMESTAMP
);