import express, { Request, Response } from 'express';
import Stripe from 'stripe';
import { db } from '../db';
import { users } from '@shared/schema';
import { eq } from 'drizzle-orm';
import { storage } from '../storage';

const router = express.Router();

// Initialize Stripe with the secret key
let stripe: Stripe | null = null;
if (process.env.STRIPE_SECRET_KEY) {
  stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
    apiVersion: '2023-10-16',
  });
} else {
  console.warn('STRIPE_SECRET_KEY is not set. Stripe integration is disabled.');
}

// Price IDs for different subscription plans
// These will need to be replaced with actual Stripe product/price IDs
const PRICE_IDS = {
  ember: process.env.STRIPE_EMBER_PRICE_ID || 'price_ember',
  inferno: process.env.STRIPE_INFERNO_PRICE_ID || 'price_inferno',
};

// Create a new subscription payment intent
router.post('/create-subscription', async (req: Request, res: Response) => {
  if (!stripe) {
    return res.status(503).json({ 
      message: 'Stripe integration is not configured. Please contact support.' 
    });
  }

  if (!req.isAuthenticated()) {
    return res.status(401).json({ message: 'Not authenticated' });
  }

  try {
    const { plan = 'ember' } = req.body;
    const user = req.user;
    
    // Determine price ID based on selected plan
    const priceId = plan === 'inferno' ? PRICE_IDS.inferno : PRICE_IDS.ember;
    
    // Check if the user already has a Stripe customer ID
    if (!user.stripeCustomerId) {
      // Create a new Stripe customer
      const customer = await stripe.customers.create({
        email: user.email,
        name: `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.username,
        metadata: {
          userId: user.id.toString(),
        },
      });
      
      // Update the user with the Stripe customer ID
      await db.update(users)
        .set({ stripeCustomerId: customer.id })
        .where(eq(users.id, user.id));
        
      user.stripeCustomerId = customer.id;
    }
    
    // Check if the user already has an active subscription
    if (user.stripeSubscriptionId) {
      try {
        const existingSubscription = await stripe.subscriptions.retrieve(user.stripeSubscriptionId);
        
        if (existingSubscription.status === 'active') {
          return res.status(400).json({ 
            message: 'You already have an active subscription'
          });
        }
      } catch (error) {
        // If the subscription doesn't exist or there's an error, continue to create a new one
        console.log('Error checking existing subscription:', error);
      }
    }
    
    // Create a payment intent for the subscription
    const paymentIntent = await stripe.paymentIntents.create({
      amount: plan === 'inferno' ? 99900 : 9900, // $999 or $99 in cents
      currency: 'usd',
      customer: user.stripeCustomerId,
      metadata: {
        userId: user.id.toString(),
        plan: plan,
      },
    });
    
    // Return the client secret for the frontend to use with Stripe Elements
    return res.status(200).json({
      clientSecret: paymentIntent.client_secret,
      customerId: user.stripeCustomerId,
    });
  } catch (error) {
    console.error('Error creating subscription:', error);
    return res.status(500).json({ 
      message: 'Failed to create subscription: ' + (error instanceof Error ? error.message : 'Unknown error') 
    });
  }
});

// Verify and finalize a subscription after payment
router.post('/verify-subscription', async (req: Request, res: Response) => {
  if (!stripe) {
    return res.status(503).json({ 
      message: 'Stripe integration is not configured. Please contact support.' 
    });
  }

  if (!req.isAuthenticated()) {
    return res.status(401).json({ message: 'Not authenticated' });
  }

  try {
    const { paymentIntentId } = req.body;
    const user = req.user;
    
    if (!paymentIntentId) {
      return res.status(400).json({ message: 'Missing payment intent ID' });
    }
    
    // Retrieve the payment intent to verify it succeeded
    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
    
    if (paymentIntent.status !== 'succeeded') {
      return res.status(400).json({ 
        message: `Payment is not complete (status: ${paymentIntent.status})` 
      });
    }
    
    // Create a subscription for the customer
    const plan = paymentIntent.metadata.plan || 'ember';
    const priceId = plan === 'inferno' ? PRICE_IDS.inferno : PRICE_IDS.ember;
    
    const subscription = await stripe.subscriptions.create({
      customer: user.stripeCustomerId!,
      items: [{ price: priceId }],
      metadata: {
        userId: user.id.toString(),
      },
    });
    
    // Calculate next billing date (30 days from now)
    const nextBillingDate = new Date();
    nextBillingDate.setDate(nextBillingDate.getDate() + 30);
    
    // Update the user with subscription information
    await db.update(users)
      .set({ 
        stripeSubscriptionId: subscription.id,
        plan: plan as any, // Type assertion to match enum
        planStatus: 'active',
        subscriptionPriceId: priceId,
        lastBillingDate: new Date(),
        nextBillingDate: nextBillingDate
      })
      .where(eq(users.id, user.id));
    
    // Return subscription details to the client
    return res.status(200).json({
      subscriptionId: subscription.id,
      plan: plan,
      status: 'active',
      nextBillingDate: nextBillingDate.toISOString()
    });
  } catch (error) {
    console.error('Error verifying subscription:', error);
    return res.status(500).json({ 
      message: 'Failed to verify subscription: ' + (error instanceof Error ? error.message : 'Unknown error')
    });
  }
});

// Cancel a subscription
router.post('/cancel-subscription', async (req: Request, res: Response) => {
  if (!stripe) {
    return res.status(503).json({ 
      message: 'Stripe integration is not configured. Please contact support.' 
    });
  }

  if (!req.isAuthenticated()) {
    return res.status(401).json({ message: 'Not authenticated' });
  }

  try {
    const user = req.user;
    
    if (!user.stripeSubscriptionId) {
      return res.status(400).json({ message: 'No active subscription found' });
    }
    
    // Cancel the subscription at period end
    const canceledSubscription = await stripe.subscriptions.update(
      user.stripeSubscriptionId,
      { cancel_at_period_end: true }
    );
    
    // Update the user's plan status
    await db.update(users)
      .set({ planStatus: 'canceling' })
      .where(eq(users.id, user.id));
    
    return res.status(200).json({
      message: 'Subscription will be canceled at the end of the billing period',
      cancelAtPeriodEnd: canceledSubscription.cancel_at_period_end,
      currentPeriodEnd: new Date(canceledSubscription.current_period_end * 1000).toISOString()
    });
  } catch (error) {
    console.error('Error canceling subscription:', error);
    return res.status(500).json({ 
      message: 'Failed to cancel subscription: ' + (error instanceof Error ? error.message : 'Unknown error')
    });
  }
});

// Get subscription details
router.get('/subscription', async (req: Request, res: Response) => {
  if (!stripe) {
    return res.status(503).json({ 
      message: 'Stripe integration is not configured. Please contact support.' 
    });
  }

  if (!req.isAuthenticated()) {
    return res.status(401).json({ message: 'Not authenticated' });
  }

  try {
    const user = req.user;
    
    if (!user.stripeSubscriptionId) {
      return res.status(200).json({ 
        hasActiveSubscription: false,
        plan: user.plan,
        status: user.planStatus
      });
    }
    
    // Retrieve subscription details from Stripe
    const subscription = await stripe.subscriptions.retrieve(user.stripeSubscriptionId);
    
    // Format response
    return res.status(200).json({
      hasActiveSubscription: subscription.status === 'active',
      subscriptionId: subscription.id,
      plan: user.plan,
      status: subscription.status,
      currentPeriodEnd: new Date(subscription.current_period_end * 1000).toISOString(),
      cancelAtPeriodEnd: subscription.cancel_at_period_end
    });
  } catch (error) {
    console.error('Error retrieving subscription:', error);
    return res.status(500).json({ 
      message: 'Failed to retrieve subscription: ' + (error instanceof Error ? error.message : 'Unknown error')
    });
  }
});

export { router as stripeRouter };

// Stripe webhook handler function
export async function handleStripeWebhook(event: Stripe.Event) {
  if (!stripe) {
    console.warn('Stripe integration is not configured. Cannot process webhook.');
    return;
  }
  
  try {
    switch (event.type) {
      case 'invoice.payment_succeeded':
        const invoice = event.data.object as Stripe.Invoice;
        if (invoice.subscription) {
          // Update user subscription details on successful payment
          const subscription = await stripe.subscriptions.retrieve(invoice.subscription as string);
          const customerId = subscription.customer as string;
          
          // Find user by Stripe customer ID
          const [user] = await db
            .select()
            .from(users)
            .where(eq(users.stripeCustomerId, customerId));
          
          if (user) {
            // Calculate next billing date
            const nextBillingDate = new Date(subscription.current_period_end * 1000);
            
            // Update user subscription info
            await db.update(users)
              .set({ 
                planStatus: 'active',
                lastBillingDate: new Date(),
                nextBillingDate: nextBillingDate
              })
              .where(eq(users.id, user.id));
          }
        }
        break;
        
      case 'invoice.payment_failed':
        const failedInvoice = event.data.object as Stripe.Invoice;
        if (failedInvoice.subscription) {
          // Update user status when payment fails
          const subscription = await stripe.subscriptions.retrieve(failedInvoice.subscription as string);
          const customerId = subscription.customer as string;
          
          // Find user by Stripe customer ID
          const [user] = await db
            .select()
            .from(users)
            .where(eq(users.stripeCustomerId, customerId));
          
          if (user) {
            // Mark plan as having a payment issue
            await db.update(users)
              .set({ planStatus: 'payment_failed' })
              .where(eq(users.id, user.id));
          }
        }
        break;
        
      case 'customer.subscription.deleted':
        const deletedSubscription = event.data.object as Stripe.Subscription;
        const customerId = deletedSubscription.customer as string;
        
        // Find user by Stripe customer ID
        const [user] = await db
          .select()
          .from(users)
          .where(eq(users.stripeCustomerId, customerId));
        
        if (user) {
          // Downgrade user to free plan
          await db.update(users)
            .set({ 
              plan: 'blaze' as any, // Type assertion to match enum
              planStatus: 'canceled',
              stripeSubscriptionId: null
            })
            .where(eq(users.id, user.id));
        }
        break;
    }
  } catch (error) {
    console.error('Error processing Stripe webhook:', error);
  }
}