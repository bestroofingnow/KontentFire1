import { Request, Response } from 'express';
import Stripe from 'stripe';
import { storage } from './storage';

// Initialize Stripe with the secret key (with fallback for development)
let stripe: Stripe | undefined;
try {
  if (process.env.STRIPE_SECRET_KEY) {
    stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
      apiVersion: "2023-10-16",
    });
  } else {
    console.warn("STRIPE_SECRET_KEY not found, webhook functionality will be limited");
    // Create minimal mock for development
    stripe = {
      webhooks: {
        constructEvent: () => ({ 
          type: 'unknown', 
          id: 'mock-event-id',
          object: 'event',
          api_version: '2023-10-16',
          created: Date.now(),
          data: { object: {} },
          livemode: false,
          pending_webhooks: 0,
          request: { id: null, idempotency_key: null }
        } as unknown as Stripe.Event)
      }
    } as unknown as Stripe;
  }
} catch (error) {
  console.error("Error initializing Stripe:", error);
}

// Verify Stripe webhook signatures
export async function handleWebhook(req: Request, res: Response) {
  const sig = req.headers['stripe-signature'] as string;
  
  if (!process.env.STRIPE_WEBHOOK_SECRET) {
    return res.status(500).json({ message: 'Webhook secret not configured' });
  }
  
  let event: Stripe.Event;
  
  try {
    // Verify Stripe is initialized and signature
    if (!stripe || !stripe.webhooks) {
      throw new Error('Stripe not initialized');
    }
    
    event = stripe.webhooks.constructEvent(
      req.body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (err: any) {
    console.error(`Webhook Error: ${err.message}`);
    return res.status(400).json({ message: `Webhook Error: ${err.message}` });
  }
  
  // Handle different event types
  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        if (session.customer && session.subscription && session.client_reference_id) {
          // Extract and convert client_reference_id to a number
          const userId = parseInt(session.client_reference_id);
          if (isNaN(userId)) {
            throw new Error('Invalid user ID in client_reference_id');
          }
          
          // Update user with Stripe customer and subscription IDs
          await storage.updateStripeInfo(
            userId,
            session.customer.toString(),
            session.subscription.toString()
          );
        }
        break;
      }
        
      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription;
        // Handle subscription updates like plan changes
        console.log('Subscription updated', subscription.id);
        break;
      }
        
      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription;
        // Handle subscription cancellations
        console.log('Subscription cancelled', subscription.id);
        // Find user with this subscription and update their plan
        // This would require a method to find user by stripe subscription ID
        break;
      }
    }
    
    // Return success
    res.status(200).json({ received: true });
  } catch (err: any) {
    console.error(`Error handling webhook: ${err.message}`);
    res.status(500).json({ message: `Error handling webhook: ${err.message}` });
  }
}

export default {
  handleWebhook
};
