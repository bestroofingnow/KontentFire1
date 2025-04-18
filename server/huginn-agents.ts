/**
 * Huginn Agent Integration Module
 * 
 * This module provides functionality to interact with Huginn agents via their API.
 * It allows for the creation, management, and execution of Huginn agents from the content pipeline system.
 */

import axios from 'axios';
import { db } from './db';
import { eq } from 'drizzle-orm';

// Configuration for Huginn API connections
interface HuginnConfig {
  baseUrl: string;
  apiKey: string;
  maxRetries: number;
  retryDelay: number;
}

// Huginn Agent Types (partial list, can be expanded)
export const HUGINN_AGENT_TYPES = [
  'WebsiteAgent',
  'DataOutputAgent',
  'EventFormattingAgent',
  'EmailAgent',
  'HttpStatusAgent',
  'JsAgent',
  'PostAgent',
  'WeatherAgent',
  'TwitterStreamAgent',
  'RssAgent',
  'JsonParseAgent',
  'CommanderAgent',
  'SchedulerAgent',
  'ManualEventAgent',
  'GoogleCalendarPublishAgent',
  'PushoverAgent',
  'SlackAgent'
];

// Agent configuration interface
export interface HuginnAgentConfig {
  name: string;
  type: string;
  schedule?: string;
  keep_events_for?: number;
  propagate_immediately?: boolean;
  disabled?: boolean;
  service_id?: number;
  source_ids?: number[];
  receiver_ids?: number[];
  options: Record<string, any>;
}

// Agent response interface
export interface HuginnAgent {
  id: number;
  name: string;
  type: string;
  disabled: boolean;
  silent: boolean;
  guid: string;
  service_id?: number;
  schedule?: string;
  events_count: number;
  last_check_at?: string;
  last_event_at?: string;
  last_error?: string;
  last_receive_at?: string;
  created_at: string;
  updated_at: string;
  options: Record<string, any>;
  memory?: Record<string, any>;
  source_ids: number[];
  receiver_ids: number[];
}

// Agent event interface
export interface HuginnEvent {
  id: number;
  agent_id: number;
  created_at: string;
  payload: Record<string, any>;
  user_id: number;
}

class HuginnAgentService {
  private config: HuginnConfig;
  private axiosInstance: any;

  constructor() {
    // Default configuration, can be overridden by environment variables
    this.config = {
      baseUrl: process.env.HUGINN_API_URL || 'http://localhost:3000',
      apiKey: process.env.HUGINN_API_KEY || '',
      maxRetries: 3,
      retryDelay: 1000
    };

    this.axiosInstance = axios.create({
      baseURL: this.config.baseUrl,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.config.apiKey}`
      },
      timeout: 30000
    });

    // Add retry interceptor
    this.axiosInstance.interceptors.response.use(null, async (error: any) => {
      const { config, response } = error;
      
      if (!config || !response) {
        return Promise.reject(error);
      }
      
      config.__retryCount = config.__retryCount || 0;
      
      if (config.__retryCount >= this.config.maxRetries) {
        return Promise.reject(error);
      }
      
      config.__retryCount++;
      
      await new Promise(resolve => setTimeout(resolve, this.config.retryDelay));
      
      return this.axiosInstance(config);
    });
  }

  /**
   * Get all agents from Huginn
   * @returns Array of Huginn agents
   */
  async getAgents(): Promise<HuginnAgent[]> {
    try {
      const response = await this.axiosInstance.get('/api/agents');
      return response.data;
    } catch (error) {
      console.error('Error fetching Huginn agents:', error);
      throw new Error('Failed to fetch Huginn agents');
    }
  }

  /**
   * Get a specific agent by ID
   * @param agentId The ID of the agent to retrieve
   * @returns The requested Huginn agent
   */
  async getAgent(agentId: number): Promise<HuginnAgent> {
    try {
      const response = await this.axiosInstance.get(`/api/agents/${agentId}`);
      return response.data;
    } catch (error) {
      console.error(`Error fetching Huginn agent ${agentId}:`, error);
      throw new Error(`Failed to fetch Huginn agent ${agentId}`);
    }
  }

  /**
   * Create a new agent in Huginn
   * @param config The configuration for the new agent
   * @returns The created Huginn agent
   */
  async createAgent(config: HuginnAgentConfig): Promise<HuginnAgent> {
    try {
      const response = await this.axiosInstance.post('/api/agents', {
        agent: config
      });
      return response.data;
    } catch (error) {
      console.error('Error creating Huginn agent:', error);
      throw new Error(`Failed to create Huginn agent: ${error.message}`);
    }
  }

  /**
   * Update an existing agent in Huginn
   * @param agentId The ID of the agent to update
   * @param config The new configuration for the agent
   * @returns The updated Huginn agent
   */
  async updateAgent(agentId: number, config: Partial<HuginnAgentConfig>): Promise<HuginnAgent> {
    try {
      const response = await this.axiosInstance.put(`/api/agents/${agentId}`, {
        agent: config
      });
      return response.data;
    } catch (error) {
      console.error(`Error updating Huginn agent ${agentId}:`, error);
      throw new Error(`Failed to update Huginn agent ${agentId}`);
    }
  }

  /**
   * Delete an agent from Huginn
   * @param agentId The ID of the agent to delete
   * @returns Success status
   */
  async deleteAgent(agentId: number): Promise<boolean> {
    try {
      await this.axiosInstance.delete(`/api/agents/${agentId}`);
      return true;
    } catch (error) {
      console.error(`Error deleting Huginn agent ${agentId}:`, error);
      throw new Error(`Failed to delete Huginn agent ${agentId}`);
    }
  }

  /**
   * Trigger a Huginn agent to run
   * @param agentId The ID of the agent to run
   * @returns Success status
   */
  async runAgent(agentId: number): Promise<boolean> {
    try {
      await this.axiosInstance.post(`/api/agents/${agentId}/run`);
      return true;
    } catch (error) {
      console.error(`Error running Huginn agent ${agentId}:`, error);
      throw new Error(`Failed to run Huginn agent ${agentId}`);
    }
  }

  /**
   * Get events for a specific agent
   * @param agentId The ID of the agent
   * @param limit The maximum number of events to retrieve
   * @returns Array of events from the agent
   */
  async getAgentEvents(agentId: number, limit: number = 10): Promise<HuginnEvent[]> {
    try {
      const response = await this.axiosInstance.get(`/api/agents/${agentId}/events`, {
        params: { limit }
      });
      return response.data;
    } catch (error) {
      console.error(`Error fetching events for Huginn agent ${agentId}:`, error);
      throw new Error(`Failed to fetch events for Huginn agent ${agentId}`);
    }
  }

  /**
   * Check if the Huginn API is available
   * @returns True if available, false otherwise
   */
  async isAvailable(): Promise<boolean> {
    try {
      await this.axiosInstance.get('/api/agents');
      return true;
    } catch (error) {
      console.error('Huginn API is not available:', error);
      return false;
    }
  }

  /**
   * Create a typical WebsiteAgent for scraping content
   * @param name Agent name
   * @param url URL to scrape
   * @param cssSelector CSS selector for extraction
   * @param schedule How often to run (in Huginn schedule format)
   * @returns The created Huginn agent
   */
  async createWebsiteScraperAgent(
    name: string,
    url: string,
    cssSelector: string,
    schedule: string = 'every_1h'
  ): Promise<HuginnAgent> {
    const config: HuginnAgentConfig = {
      name,
      type: 'WebsiteAgent',
      schedule,
      options: {
        url,
        mode: 'on_change',
        extract: {
          content: {
            css: cssSelector,
            value: 'text'
          }
        }
      }
    };
    
    return await this.createAgent(config);
  }

  /**
   * Create a typical RssAgent for monitoring RSS feeds
   * @param name Agent name
   * @param url RSS feed URL
   * @param schedule How often to run (in Huginn schedule format)
   * @returns The created Huginn agent
   */
  async createRssMonitorAgent(
    name: string,
    url: string,
    schedule: string = 'every_30m'
  ): Promise<HuginnAgent> {
    const config: HuginnAgentConfig = {
      name,
      type: 'RssAgent',
      schedule,
      options: {
        url,
        expected_update_period_in_days: 2
      }
    };
    
    return await this.createAgent(config);
  }

  /**
   * Create a typical EmailAgent for sending notifications
   * @param name Agent name
   * @param recipients Email recipients
   * @param subject Email subject template
   * @param body Email body template
   * @returns The created Huginn agent
   */
  async createEmailNotificationAgent(
    name: string,
    recipients: string[],
    subject: string,
    body: string
  ): Promise<HuginnAgent> {
    const config: HuginnAgentConfig = {
      name,
      type: 'EmailAgent',
      options: {
        subject,
        body,
        recipients: recipients.join(', ')
      }
    };
    
    return await this.createAgent(config);
  }

  /**
   * Create a typical WebhookAgent for receiving external notifications
   * @param name Agent name
   * @param secret Secret token for webhook authentication
   * @returns The created Huginn agent
   */
  async createWebhookAgent(
    name: string,
    secret: string
  ): Promise<HuginnAgent> {
    const config: HuginnAgentConfig = {
      name,
      type: 'WebhookAgent',
      options: {
        secret,
        expected_receive_period_in_days: 1,
        payload_path: '.'
      }
    };
    
    return await this.createAgent(config);
  }
}

// Export singleton instance
export const huginnAgentService = new HuginnAgentService();

// Types available for agent creation
export async function getAgentTypes(): Promise<string[]> {
  return HUGINN_AGENT_TYPES;
}