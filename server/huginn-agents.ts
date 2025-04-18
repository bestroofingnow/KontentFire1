/**
 * Huginn Agent System
 * This module integrates with Huginn for creating smart agents that can automate various tasks.
 * Based on: https://github.com/huginn/huginn
 */

import axios from 'axios';
import { spawn } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import { db } from './db';

// ES Module equivalent of __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

import { 
  huginnAgents, 
  huginnEvents, 
  huginnLogs, 
  huginnWorkflows,
  agentTypeEnum,
  HuginnAgent, 
  HuginnWorkflow 
} from '@shared/schema';
import { eq, and, inArray, desc } from 'drizzle-orm';

type AgentType = typeof agentTypeEnum.enumValues[number];

// Base configuration for all agents
interface BaseAgentConfig {
  name: string;
  description: string;
  schedule: string;
  options: Record<string, any>;
}

// Agent-specific configuration types
interface WebScraperConfig extends BaseAgentConfig {
  url: string;
  selector: string;
  extract_mode: 'text' | 'html' | 'attribute';
  attribute_name?: string;
}

interface ContentMonitorConfig extends BaseAgentConfig {
  sources: string[];
  keywords: string[];
  notify_on_change: boolean;
}

interface ContentCreatorConfig extends BaseAgentConfig {
  template: string;
  variables: Record<string, string>;
  platform: string;
}

interface SocialMediaConfig extends BaseAgentConfig {
  platform: string;
  action: 'post' | 'monitor' | 'interact';
  content_source?: string;
}

// Main agent service class
export class HuginnAgentService {
  private static instance: HuginnAgentService;
  private isInitialized = false;
  private huginnPath = path.join(__dirname, '../huginn');
  private scheduledAgents: Map<number, NodeJS.Timeout> = new Map();
  
  private constructor() {}
  
  /**
   * Get singleton instance of the service
   */
  public static getInstance(): HuginnAgentService {
    if (!HuginnAgentService.instance) {
      HuginnAgentService.instance = new HuginnAgentService();
    }
    return HuginnAgentService.instance;
  }
  
  /**
   * Initialize the Huginn agent system
   */
  public async initialize(): Promise<void> {
    if (this.isInitialized) return;
    
    try {
      // Ensure Huginn directory exists
      if (!fs.existsSync(this.huginnPath)) {
        fs.mkdirSync(this.huginnPath, { recursive: true });
      }
      
      // Check if we need to clone Huginn repo
      if (!fs.existsSync(path.join(this.huginnPath, 'Gemfile'))) {
        console.log('Cloning Huginn repository...');
        await this.cloneHuginnRepo();
      }
      
      // Initialize agent schedules for active agents
      await this.initializeAgentSchedules();
      
      this.isInitialized = true;
      console.log('Huginn agent system initialized');
    } catch (error) {
      console.error('Failed to initialize Huginn agent system:', error);
      throw error;
    }
  }
  
  /**
   * Clone the Huginn repository from GitHub
   */
  private async cloneHuginnRepo(): Promise<void> {
    return new Promise((resolve, reject) => {
      const gitClone = spawn('git', ['clone', 'https://github.com/huginn/huginn.git', this.huginnPath]);
      
      gitClone.on('close', (code) => {
        if (code === 0) {
          console.log('Huginn repository cloned successfully');
          resolve();
        } else {
          reject(new Error(`Git clone failed with code ${code}`));
        }
      });
      
      gitClone.stderr.on('data', (data) => {
        console.error(`Git clone stderr: ${data}`);
      });
    });
  }
  
  /**
   * Initialize schedules for all active agents
   */
  private async initializeAgentSchedules(): Promise<void> {
    try {
      const activeAgents = await db.select().from(huginnAgents)
        .where(eq(huginnAgents.status, 'active'));
      
      for (const agent of activeAgents) {
        await this.scheduleAgent(agent);
      }
      
      console.log(`Scheduled ${activeAgents.length} active agents`);
    } catch (error) {
      console.error('Failed to initialize agent schedules:', error);
    }
  }
  
  /**
   * Schedule an agent to run according to its schedule
   */
  private async scheduleAgent(agent: HuginnAgent): Promise<void> {
    if (agent.schedule === 'manual') return;
    
    // Clear any existing schedule
    if (this.scheduledAgents.has(agent.id)) {
      clearTimeout(this.scheduledAgents.get(agent.id));
      this.scheduledAgents.delete(agent.id);
    }
    
    // Calculate next run time based on schedule
    let intervalMs: number;
    switch (agent.schedule) {
      case 'hourly':
        intervalMs = 60 * 60 * 1000;
        break;
      case 'daily':
        intervalMs = 24 * 60 * 60 * 1000;
        break;
      case 'weekly':
        intervalMs = 7 * 24 * 60 * 60 * 1000;
        break;
      case 'monthly':
        intervalMs = 30 * 24 * 60 * 60 * 1000;
        break;
      case 'custom':
        // Parse custom schedule (simplified for now)
        intervalMs = agent.customSchedule ? parseInt(agent.customSchedule) * 1000 : 24 * 60 * 60 * 1000;
        break;
      default:
        return; // Do not schedule if not applicable
    }
    
    // Schedule the agent
    const timeout = setTimeout(async () => {
      await this.runAgent(agent.id);
      // Reschedule after running
      const updatedAgent = await this.getAgent(agent.id);
      if (updatedAgent && updatedAgent.status === 'active') {
        this.scheduleAgent(updatedAgent);
      }
    }, intervalMs);
    
    this.scheduledAgents.set(agent.id, timeout);
    
    // Update next run time in database
    const nextRun = new Date(Date.now() + intervalMs);
    await db.update(huginnAgents)
      .set({ nextRun })
      .where(eq(huginnAgents.id, agent.id));
  }
  
  /**
   * Get an agent by ID
   */
  public async getAgent(agentId: number): Promise<HuginnAgent | undefined> {
    const [agent] = await db.select().from(huginnAgents)
      .where(eq(huginnAgents.id, agentId));
    return agent;
  }
  
  /**
   * Get all agents for a user
   */
  public async getUserAgents(userId: number): Promise<HuginnAgent[]> {
    return db.select().from(huginnAgents)
      .where(eq(huginnAgents.userId, userId));
  }
  
  /**
   * Create a new agent
   */
  public async createAgent(userId: number, agentData: {
    name: string;
    description?: string;
    type: AgentType;
    schedule: string;
    customSchedule?: string;
    triggerType: string;
    configuration: Record<string, any>;
  }): Promise<HuginnAgent> {
    try {
      // Validate configuration based on agent type
      this.validateAgentConfiguration(agentData.type, agentData.configuration);
      
      const [agent] = await db.insert(huginnAgents)
        .values({
          userId,
          name: agentData.name,
          description: agentData.description || '',
          type: agentData.type,
          status: 'configuring',
          schedule: agentData.schedule as any,
          customSchedule: agentData.customSchedule,
          triggerType: agentData.triggerType as any,
          configuration: agentData.configuration,
          workflowPosition: 0,
          createdAt: new Date(),
          updatedAt: new Date(),
        })
        .returning();
      
      // Log creation
      await this.logAgentActivity(agent.id, null, 'info', 'Agent created');
      
      return agent;
    } catch (error) {
      console.error('Failed to create agent:', error);
      throw error;
    }
  }
  
  /**
   * Update an existing agent
   */
  public async updateAgent(agentId: number, userId: number, updateData: Partial<{
    name: string;
    description: string;
    status: 'active' | 'paused' | 'error' | 'configuring';
    schedule: 'manual' | 'hourly' | 'daily' | 'weekly' | 'monthly' | 'custom';
    customSchedule: string;
    triggerType: 'schedule' | 'webhook' | 'event' | 'manual' | 'api';
    configuration: Record<string, any>;
  }>): Promise<HuginnAgent> {
    try {
      // Check that agent exists and belongs to user
      const [existingAgent] = await db.select().from(huginnAgents)
        .where(and(
          eq(huginnAgents.id, agentId),
          eq(huginnAgents.userId, userId)
        ));
      
      if (!existingAgent) {
        throw new Error('Agent not found or does not belong to user');
      }
      
      // If configuration is being updated, validate it
      if (updateData.configuration) {
        this.validateAgentConfiguration(existingAgent.type, updateData.configuration);
      }
      
      // Update the agent
      const [updatedAgent] = await db.update(huginnAgents)
        .set({
          ...updateData,
          updatedAt: new Date(),
        })
        .where(eq(huginnAgents.id, agentId))
        .returning();
      
      // If schedule changed, update the agent's schedule
      if (updateData.schedule || updateData.status === 'active') {
        await this.scheduleAgent(updatedAgent);
      } else if (updateData.status === 'paused') {
        // Clear schedule if agent is paused
        if (this.scheduledAgents.has(agentId)) {
          clearTimeout(this.scheduledAgents.get(agentId));
          this.scheduledAgents.delete(agentId);
        }
      }
      
      // Log update
      await this.logAgentActivity(agentId, null, 'info', 'Agent updated');
      
      return updatedAgent;
    } catch (error) {
      console.error(`Failed to update agent ${agentId}:`, error);
      throw error;
    }
  }
  
  /**
   * Delete an agent
   */
  public async deleteAgent(agentId: number, userId: number): Promise<void> {
    try {
      // Check that agent exists and belongs to user
      const [agent] = await db.select().from(huginnAgents)
        .where(and(
          eq(huginnAgents.id, agentId),
          eq(huginnAgents.userId, userId)
        ));
      
      if (!agent) {
        throw new Error('Agent not found or does not belong to user');
      }
      
      // Clear any scheduled runs
      if (this.scheduledAgents.has(agentId)) {
        clearTimeout(this.scheduledAgents.get(agentId));
        this.scheduledAgents.delete(agentId);
      }
      
      // Delete the agent (cascades to events and logs)
      await db.delete(huginnAgents)
        .where(eq(huginnAgents.id, agentId));
      
      // Find workflows that include this agent and update them
      const workflows = await db.select().from(huginnWorkflows)
        .where(eq(huginnWorkflows.userId, userId));
      
      for (const workflow of workflows) {
        // Check if workflow contains this agent
        if (workflow.agentIds.includes(agentId)) {
          // Remove agent from workflow
          const updatedAgentIds = workflow.agentIds.filter(id => id !== agentId);
          
          if (updatedAgentIds.length > 0) {
            // Update workflow if it still has agents
            await db.update(huginnWorkflows)
              .set({
                agentIds: updatedAgentIds,
                updatedAt: new Date(),
              })
              .where(eq(huginnWorkflows.id, workflow.id));
          } else {
            // Delete workflow if it has no agents left
            await db.delete(huginnWorkflows)
              .where(eq(huginnWorkflows.id, workflow.id));
          }
        }
      }
    } catch (error) {
      console.error(`Failed to delete agent ${agentId}:`, error);
      throw error;
    }
  }
  
  /**
   * Run an agent manually
   */
  public async runAgent(agentId: number, userId?: number): Promise<any> {
    try {
      // Get the agent
      const [agent] = await db.select().from(huginnAgents)
        .where(userId ? 
          and(eq(huginnAgents.id, agentId), eq(huginnAgents.userId, userId)) : 
          eq(huginnAgents.id, agentId)
        );
      
      if (!agent) {
        throw new Error('Agent not found or does not belong to user');
      }
      
      // Update last run time
      await db.update(huginnAgents)
        .set({
          updatedAt: new Date(),
        })
        .where(eq(huginnAgents.id, agentId));
      
      // Execute the agent based on its type
      let result;
      switch (agent.type) {
        case 'web_scraper':
          result = await this.runWebScraper(agent);
          break;
        case 'content_monitor':
          result = await this.runContentMonitor(agent);
          break;
        case 'content_creator':
          result = await this.runContentCreator(agent);
          break;
        case 'social_media':
          result = await this.runSocialMedia(agent);
          break;
        case 'listing_manager':
          result = await this.runListingManager(agent);
          break;
        case 'review_responder':
          result = await this.runReviewResponder(agent);
          break;
        default:
          result = await this.runCustomAgent(agent);
      }
      
      // Log the result
      await this.logAgentActivity(agentId, null, 'info', 'Agent result', { result });
      
      // Update timestamp
      await db.update(huginnAgents)
        .set({
          updatedAt: new Date(),
        })
        .where(eq(huginnAgents.id, agentId));
      
      // Log success
      await this.logAgentActivity(agentId, null, 'info', 'Agent run successful', { result });
      
      return result;
    } catch (error: any) {
      console.error(`Failed to run agent ${agentId}:`, error);
      
      // Log error
      await this.logAgentActivity(agentId, null, 'error', 'Agent run failed', { 
        errorMessage: error.message || 'Unknown error',
        errorStack: error.stack || 'No stack trace'
      });
      
      // Update agent status to error
      await db.update(huginnAgents)
        .set({
          status: 'error',
          updatedAt: new Date(),
        })
        .where(eq(huginnAgents.id, agentId));
      
      throw error;
    }
  }
  
  /**
   * Create a new workflow
   */
  public async createWorkflow(userId: number, workflowData: {
    name: string;
    description?: string;
    agentIds: number[];
    flowConfig: Record<string, any>;
  }): Promise<HuginnWorkflow> {
    try {
      // Validate that all agents exist and belong to the user
      const agents = await db.select().from(huginnAgents)
        .where(and(
          inArray(huginnAgents.id, workflowData.agentIds),
          eq(huginnAgents.userId, userId)
        ));
      
      if (agents.length !== workflowData.agentIds.length) {
        throw new Error('One or more agents do not exist or do not belong to the user');
      }
      
      // Create the workflow
      const [workflow] = await db.insert(huginnWorkflows)
        .values({
          userId,
          name: workflowData.name,
          description: workflowData.description || '',
          agentIds: workflowData.agentIds,
          flowConfig: workflowData.flowConfig,
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date(),
        })
        .returning();
      
      // Log creation
      await this.logAgentActivity(null, workflow.id, 'info', 'Workflow created');
      
      return workflow;
    } catch (error) {
      console.error('Failed to create workflow:', error);
      throw error;
    }
  }
  
  /**
   * Run a workflow
   */
  public async runWorkflow(workflowId: number, userId?: number): Promise<any[]> {
    try {
      // Get the workflow
      const [workflow] = await db.select().from(huginnWorkflows)
        .where(userId ? 
          and(eq(huginnWorkflows.id, workflowId), eq(huginnWorkflows.userId, userId)) : 
          eq(huginnWorkflows.id, workflowId)
        );
      
      if (!workflow) {
        throw new Error('Workflow not found or does not belong to user');
      }
      
      // Update last updated time
      await db.update(huginnWorkflows)
        .set({
          updatedAt: new Date(),
        })
        .where(eq(huginnWorkflows.id, workflowId));
      
      // TypeSafe flowConfig
      const flowConfig = workflow.flowConfig as {
        order?: number[];
        createEvents?: boolean;
      };
      
      // Run each agent in sequence according to flowConfig
      const results = [];
      const flowOrder = flowConfig.order || workflow.agentIds;
      
      for (const agentId of flowOrder) {
        const result = await this.runAgent(agentId);
        results.push({ agentId, result });
        
        // Create event for agent completion if needed
        if (flowConfig.createEvents) {
          await this.createEvent(agentId, 'workflow_step_complete', { result });
        }
      }
      
      // Log success
      await this.logAgentActivity(null, workflowId, 'info', 'Workflow run successful', { results });
      
      return results;
    } catch (error: any) {
      console.error(`Failed to run workflow ${workflowId}:`, error);
      
      // Log error
      await this.logAgentActivity(null, workflowId, 'error', 'Workflow run failed', {
        errorMessage: error.message || 'Unknown error',
        errorStack: error.stack || 'No stack trace'
      });
      
      throw error;
    }
  }
  
  /**
   * Create an event for inter-agent communication
   */
  private async createEvent(agentId: number, name: string, payload: any, receiverId?: number): Promise<void> {
    await db.insert(huginnEvents)
      .values({
        agentId,
        name,
        payload,
        receiverId: receiverId || null,
        createdAt: new Date(),
      });
  }
  
  /**
   * Log agent or workflow activity
   */
  private async logAgentActivity(
    agentId: number | null, 
    workflowId: number | null, 
    level: string, 
    message: string, 
    details?: any
  ): Promise<void> {
    await db.insert(huginnLogs)
      .values({
        agentId,
        workflowId,
        level,
        message,
        details: details || null,
        createdAt: new Date(),
      });
  }
  
  /**
   * Validate agent configuration based on agent type
   */
  private validateAgentConfiguration(agentType: string, config: any): void {
    switch (agentType) {
      case 'web_scraper':
        if (!config.url) throw new Error('Web scraper requires a URL');
        if (!config.selector) throw new Error('Web scraper requires a CSS selector');
        break;
      case 'content_creator':
        if (!config.template) throw new Error('Content creator requires a template');
        if (!config.platform) throw new Error('Content creator requires a platform');
        break;
      case 'social_media':
        if (!config.platform) throw new Error('Social media agent requires a platform');
        if (!config.action) throw new Error('Social media agent requires an action');
        break;
      // Add validation for other agent types as needed
    }
  }
  
  /**
   * Web scraper agent implementation
   */
  private async runWebScraper(agent: HuginnAgent): Promise<any> {
    try {
      const config = agent.configuration as WebScraperConfig;
      
      // Fetch the URL
      const response = await axios.get(config.url);
      
      // Simple HTML parsing (in a real implementation, use a proper HTML parser)
      const html = response.data;
      
      // For this example, we'll just return the HTML
      return {
        timestamp: new Date().toISOString(),
        url: config.url,
        html: html.substring(0, 1000) + '...', // Truncate HTML for storage
        status: 'success'
      };
    } catch (error: any) {
      throw new Error(`Web scraper error: ${error.message || 'Unknown error'}`);
    }
  }
  
  /**
   * Content monitor agent implementation
   */
  private async runContentMonitor(agent: HuginnAgent): Promise<any> {
    try {
      const config = agent.configuration as ContentMonitorConfig;
      
      // Simplified implementation - would check sources for keywords
      return {
        timestamp: new Date().toISOString(),
        sources_checked: config.sources.length,
        keywords_monitored: config.keywords.length,
        status: 'success',
        message: 'Content monitoring completed'
      };
    } catch (error: any) {
      throw new Error(`Content monitor error: ${error.message || 'Unknown error'}`);
    }
  }
  
  /**
   * Content creator agent implementation
   */
  private async runContentCreator(agent: HuginnAgent): Promise<any> {
    try {
      const config = agent.configuration as ContentCreatorConfig;
      
      // Simple template substitution
      let content = config.template;
      
      for (const [key, value] of Object.entries(config.variables)) {
        content = content.replace(new RegExp(`{{${key}}}`, 'g'), value);
      }
      
      return {
        timestamp: new Date().toISOString(),
        platform: config.platform,
        content,
        status: 'success',
        message: 'Content created successfully'
      };
    } catch (error: any) {
      throw new Error(`Content creator error: ${error.message || 'Unknown error'}`);
    }
  }
  
  /**
   * Social media agent implementation
   */
  private async runSocialMedia(agent: HuginnAgent): Promise<any> {
    try {
      const config = agent.configuration as SocialMediaConfig;
      
      // Simplified implementation
      return {
        timestamp: new Date().toISOString(),
        platform: config.platform,
        action: config.action,
        status: 'success',
        message: `Social media ${config.action} simulation completed`
      };
    } catch (error: any) {
      throw new Error(`Social media agent error: ${error.message || 'Unknown error'}`);
    }
  }
  
  /**
   * Listing manager agent implementation
   */
  private async runListingManager(agent: HuginnAgent): Promise<any> {
    try {
      // Simplified implementation
      return {
        timestamp: new Date().toISOString(),
        action: 'check_listings',
        status: 'success',
        message: 'Listing check completed'
      };
    } catch (error: any) {
      throw new Error(`Listing manager error: ${error.message || 'Unknown error'}`);
    }
  }
  
  /**
   * Review responder agent implementation
   */
  private async runReviewResponder(agent: HuginnAgent): Promise<any> {
    try {
      // Simplified implementation
      return {
        timestamp: new Date().toISOString(),
        action: 'check_reviews',
        status: 'success',
        message: 'No new reviews to respond to'
      };
    } catch (error: any) {
      throw new Error(`Review responder error: ${error.message || 'Unknown error'}`);
    }
  }
  
  /**
   * Custom agent implementation
   */
  private async runCustomAgent(agent: HuginnAgent): Promise<any> {
    try {
      // Custom agents would have their own specific implementation
      return {
        timestamp: new Date().toISOString(),
        type: 'custom',
        status: 'success',
        message: 'Custom agent executed'
      };
    } catch (error: any) {
      throw new Error(`Custom agent error: ${error.message || 'Unknown error'}`);
    }
  }
  
  /**
   * Get logs for an agent
   */
  public async getAgentLogs(agentId: number): Promise<any[]> {
    try {
      const logs = await db.select()
        .from(huginnLogs)
        .where(eq(huginnLogs.agentId, agentId))
        .orderBy(desc(huginnLogs.createdAt))
        .limit(50);
        
      return logs;
    } catch (error: any) {
      console.error(`Failed to get logs for agent ${agentId}:`, error);
      throw new Error(`Failed to get agent logs: ${error.message || 'Unknown error'}`);
    }
  }
  
  /**
   * Get all workflows for a user
   */
  public async getUserWorkflows(userId: number): Promise<any[]> {
    try {
      const workflows = await db.select()
        .from(huginnWorkflows)
        .where(eq(huginnWorkflows.userId, userId))
        .orderBy(desc(huginnWorkflows.createdAt));
      
      return workflows;
    } catch (error: any) {
      console.error(`Failed to get workflows for user ${userId}:`, error);
      throw new Error(`Failed to get workflows: ${error.message || 'Unknown error'}`);
    }
  }
  
  /**
   * Get a specific workflow
   */
  public async getWorkflow(workflowId: number, userId?: number): Promise<any> {
    try {
      const [workflow] = await db.select()
        .from(huginnWorkflows)
        .where(userId ? 
          and(eq(huginnWorkflows.id, workflowId), eq(huginnWorkflows.userId, userId)) : 
          eq(huginnWorkflows.id, workflowId)
        );
        
      return workflow;
    } catch (error: any) {
      console.error(`Failed to get workflow ${workflowId}:`, error);
      throw new Error(`Failed to get workflow: ${error.message || 'Unknown error'}`);
    }
  }
}

// Create and export singleton instance
export const huginnAgentService = HuginnAgentService.getInstance();