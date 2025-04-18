-- Create Huginn Agent Enums
DO $$ BEGIN
    CREATE TYPE agent_type AS ENUM ('web_scraper', 'content_monitor', 'content_creator', 'social_media', 'listing_manager', 'review_responder', 'custom');
    EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
    CREATE TYPE agent_status AS ENUM ('active', 'paused', 'error', 'configuring');
    EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
    CREATE TYPE agent_schedule AS ENUM ('manual', 'hourly', 'daily', 'weekly', 'monthly', 'custom');
    EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
    CREATE TYPE agent_trigger AS ENUM ('schedule', 'webhook', 'event', 'manual', 'api');
    EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Create Huginn Agents Table
CREATE TABLE IF NOT EXISTS huginn_agents (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    type agent_type NOT NULL,
    status agent_status NOT NULL DEFAULT 'configuring',
    schedule agent_schedule NOT NULL,
    custom_schedule VARCHAR(255),
    trigger_type agent_trigger NOT NULL,
    configuration JSONB NOT NULL DEFAULT '{}',
    workflow_position INTEGER NOT NULL DEFAULT 0,
    next_run TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Create Huginn Events Table
CREATE TABLE IF NOT EXISTS huginn_events (
    id SERIAL PRIMARY KEY,
    agent_id INTEGER NOT NULL REFERENCES huginn_agents(id) ON DELETE CASCADE,
    receiver_id INTEGER REFERENCES huginn_agents(id) ON DELETE SET NULL,
    name VARCHAR(255) NOT NULL,
    payload JSONB NOT NULL DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Create Huginn Workflows Table
CREATE TABLE IF NOT EXISTS huginn_workflows (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    agent_ids INTEGER[] NOT NULL,
    flow_config JSONB NOT NULL DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Create Huginn Logs Table
CREATE TABLE IF NOT EXISTS huginn_logs (
    id SERIAL PRIMARY KEY,
    agent_id INTEGER NOT NULL REFERENCES huginn_agents(id) ON DELETE CASCADE,
    workflow_id INTEGER REFERENCES huginn_workflows(id) ON DELETE SET NULL,
    level VARCHAR(50) NOT NULL,
    message TEXT NOT NULL,
    details JSONB,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_huginn_agents_user_id ON huginn_agents(user_id);
CREATE INDEX IF NOT EXISTS idx_huginn_agents_status ON huginn_agents(status);
CREATE INDEX IF NOT EXISTS idx_huginn_events_agent_id ON huginn_events(agent_id);
CREATE INDEX IF NOT EXISTS idx_huginn_events_receiver_id ON huginn_events(receiver_id);
CREATE INDEX IF NOT EXISTS idx_huginn_workflows_user_id ON huginn_workflows(user_id);
CREATE INDEX IF NOT EXISTS idx_huginn_logs_agent_id ON huginn_logs(agent_id);
CREATE INDEX IF NOT EXISTS idx_huginn_logs_workflow_id ON huginn_logs(workflow_id);
CREATE INDEX IF NOT EXISTS idx_huginn_logs_created_at ON huginn_logs(created_at);