import axios from 'axios';
import { db } from '../db';
import { platformIntegrations } from '@shared/schema';
import { eq, and } from 'drizzle-orm';

interface FacebookAuthResponse {
  accessToken: string;
  userID: string;
  name?: string;
  email?: string;
}

interface FacebookPostParams {
  text: string;
  imageUrl?: string;
  pageId: string;
  pageAccessToken: string;
}

/**
 * Connect a user's Facebook account by storing the access token
 */
export async function connectFacebookAccount(userId: number, authResponse: FacebookAuthResponse) {
  try {
    // Check if user already has a Facebook integration
    const existingIntegration = await db.select()
      .from(platformIntegrations)
      .where(
        and(
          eq(platformIntegrations.userId, userId),
          eq(platformIntegrations.platform, 'facebook')
        )
      );

    // Get user profile information
    const userInfoResponse = await axios.get(`https://graph.facebook.com/v18.0/${authResponse.userID}`, {
      params: {
        fields: 'name,picture',
        access_token: authResponse.accessToken
      }
    });

    const userData = userInfoResponse.data;
    const profileImageUrl = userData.picture?.data?.url;
    
    const integrationData = {
      userId,
      platform: 'facebook' as const, // Ensure this is typed as a valid platform enum value
      accessToken: authResponse.accessToken,
      accountId: authResponse.userID,
      accountName: authResponse.name || userData.name,
      profileImageUrl,
      isActive: true,
      metadata: {
        email: authResponse.email,
        scope: 'pages_show_list,pages_read_engagement,pages_manage_posts'
      }
    };

    if (existingIntegration.length > 0) {
      // Update existing integration
      await db.update(platformIntegrations)
        .set({ 
          accessToken: integrationData.accessToken,
          accountName: integrationData.accountName,
          profileImageUrl: integrationData.profileImageUrl,
          isActive: true,
          updatedAt: new Date(),
          metadata: integrationData.metadata
        })
        .where(
          and(
            eq(platformIntegrations.userId, userId),
            eq(platformIntegrations.platform, 'facebook')
          )
        );

      return {
        id: existingIntegration[0].id,
        platform: 'facebook',
        platformUsername: integrationData.accountName,
        platformImageUrl: integrationData.profileImageUrl,
        isConnected: true
      };
    } else {
      // Create new integration
      const [newIntegration] = await db.insert(platformIntegrations)
        .values([integrationData])
        .returning();

      return {
        id: newIntegration.id,
        platform: 'facebook',
        platformUsername: integrationData.accountName,
        platformImageUrl: integrationData.profileImageUrl,
        isConnected: true
      };
    }
  } catch (error) {
    console.error('Failed to connect Facebook account:', error);
    throw new Error('Failed to connect Facebook account: ' + (error instanceof Error ? error.message : 'Unknown error'));
  }
}

/**
 * Post content to a Facebook page
 */
export async function postToFacebook(params: FacebookPostParams) {
  try {
    const { text, imageUrl, pageId, pageAccessToken } = params;

    // Create the post data
    const postData: Record<string, any> = {
      message: text
    };

    // If image URL is provided, include it as a link
    if (imageUrl) {
      // Check if this is a content posting (with image) or just a text post
      if (imageUrl.startsWith('http') || imageUrl.startsWith('https')) {
        // If imageUrl is a valid URL, post as a link
        const response = await axios.post(
          `https://graph.facebook.com/v18.0/${pageId}/photos`,
          {
            url: imageUrl,
            caption: text,
            access_token: pageAccessToken
          }
        );
        
        return response.data;
      }
    }

    // Otherwise, post as a regular text post
    const response = await axios.post(
      `https://graph.facebook.com/v18.0/${pageId}/feed`, 
      {
        ...postData,
        access_token: pageAccessToken
      }
    );

    return response.data;
  } catch (error) {
    console.error('Failed to post to Facebook:', error);
    
    if (axios.isAxiosError(error) && error.response) {
      throw new Error(`Failed to post to Facebook: ${error.response.data?.error?.message || error.message}`);
    }
    
    throw new Error('Failed to post to Facebook: ' + (error instanceof Error ? error.message : 'Unknown error'));
  }
}

/**
 * Get Facebook pages for a user based on the stored access token
 */
export async function getFacebookPages(userId: number) {
  try {
    // Get user's Facebook integration
    const [integration] = await db.select()
      .from(platformIntegrations)
      .where(
        and(
          eq(platformIntegrations.userId, userId),
          eq(platformIntegrations.platform, 'facebook')
        )
      );

    if (!integration || !integration.accessToken) {
      throw new Error('Facebook account not connected');
    }

    // Get pages
    const response = await axios.get(
      `https://graph.facebook.com/v18.0/me/accounts`,
      {
        params: {
          access_token: integration.accessToken
        }
      }
    );

    return response.data.data.map((page: any) => ({
      id: page.id,
      name: page.name,
      category: page.category,
      accessToken: page.access_token
    }));
  } catch (error) {
    console.error('Failed to get Facebook pages:', error);
    
    if (axios.isAxiosError(error) && error.response) {
      throw new Error(`Failed to get Facebook pages: ${error.response.data?.error?.message || error.message}`);
    }
    
    throw new Error('Failed to get Facebook pages: ' + (error instanceof Error ? error.message : 'Unknown error'));
  }
}

/**
 * Disconnect a user's Facebook account
 */
export async function disconnectFacebookIntegration(userId: number) {
  try {
    await db.update(platformIntegrations)
      .set({ 
        isActive: false,
        updatedAt: new Date()
      })
      .where(
        and(
          eq(platformIntegrations.userId, userId),
          eq(platformIntegrations.platform, 'facebook')
        )
      );

    return { success: true };
  } catch (error) {
    console.error('Failed to disconnect Facebook account:', error);
    throw new Error('Failed to disconnect Facebook account: ' + (error instanceof Error ? error.message : 'Unknown error'));
  }
}