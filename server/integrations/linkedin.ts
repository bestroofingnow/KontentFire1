/**
 * LinkedIn Integration Service
 * 
 * Provides functionality for integrating with the LinkedIn API:
 * - Authentication flow
 * - Profile retrieval
 * - Content sharing
 */

import axios from 'axios';
import { storage } from '../storage';

// LinkedIn API endpoints
const LINKEDIN_API_URL = 'https://api.linkedin.com/v2';
const LINKEDIN_TOKEN_URL = 'https://www.linkedin.com/oauth/v2/accessToken';

// LinkedIn app configuration
const LINKEDIN_CLIENT_ID = process.env.LINKEDIN_CLIENT_ID;
const LINKEDIN_CLIENT_SECRET = process.env.LINKEDIN_CLIENT_SECRET;

// LinkedIn API requires specific scopes for different operations (from LinkedIn docs)
// The updated scopes based on LinkedIn's current documentation
const SCOPES = ['openid', 'profile'];

// LinkedIn has migrated from r_liteprofile to profile scope
// Old scopes (now deprecated):
// const SCOPES = ['r_liteprofile'];
// 
// Advanced scopes to add in the future if needed and authorized:
// const SCOPES = [
//   'openid',         // Required for OpenID Connect
//   'profile',        // Read basic profile (replacement for r_liteprofile)
//   'email',          // Read email address (optional)
//   'w_member_social' // Share posts - required for posting
// ];

export interface LinkedInTokenResponse {
  access_token: string;
  expires_in: number;
  refresh_token?: string;
}

export interface LinkedInProfile {
  id: string;
  localizedFirstName: string;
  localizedLastName: string;
  profilePicture?: {
    displayImage: string;
  };
  email?: string;
}

export interface LinkedInPostOptions {
  text: string;
  mediaUrl?: string;
}

// Generate authorization URL for LinkedIn OAuth flow
export function generateAuthUrl(
  redirectUri: string, 
  state: string, 
  customScopes?: string[]
): string {
  if (!LINKEDIN_CLIENT_ID) {
    throw new Error('LinkedIn Client ID is not defined');
  }
  
  // Use provided scopes or default ones
  const scopesToUse = customScopes || SCOPES;
  
  // Log for debugging
  console.log(`Generating LinkedIn auth URL with scopes: ${scopesToUse.join(', ')}`);
  
  const queryParams = new URLSearchParams({
    response_type: 'code',
    client_id: LINKEDIN_CLIENT_ID,
    redirect_uri: redirectUri,
    state: state,
    scope: scopesToUse.join(' '),
  });
  
  return `https://www.linkedin.com/oauth/v2/authorization?${queryParams.toString()}`;
}

// Exchange authorization code for access token
export async function exchangeCodeForToken(
  code: string,
  redirectUri: string
): Promise<LinkedInTokenResponse> {
  if (!LINKEDIN_CLIENT_ID || !LINKEDIN_CLIENT_SECRET) {
    throw new Error('LinkedIn Client credentials are not defined');
  }
  
  const params = new URLSearchParams();
  params.append('grant_type', 'authorization_code');
  params.append('code', code);
  params.append('redirect_uri', redirectUri);
  params.append('client_id', LINKEDIN_CLIENT_ID);
  params.append('client_secret', LINKEDIN_CLIENT_SECRET);
  
  const response = await axios.post(LINKEDIN_TOKEN_URL, params, {
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
  });
  
  return response.data;
}

// Get LinkedIn user profile using access token
export async function getLinkedInProfile(accessToken: string): Promise<LinkedInProfile> {
  try {
    // Try using OpenID Connect userinfo endpoint first (for 'openid' and 'profile' scopes)
    const userinfoResponse = await axios.get(`${LINKEDIN_API_URL}/userinfo`, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });
    
    console.log('LinkedIn userinfo response:', JSON.stringify(userinfoResponse.data, null, 2));
    
    // Format: { sub, name, given_name, family_name, picture, locale, email, email_verified }
    const userData = userinfoResponse.data;
    
    return {
      id: userData.sub,
      localizedFirstName: userData.given_name,
      localizedLastName: userData.family_name,
      profilePicture: userData.picture ? { displayImage: userData.picture } : undefined,
      email: userData.email,
    };
  } catch (error) {
    console.log('OpenID Connect profile retrieval failed, falling back to legacy API:', error.message);
    
    // Fall back to legacy API if OpenID Connect fails
    try {
      // Fetch basic profile information
      const profileResponse = await axios.get(`${LINKEDIN_API_URL}/me`, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });
      
      // Fetch profile picture if available
      const profilePictureResponse = await axios.get(
        `${LINKEDIN_API_URL}/me?projection=(id,profilePicture(displayImage~:playableStreams))`,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );
      
      // Fetch email address if scope is granted
      let email;
      try {
        const emailResponse = await axios.get(`${LINKEDIN_API_URL}/emailAddress?q=members&projection=(elements*(handle~))`, {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        });
        
        if (emailResponse.data?.elements?.[0]?.['handle~']?.emailAddress) {
          email = emailResponse.data.elements[0]['handle~'].emailAddress;
        }
      } catch (emailError) {
        console.warn('Could not fetch LinkedIn email address:', emailError.message);
      }
      
      // Extract profile picture URL if available
      let profilePicture;
      try {
        const pictureData = profilePictureResponse.data.profilePicture?.['displayImage~']?.elements;
        if (pictureData && pictureData.length > 0) {
          // Get the highest quality image available
          const sortedImages = pictureData.sort((a: any, b: any) => b.width - a.width);
          profilePicture = sortedImages[0].identifiers[0].identifier;
        }
      } catch (pictureError) {
        console.warn('Could not extract LinkedIn profile picture:', pictureError.message);
      }
      
      return {
        id: profileResponse.data.id,
        localizedFirstName: profileResponse.data.localizedFirstName,
        localizedLastName: profileResponse.data.localizedLastName,
        profilePicture: profilePicture ? { displayImage: profilePicture } : undefined,
        email,
      };
    } catch (fallbackError) {
      console.error('Both OpenID Connect and legacy profile methods failed');
      throw new Error('Failed to retrieve LinkedIn profile: ' + fallbackError.message);
    }
  }
}

// Post content to LinkedIn
export async function postToLinkedIn(userId: number, options: LinkedInPostOptions): Promise<any> {
  const integration = await storage.getLinkedInConnection(userId);
  
  if (!integration || !integration.accessToken) {
    throw new Error('LinkedIn connection not found or invalid');
  }
  
  // LinkedIn API requires specific format for creating posts
  // Base structure for a text post
  const postData: any = {
    author: `urn:li:person:${integration.accountId || (integration.metadata as any)?.linkedinId || ''}`,
    lifecycleState: 'PUBLISHED',
    specificContent: {
      'com.linkedin.ugc.ShareContent': {
        shareCommentary: {
          text: options.text,
        },
        shareMediaCategory: 'NONE',
      },
    },
    visibility: {
      'com.linkedin.ugc.MemberNetworkVisibility': 'PUBLIC',
    },
  };
  
  // Add media if provided
  if (options.mediaUrl) {
    postData.specificContent['com.linkedin.ugc.ShareContent'].shareMediaCategory = 'IMAGE';
    postData.specificContent['com.linkedin.ugc.ShareContent'].media = [
      {
        status: 'READY',
        originalUrl: options.mediaUrl,
        title: {
          text: 'Image',
        },
      },
    ];
  }
  
  try {
    console.log('Posting to LinkedIn with data:', JSON.stringify(postData, null, 2));
    console.log('Using access token:', integration.accessToken?.substring(0, 10) + '...');
    
    // Create a post using LinkedIn's UGC Post API
    const response = await axios.post(
      `${LINKEDIN_API_URL}/ugcPosts`,
      postData,
      {
        headers: {
          Authorization: `Bearer ${integration.accessToken}`,
          'Content-Type': 'application/json',
          'X-Restli-Protocol-Version': '2.0.0',
        },
      }
    );
    
    // Log social share in database
    await storage.recordSocialShare(userId, {
      platform: 'linkedin',
      contentType: options.mediaUrl ? 'image_post' : 'text_post',
      postId: response.data.id,
      text: options.text,
      mediaUrl: options.mediaUrl || null,
      timestamp: new Date(),
    });
    
    return {
      success: true,
      postId: response.data.id,
      shareUrl: `https://www.linkedin.com/feed/update/${response.data.id}`,
    };
  } catch (error: any) {
    // Enhanced error handling with LinkedIn API specific messages
    console.error('LinkedIn API error:', JSON.stringify({
      message: error.message,
      status: error.response?.status,
      data: error.response?.data,
      stack: error.stack
    }, null, 2));
    
    let errorMessage = 'Failed to post to LinkedIn';
    if (error.response?.data?.message) {
      errorMessage = `LinkedIn API error: ${error.response.data.message}`;
    } else if (error.response?.data?.error_description) {
      errorMessage = `LinkedIn API error: ${error.response.data.error_description}`;
    } else if (error.response?.status === 401) {
      errorMessage = 'LinkedIn authorization expired. Please reconnect your account.';
    } else if (error.response?.status === 403) {
      errorMessage = 'Not authorized to post to LinkedIn. Please check your permissions.';
    }
    
    throw new Error(errorMessage);
  }
}

// Refresh LinkedIn access token if possible
export async function refreshLinkedInToken(refreshToken: string): Promise<LinkedInTokenResponse> {
  if (!LINKEDIN_CLIENT_ID || !LINKEDIN_CLIENT_SECRET) {
    throw new Error('LinkedIn Client credentials are not defined');
  }
  
  const params = new URLSearchParams();
  params.append('grant_type', 'refresh_token');
  params.append('refresh_token', refreshToken);
  params.append('client_id', LINKEDIN_CLIENT_ID);
  params.append('client_secret', LINKEDIN_CLIENT_SECRET);
  
  const response = await axios.post(LINKEDIN_TOKEN_URL, params, {
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
  });
  
  return response.data;
}