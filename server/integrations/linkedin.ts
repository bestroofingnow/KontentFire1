/**
 * LinkedIn Integration Service
 * 
 * Handles OAuth authentication and posting to LinkedIn
 */
import axios from 'axios';
import { platformIntegrations } from '@shared/schema';
import { db } from '../db';
import { eq } from 'drizzle-orm';

// LinkedIn API endpoints
const LINKEDIN_API_URL = 'https://api.linkedin.com/v2';
const LINKEDIN_AUTH_URL = 'https://www.linkedin.com/oauth/v2/authorization';
const LINKEDIN_TOKEN_URL = 'https://www.linkedin.com/oauth/v2/accessToken';

// Check if required environment variables are set
if (!process.env.LINKEDIN_CLIENT_ID || !process.env.LINKEDIN_CLIENT_SECRET) {
  console.warn('LinkedIn client ID or secret not set. LinkedIn integration will be limited.');
}

interface LinkedInTokenResponse {
  access_token: string;
  expires_in: number;
  refresh_token?: string;
  scope: string;
}

interface LinkedInUserProfile {
  id: string;
  localizedFirstName: string;
  localizedLastName: string;
  profilePicture?: {
    displayImage: string;
  };
}

interface LinkedInShareContent {
  text?: string;
  imageUrl?: string;
  link?: string;
  title?: string;
  description?: string;
}

/**
 * Get LinkedIn authorization URL
 * 
 * @param redirectUri The URI to redirect to after authorization
 * @returns The authorization URL
 */
export function getLinkedInAuthUrl(redirectUri: string): string {
  if (!process.env.LINKEDIN_CLIENT_ID) {
    throw new Error('LinkedIn client ID not set');
  }

  const scopes = [
    'r_liteprofile',
    'r_emailaddress',
    'w_member_social'
  ].join(' ');

  return `${LINKEDIN_AUTH_URL}?response_type=code&client_id=${
    process.env.LINKEDIN_CLIENT_ID
  }&redirect_uri=${encodeURIComponent(
    redirectUri
  )}&scope=${encodeURIComponent(scopes)}&state=linkedInAuth`;
}

/**
 * Exchange authorization code for access token
 * 
 * @param code The authorization code
 * @param redirectUri The redirect URI used during authorization
 * @returns The token response
 */
export async function getAccessTokenFromCode(code: string, redirectUri: string): Promise<LinkedInTokenResponse> {
  if (!process.env.LINKEDIN_CLIENT_ID || !process.env.LINKEDIN_CLIENT_SECRET) {
    throw new Error('LinkedIn client ID or secret not set');
  }

  const params = new URLSearchParams();
  params.append('grant_type', 'authorization_code');
  params.append('code', code);
  params.append('redirect_uri', redirectUri);
  params.append('client_id', process.env.LINKEDIN_CLIENT_ID);
  params.append('client_secret', process.env.LINKEDIN_CLIENT_SECRET);

  const response = await axios.post(LINKEDIN_TOKEN_URL, params, {
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded'
    }
  });

  return response.data;
}

/**
 * Get user profile information from LinkedIn
 * 
 * @param accessToken LinkedIn access token
 * @returns The user profile
 */
export async function getLinkedInProfile(accessToken: string): Promise<LinkedInUserProfile> {
  const response = await axios.get(`${LINKEDIN_API_URL}/me?projection=(id,localizedFirstName,localizedLastName,profilePicture(displayImage~:playableStreams))`, {
    headers: {
      Authorization: `Bearer ${accessToken}`
    }
  });

  return response.data;
}

/**
 * Save LinkedIn integration for a user
 * 
 * @param userId The user ID
 * @param accessToken The LinkedIn access token
 * @param profile The LinkedIn user profile
 * @returns The created or updated integration
 */
export async function saveLinkedInIntegration(
  userId: number, 
  accessToken: string, 
  tokenExpiresIn: number,
  profile: LinkedInUserProfile
): Promise<any> {
  // Check if integration already exists
  const [existingIntegration] = await db
    .select()
    .from(platformIntegrations)
    .where(
      eq(platformIntegrations.userId, userId) && 
      eq(platformIntegrations.platform, 'linkedin')
    );

  const fullName = `${profile.localizedFirstName} ${profile.localizedLastName}`;
  const tokenExpiry = new Date(Date.now() + tokenExpiresIn * 1000);
  
  // Get profile image if available
  let profileImageUrl = '';
  if (profile.profilePicture && 
      profile.profilePicture.displayImage && 
      typeof profile.profilePicture.displayImage === 'string') {
    profileImageUrl = profile.profilePicture.displayImage;
  }

  if (existingIntegration) {
    // Update existing integration
    const [updatedIntegration] = await db
      .update(platformIntegrations)
      .set({
        accessToken,
        accountId: profile.id,
        accountName: fullName,
        profileImageUrl,
        tokenExpiry,
        isActive: true,
        updatedAt: new Date()
      })
      .where(eq(platformIntegrations.id, existingIntegration.id))
      .returning();
    
    return updatedIntegration;
  } else {
    // Create new integration
    const [newIntegration] = await db
      .insert(platformIntegrations)
      .values({
        userId,
        platform: 'linkedin',
        accessToken,
        accountId: profile.id,
        accountName: fullName,
        profileImageUrl,
        tokenExpiry,
        isActive: true
      })
      .returning();
    
    return newIntegration;
  }
}

/**
 * Disconnect LinkedIn integration for a user
 * 
 * @param userId The user ID
 * @returns The result of the operation
 */
export async function disconnectLinkedInIntegration(userId: number): Promise<{ success: boolean }> {
  // Check if integration exists
  const [existingIntegration] = await db
    .select()
    .from(platformIntegrations)
    .where(
      eq(platformIntegrations.userId, userId) && 
      eq(platformIntegrations.platform, 'linkedin')
    );

  if (!existingIntegration) {
    throw new Error('LinkedIn integration not found');
  }

  // We don't delete the record, just mark it as inactive
  await db
    .update(platformIntegrations)
    .set({
      isActive: false,
      updatedAt: new Date()
    })
    .where(eq(platformIntegrations.id, existingIntegration.id));
  
  return { success: true };
}

/**
 * Post content to LinkedIn
 * 
 * @param accessToken LinkedIn access token
 * @param content The content to post
 * @returns The response from LinkedIn
 */
export async function postToLinkedIn(
  accessToken: string,
  content: LinkedInShareContent
): Promise<any> {
  if (!content.text && !content.imageUrl && !content.link) {
    throw new Error('At least one of text, image, or link is required');
  }

  // Build the share request
  let shareRequest: any = {
    author: 'urn:li:person:{person_id}', // LinkedIn API will replace {person_id} automatically
    lifecycleState: 'PUBLISHED',
    specificContent: {
      'com.linkedin.ugc.ShareContent': {
        shareCommentary: {
          text: content.text || ''
        },
        shareMediaCategory: 'NONE'
      }
    },
    visibility: {
      'com.linkedin.ugc.MemberNetworkVisibility': 'PUBLIC'
    }
  };

  // Add media if image URL or link is provided
  if (content.imageUrl || content.link) {
    const mediaItems = [];
    
    if (content.imageUrl) {
      // Register the image first
      const registerImageResponse = await axios.post(
        `${LINKEDIN_API_URL}/assets?action=registerUpload`,
        {
          registerUploadRequest: {
            recipes: ['urn:li:digitalmediaRecipe:feedshare-image'],
            owner: 'urn:li:person:{person_id}',
            serviceRelationships: [{
              relationshipType: 'OWNER',
              identifier: 'urn:li:userGeneratedContent'
            }]
          }
        },
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': 'application/json'
          }
        }
      );
      
      const uploadUrl = registerImageResponse.data.value.uploadMechanism['com.linkedin.digitalmedia.uploading.MediaUploadHttpRequest'].uploadUrl;
      const asset = registerImageResponse.data.value.asset;
      
      // Fetch the image
      const imageResponse = await axios.get(content.imageUrl, { responseType: 'arraybuffer' });
      
      // Upload the image to LinkedIn
      await axios.put(uploadUrl, imageResponse.data, {
        headers: {
          'Content-Type': 'application/octet-stream'
        }
      });
      
      mediaItems.push({
        status: 'READY',
        description: {
          text: content.description || ''
        },
        media: asset,
        title: {
          text: content.title || ''
        }
      });
    }
    
    if (content.link) {
      mediaItems.push({
        status: 'READY',
        originalUrl: content.link,
        title: {
          text: content.title || content.link
        },
        description: {
          text: content.description || ''
        }
      });
    }
    
    if (mediaItems.length > 0) {
      shareRequest.specificContent['com.linkedin.ugc.ShareContent'].shareMediaCategory = 
        content.imageUrl ? 'IMAGE' : 'ARTICLE';
      shareRequest.specificContent['com.linkedin.ugc.ShareContent'].media = mediaItems;
    }
  }

  // Post to LinkedIn
  const response = await axios.post(
    `${LINKEDIN_API_URL}/ugcPosts`,
    shareRequest,
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
        'X-Restli-Protocol-Version': '2.0.0'
      }
    }
  );

  return response.data;
}

/**
 * Check if the access token is still valid
 * 
 * @param accessToken LinkedIn access token
 * @returns True if valid, false otherwise
 */
export async function validateAccessToken(accessToken: string): Promise<boolean> {
  try {
    await axios.get(`${LINKEDIN_API_URL}/me`, {
      headers: {
        Authorization: `Bearer ${accessToken}`
      }
    });
    return true;
  } catch (error) {
    return false;
  }
}

/**
 * Refresh an expired token
 * 
 * @param refreshToken LinkedIn refresh token
 * @returns The new token response
 */
export async function refreshToken(refreshToken: string): Promise<LinkedInTokenResponse> {
  if (!process.env.LINKEDIN_CLIENT_ID || !process.env.LINKEDIN_CLIENT_SECRET) {
    throw new Error('LinkedIn client ID or secret not set');
  }

  const params = new URLSearchParams();
  params.append('grant_type', 'refresh_token');
  params.append('refresh_token', refreshToken);
  params.append('client_id', process.env.LINKEDIN_CLIENT_ID);
  params.append('client_secret', process.env.LINKEDIN_CLIENT_SECRET);

  const response = await axios.post(LINKEDIN_TOKEN_URL, params, {
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded'
    }
  });

  return response.data;
}