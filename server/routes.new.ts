import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { eq, desc, count, and, sql, isNull } from "drizzle-orm";
import { db } from "./db";
import { users, contents, schedules, companies, contentPipelines } from "@shared/schema";
import Stripe from "stripe";
import { storage } from "./storage";

// Environment constants for subscription plans
const EMBER_PLAN_PRICE_ID = process.env.EMBER_PLAN_PRICE_ID || "price_ember_placeholder";
const INFERNO_PLAN_PRICE_ID = process.env.INFERNO_PLAN_PRICE_ID || "price_inferno_placeholder";

// Initialize Stripe
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "", {
  apiVersion: "2023-10-16",
});

export async function registerRoutes(app: Express): Promise<Server> {
  
  // Get user information
  app.get("/api/user", (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Not authenticated" });
    }
    res.json(req.user);
  });

  // Handle user login
  app.post("/api/login", (req, res) => {
    if (req.isAuthenticated()) {
      res.json(req.user);
    } else {
      res.status(401).json({ message: "Invalid credentials" });
    }
  });

  // Handle user logout
  app.post("/api/logout", (req, res, next) => {
    req.logout((err) => {
      if (err) {
        return next(err);
      }
      res.sendStatus(200);
    });
  });

  // Get subscription information
  app.get("/api/subscription", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Not authenticated" });
    }

    const user = req.user;

    if (!user.stripeCustomerId || !user.stripeSubscriptionId) {
      return res.json({
        status: "no-subscription",
        plan: user.plan || "ember",
      });
    }

    try {
      const subscription = await stripe.subscriptions.retrieve(user.stripeSubscriptionId);

      if (subscription.status === "active") {
        return res.json({
          status: "active",
          plan: user.plan,
          currentPeriodEnd: new Date(subscription.current_period_end * 1000).toISOString(),
        });
      } else if (subscription.status === "canceled" || subscription.status === "unpaid") {
        return res.json({
          status: "inactive",
          plan: user.plan,
          currentPeriodEnd: new Date(subscription.current_period_end * 1000).toISOString(),
        });
      } else {
        return res.json({
          status: subscription.status,
          plan: user.plan,
        });
      }
    } catch (error) {
      console.error("Error retrieving subscription:", error);
      return res.status(500).json({ message: "Error retrieving subscription information" });
    }
  });

  // Create Ember plan subscription
  app.post("/api/subscribe/ember", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Not authenticated" });
    }

    try {
      const user = req.user;

      // Create or retrieve Stripe customer
      let customerId = user.stripeCustomerId;
      if (!customerId) {
        const customer = await stripe.customers.create({
          email: user.email,
          name: user.username,
        });
        customerId = customer.id;
        await storage.updateUserField(user.id, "stripeCustomerId", customerId);
      }

      // Create subscription
      const subscription = await stripe.subscriptions.create({
        customer: customerId,
        items: [{ price: EMBER_PLAN_PRICE_ID }],
        payment_behavior: "default_incomplete",
        expand: ["latest_invoice.payment_intent"],
      });

      // Update user with subscription info
      await storage.updateUserField(user.id, "stripeSubscriptionId", subscription.id);
      await storage.updateUserField(user.id, "plan", "ember");

      // Return client secret for frontend to complete payment
      res.json({
        subscriptionId: subscription.id,
        clientSecret: subscription.latest_invoice.payment_intent.client_secret,
      });
    } catch (error) {
      console.error("Subscription creation error:", error);
      res.status(500).json({ message: "Error creating subscription" });
    }
  });

  // Create Inferno plan subscription
  app.post("/api/subscribe/inferno", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Not authenticated" });
    }

    try {
      const user = req.user;

      // Create or retrieve Stripe customer
      let customerId = user.stripeCustomerId;
      if (!customerId) {
        const customer = await stripe.customers.create({
          email: user.email,
          name: user.username,
        });
        customerId = customer.id;
        await storage.updateUserField(user.id, "stripeCustomerId", customerId);
      }

      // Create subscription
      const subscription = await stripe.subscriptions.create({
        customer: customerId,
        items: [{ price: INFERNO_PLAN_PRICE_ID }],
        payment_behavior: "default_incomplete",
        expand: ["latest_invoice.payment_intent"],
      });

      // Update user with subscription info
      await storage.updateUserField(user.id, "stripeSubscriptionId", subscription.id);
      await storage.updateUserField(user.id, "plan", "inferno");

      // Return client secret for frontend to complete payment
      res.json({
        subscriptionId: subscription.id,
        clientSecret: subscription.latest_invoice.payment_intent.client_secret,
      });
    } catch (error) {
      console.error("Subscription creation error:", error);
      res.status(500).json({ message: "Error creating subscription" });
    }
  });

  // Create automation
  app.post("/api/automations", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Not authenticated" });
    }

    try {
      const user = req.user;
      const { 
        templates, 
        contentTypes, 
        authors, 
        platform, 
        duration, 
        postingTime 
      } = req.body;

      // Validate user plan for automation
      if (!user.plan) {
        return res.status(403).json({ 
          message: "No subscription plan found. Please subscribe to create automations." 
        });
      }

      // Create pipeline for automation
      const [pipeline] = await db.insert(contentPipelines).values({
        name: `Automated posting to ${platform}`,
        userId: user.id,
        description: `Daily content creation and posting to ${platform}`,
        isActive: true,
        isAutomated: true,
        triggerSchedule: "0 0 * * *", // Daily at midnight
        stages: {
          templates,
          contentTypes,
          authors,
          platform,
          duration,
          postingTime,
          startDate: new Date().toISOString(),
        },
        metadata: {
          automationType: "social",
          platform,
          frequency: "daily"
        }
      }).returning();

      res.status(201).json({ 
        message: "Automation created successfully", 
        automation: pipeline 
      });
    } catch (error) {
      console.error("Error creating automation:", error);
      res.status(500).json({ message: "Failed to create automation" });
    }
  });

  // Get all automations for the current user
  app.get("/api/automations", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Not authenticated" });
    }

    try {
      const user = req.user;
      
      const automations = await db.select()
        .from(contentPipelines)
        .where(and(
          eq(contentPipelines.userId, user.id),
          eq(contentPipelines.isAutomated, true)
        ));
      
      res.json(automations);
    } catch (error) {
      console.error("Error retrieving automations:", error);
      res.status(500).json({ message: "Failed to retrieve automations" });
    }
  });

  // Get a specific automation
  app.get("/api/automations/:id", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Not authenticated" });
    }

    try {
      const user = req.user;
      const automationId = parseInt(req.params.id);
      
      const [automation] = await db.select()
        .from(contentPipelines)
        .where(and(
          eq(contentPipelines.id, automationId),
          eq(contentPipelines.userId, user.id),
          eq(contentPipelines.isAutomated, true)
        ));
      
      if (!automation) {
        return res.status(404).json({ message: "Automation not found" });
      }
      
      res.json(automation);
    } catch (error) {
      console.error("Error retrieving automation:", error);
      res.status(500).json({ message: "Failed to retrieve automation" });
    }
  });
  
  // Update an automation
  app.put("/api/automations/:id", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Not authenticated" });
    }

    try {
      const user = req.user;
      const automationId = parseInt(req.params.id);
      const { 
        templates, 
        contentTypes, 
        authors, 
        platform, 
        duration, 
        postingTime,
        isActive
      } = req.body;
      
      // Verify automation exists and belongs to user
      const [existing] = await db.select()
        .from(contentPipelines)
        .where(and(
          eq(contentPipelines.id, automationId),
          eq(contentPipelines.userId, user.id),
          eq(contentPipelines.isAutomated, true)
        ));
      
      if (!existing) {
        return res.status(404).json({ message: "Automation not found" });
      }
      
      // Update automation
      const [updated] = await db.update(contentPipelines)
        .set({
          isActive: isActive !== undefined ? isActive : existing.isActive,
          stages: {
            ...existing.stages,
            ...(templates && { templates }),
            ...(contentTypes && { contentTypes }),
            ...(authors && { authors }),
            ...(platform && { platform }),
            ...(duration && { duration }),
            ...(postingTime && { postingTime }),
          },
          updatedAt: new Date()
        })
        .where(eq(contentPipelines.id, automationId))
        .returning();
      
      res.json(updated);
    } catch (error) {
      console.error("Error updating automation:", error);
      res.status(500).json({ message: "Failed to update automation" });
    }
  });
  
  // Delete an automation
  app.delete("/api/automations/:id", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Not authenticated" });
    }

    try {
      const user = req.user;
      const automationId = parseInt(req.params.id);
      
      // Verify automation exists and belongs to user
      const [existing] = await db.select()
        .from(contentPipelines)
        .where(and(
          eq(contentPipelines.id, automationId),
          eq(contentPipelines.userId, user.id),
          eq(contentPipelines.isAutomated, true)
        ));
      
      if (!existing) {
        return res.status(404).json({ message: "Automation not found" });
      }
      
      // Deactivate automation instead of deleting
      await db.update(contentPipelines)
        .set({
          isActive: false,
          updatedAt: new Date()
        })
        .where(eq(contentPipelines.id, automationId));
      
      res.status(200).json({ message: "Automation deactivated successfully" });
    } catch (error) {
      console.error("Error deactivating automation:", error);
      res.status(500).json({ message: "Failed to deactivate automation" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}