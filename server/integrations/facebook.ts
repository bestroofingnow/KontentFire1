import axios from 'axios';
import { db } from '../db';
import { platformIntegrations, platformIntegrationEnum } from '@shared/schema';
import { eq, and } from 'drizzle-orm';

/**
 * Facebook Integration Service
 * 
 * This service handles Facebook OAuth authentication and content posting.
 * It supports connecting to Facebook pages for business users.
 */

// Facebook App configuration - would be in environment variables in production
let FACEBOOK_APP_ID: string;
let FACEBOOK_APP_SECRET: string;
let FACEBOOK_REDIRECT_URI: string;

// Try to get configuration from environment variables
try {
  FACEBOOK_APP_ID = process.env.FACEBOOK_APP_ID || '';
  FACEBOOK_APP_SECRET = process.env.FACEBOOK_APP_SECRET || '';
  FACEBOOK_REDIRECT_URI = process.env.FACEBOOK_REDIRECT_URI || 'https://kontent-fire.replit.app/api/integrations/facebook/callback';
  
  if (!FACEBOOK_APP_ID || !FACEBOOK_APP_SECRET) {
    console.warn('Facebook integration not fully configured. Set FACEBOOK_APP_ID and FACEBOOK_APP_SECRET environment variables.');
  }
} catch (error) {
  console.error('Error loading Facebook configuration:', error);
}

/**
 * Get the URL to redirect users to start the Facebook OAuth flow
 */
export function getFacebookAuthUrl(userId: number): string {
  const state = Buffer.from(JSON.stringify({ userId })).toString('base64');
  
  return `https://www.facebook.com/v18.0/dialog/oauth?client_id=${FACEBOOK_APP_ID}&redirect_uri=${encodeURIComponent(FACEBOOK_REDIRECT_URI)}&state=${state}&scope=pages_show_list,pages_read_engagement,pages_manage_posts,pages_manage_metadata`;
}

/**
 * Exchange an authorization code for an access token
 */
export async function exchangeCodeForToken(code: string): Promise<{
  access_token: string;
  token_type: string;
  expires_in: number;
}> {
  try {
    const response = await axios.get('https://graph.facebook.com/v18.0/oauth/access_token', {
      params: {
        client_id: FACEBOOK_APP_ID,
        client_secret: FACEBOOK_APP_SECRET,
        redirect_uri: FACEBOOK_REDIRECT_URI,
        code,
      },
    });

    return response.data;
  } catch (error) {
    console.error('Error exchanging code for token:', error);
    throw new Error('Failed to exchange authorization code for access token');
  }
}

/**
 * Get user information from Facebook
 */
export async function getFacebookUserInfo(accessToken: string): Promise<{
  id: string;
  name: string;
  email?: string;
  picture?: {
    data: {
      height: number;
      is_silhouette: boolean;
      url: string;
      width: number;
    };
  };
}> {
  try {
    const response = await axios.get('https://graph.facebook.com/v18.0/me', {
      params: {
        fields: 'id,name,email,picture',
        access_token: accessToken,
      },
    });

    return response.data;
  } catch (error) {
    console.error('Error getting Facebook user info:', error);
    throw new Error('Failed to get user information from Facebook');
  }
}

/**
 * Get list of pages the user has access to
 */
export async function getFacebookPages(accessToken: string): Promise<Array<{
  id: string;
  name: string;
  access_token: string;
  category: string;
  picture?: {
    data: {
      url: string;
    };
  };
}>> {
  try {
    const response = await axios.get('https://graph.facebook.com/v18.0/me/accounts', {
      params: {
        fields: 'id,name,access_token,category,picture',
        access_token: accessToken,
      },
    });

    return response.data.data || [];
  } catch (error) {
    console.error('Error getting Facebook pages:', error);
    throw new Error('Failed to get pages from Facebook');
  }
}

/**
 * Store a Facebook integration for a user
 */
export async function storeFacebookIntegration(
  userId: number,
  accessToken: string,
  tokenExpiry: Date,
  accountId: string,
  accountName: string,
  accountType: 'page' | 'group' | 'profile',
  profileImageUrl?: string,
  metadata?: Record<string, any>,
) {
  try {
    // Check if there's an existing integration
    const existingIntegration = await db.select()
      .from(platformIntegrations)
      .where(
        and(
          eq(platformIntegrations.userId, userId),
          eq(platformIntegrations.platform, 'facebook'),
          eq(platformIntegrations.accountId, accountId)
        )
      )
      .limit(1);

    if (existingIntegration.length > 0) {
      // Update existing integration
      await db.update(platformIntegrations)
        .set({
          accessToken,
          tokenExpiry,
          accountName,
          accountType,
          profileImageUrl,
          metadata: metadata || existingIntegration[0].metadata,
          updatedAt: new Date(),
          isActive: true,
        })
        .where(eq(platformIntegrations.id, existingIntegration[0].id));
        
      return existingIntegration[0].id;
    } else {
      // Create new integration
      const [integration] = await db.insert(platformIntegrations)
        .values({
          userId,
          platform: 'facebook',
          accessToken,
          tokenExpiry,
          accountId,
          accountName,
          accountType,
          profileImageUrl,
          metadata,
          isActive: true,
        })
        .returning();
        
      return integration.id;
    }
  } catch (error) {
    console.error('Error storing Facebook integration:', error);
    throw new Error('Failed to store Facebook integration');
  }
}

/**
 * Post a message to a Facebook page
 */
export async function postToFacebookPage(
  userId: number,
  pageId: string,
  message: string,
  link?: string,
  imageUrl?: string,
): Promise<{
  id: string;
  post_url?: string;
}> {
  try {
    // Get the integration information
    const [integration] = await db.select()
      .from(platformIntegrations)
      .where(
        and(
          eq(platformIntegrations.userId, userId),
          eq(platformIntegrations.platform, 'facebook'),
          eq(platformIntegrations.accountId, pageId),
          eq(platformIntegrations.isActive, true)
        )
      )
      .limit(1);

    if (!integration) {
      throw new Error('Facebook page integration not found');
    }

    const accessToken = integration.accessToken;
    
    // Create post parameters
    const postParams: Record<string, any> = { message };
    
    if (link) {
      postParams.link = link;
    }
    
    if (imageUrl) {
      // If an image URL is provided, we need to upload it first
      // For simplicity in this example, we'll just include the URL
      postParams.link = imageUrl;
    }
    
    // Post to the page
    const response = await axios.post(
      `https://graph.facebook.com/v18.0/${pageId}/feed`,
      postParams,
      {
        params: { access_token: accessToken }
      }
    );

    // Update last used timestamp
    await db.update(platformIntegrations)
      .set({ lastUsed: new Date() })
      .where(eq(platformIntegrations.id, integration.id));

    return {
      id: response.data.id,
      // Construct a link to the post
      post_url: `https://facebook.com/${response.data.id}`
    };
  } catch (error) {
    console.error('Error posting to Facebook:', error);
    throw new Error('Failed to post to Facebook page');
  }
}

/**
 * Get Facebook integrations for a user
 */
export async function getUserFacebookIntegrations(userId: number) {
  try {
    const integrations = await db.select()
      .from(platformIntegrations)
      .where(
        and(
          eq(platformIntegrations.userId, userId),
          eq(platformIntegrations.platform, 'facebook'),
          eq(platformIntegrations.isActive, true)
        )
      );
      
    return integrations;
  } catch (error) {
    console.error('Error getting user Facebook integrations:', error);
    throw new Error('Failed to get Facebook integrations');
  }
}

/**
 * Disconnect a Facebook integration
 */
export async function disconnectFacebookIntegration(userId: number, integrationId: number) {
  try {
    await db.update(platformIntegrations)
      .set({ 
        isActive: false,
        updatedAt: new Date()
      })
      .where(
        and(
          eq(platformIntegrations.id, integrationId),
          eq(platformIntegrations.userId, userId),
          eq(platformIntegrations.platform, 'facebook')
        )
      );
      
    return true;
  } catch (error) {
    console.error('Error disconnecting Facebook integration:', error);
    throw new Error('Failed to disconnect Facebook integration');
  }
}

// Helper to check if Facebook integration is configured
export function isFacebookConfigured(): boolean {
  return !!(FACEBOOK_APP_ID && FACEBOOK_APP_SECRET);
}