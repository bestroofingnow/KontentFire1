/**
 * LinkedIn Integration Service
 * Handles OAuth authentication and API interactions with LinkedIn
 */

import axios from 'axios';
import querystring from 'querystring';
import { storage } from '../storage';

// LinkedIn API endpoints
const LINKEDIN_AUTH_URL = 'https://www.linkedin.com/oauth/v2/authorization';
const LINKEDIN_TOKEN_URL = 'https://www.linkedin.com/oauth/v2/accessToken';
const LINKEDIN_API_URL = 'https://api.linkedin.com/v2';

// LinkedIn API credentials from environment variables
const CLIENT_ID = process.env.LINKEDIN_CLIENT_ID;
const CLIENT_SECRET = process.env.LINKEDIN_CLIENT_SECRET;

if (!CLIENT_ID || !CLIENT_SECRET) {
  console.error('LinkedIn API credentials are missing. Set LINKEDIN_CLIENT_ID and LINKEDIN_CLIENT_SECRET environment variables.');
}

/**
 * Generate the LinkedIn OAuth authorization URL
 * 
 * @param redirectUri The redirect URI after authentication
 * @param state An optional state parameter to verify the callback
 * @returns The authorization URL
 */
export function getAuthorizationUrl(redirectUri: string, state: string = ''): string {
  const params = {
    response_type: 'code',
    client_id: CLIENT_ID,
    redirect_uri: redirectUri,
    state,
    scope: 'r_liteprofile r_emailaddress w_member_social',
  };

  return `${LINKEDIN_AUTH_URL}?${querystring.stringify(params)}`;
}

/**
 * Exchange an authorization code for an access token
 * 
 * @param code The authorization code received from LinkedIn
 * @param redirectUri The redirect URI used in the authorization request
 * @returns The access token and related information
 */
export async function getAccessToken(code: string, redirectUri: string): Promise<{
  access_token: string;
  expires_in: number;
  refresh_token?: string;
}> {
  const params = {
    grant_type: 'authorization_code',
    code,
    redirect_uri: redirectUri,
    client_id: CLIENT_ID,
    client_secret: CLIENT_SECRET,
  };

  try {
    const response = await axios.post(LINKEDIN_TOKEN_URL, querystring.stringify(params), {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    });

    return response.data;
  } catch (error) {
    console.error('Error getting LinkedIn access token:', error);
    throw error;
  }
}

/**
 * Refresh an expired access token
 * 
 * @param refreshToken The refresh token
 * @returns The new access token and related information
 */
export async function refreshAccessToken(refreshToken: string): Promise<{
  access_token: string;
  expires_in: number;
  refresh_token?: string;
}> {
  const params = {
    grant_type: 'refresh_token',
    refresh_token: refreshToken,
    client_id: CLIENT_ID,
    client_secret: CLIENT_SECRET,
  };

  try {
    const response = await axios.post(LINKEDIN_TOKEN_URL, querystring.stringify(params), {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    });

    return response.data;
  } catch (error) {
    console.error('Error refreshing LinkedIn access token:', error);
    throw error;
  }
}

/**
 * Get the user's LinkedIn profile information
 * 
 * @param accessToken The LinkedIn access token
 * @returns The user's profile information
 */
export async function getUserProfile(accessToken: string): Promise<{
  id: string;
  firstName: string;
  lastName: string;
  profilePicture?: string;
  email?: string;
}> {
  try {
    // Get basic profile
    const profileResponse = await axios.get(`${LINKEDIN_API_URL}/me?projection=(id,firstName,lastName,profilePicture(displayImage~:playableStreams))`, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    // Get email address (separate API call)
    const emailResponse = await axios.get(`${LINKEDIN_API_URL}/emailAddress?q=members&projection=(elements*(handle~))`, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    const profile = profileResponse.data;
    
    // Extract profile picture if available
    let profilePicture;
    if (profile.profilePicture && 
        profile.profilePicture['displayImage~'] && 
        profile.profilePicture['displayImage~'].elements) {
      const elements = profile.profilePicture['displayImage~'].elements;
      if (elements.length > 0) {
        profilePicture = elements[0].identifiers[0].identifier;
      }
    }

    // Extract email if available
    let email;
    if (emailResponse.data.elements && emailResponse.data.elements.length > 0) {
      email = emailResponse.data.elements[0]['handle~'].emailAddress;
    }

    // Format and return the profile
    return {
      id: profile.id,
      firstName: profile.firstName.localized[Object.keys(profile.firstName.localized)[0]],
      lastName: profile.lastName.localized[Object.keys(profile.lastName.localized)[0]],
      profilePicture,
      email,
    };
  } catch (error) {
    console.error('Error getting LinkedIn profile:', error);
    throw error;
  }
}

/**
 * Share a text post on LinkedIn
 * 
 * @param accessToken The LinkedIn access token
 * @param text The text content to share
 * @returns The response from the LinkedIn API
 */
export async function shareTextPost(accessToken: string, text: string): Promise<any> {
  try {
    const response = await axios.post(
      `${LINKEDIN_API_URL}/ugcPosts`,
      {
        author: `urn:li:person:${await getLinkedInUserId(accessToken)}`,
        lifecycleState: 'PUBLISHED',
        specificContent: {
          'com.linkedin.ugc.ShareContent': {
            shareCommentary: {
              text,
            },
            shareMediaCategory: 'NONE',
          },
        },
        visibility: {
          'com.linkedin.ugc.MemberNetworkVisibility': 'PUBLIC',
        },
      },
      {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
          'X-Restli-Protocol-Version': '2.0.0',
        },
      }
    );

    return response.data;
  } catch (error) {
    console.error('Error sharing LinkedIn post:', error);
    throw error;
  }
}

/**
 * Share an image post on LinkedIn
 * 
 * @param accessToken The LinkedIn access token
 * @param text The text content to share
 * @param imageUrl The URL of the image to share
 * @param title Optional title for the image
 * @returns The response from the LinkedIn API
 */
export async function shareImagePost(
  accessToken: string,
  text: string,
  imageUrl: string,
  title?: string
): Promise<any> {
  try {
    // 1. Register the image upload
    const userId = await getLinkedInUserId(accessToken);
    const registerUploadResponse = await axios.post(
      `${LINKEDIN_API_URL}/assets?action=registerUpload`,
      {
        registerUploadRequest: {
          recipes: ['urn:li:digitalmediaRecipe:feedshare-image'],
          owner: `urn:li:person:${userId}`,
          serviceRelationships: [
            {
              relationshipType: 'OWNER',
              identifier: 'urn:li:userGeneratedContent',
            },
          ],
        },
      },
      {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
          'X-Restli-Protocol-Version': '2.0.0',
        },
      }
    );

    // 2. Get upload URL and asset URN from the response
    const uploadUrl = registerUploadResponse.data.value.uploadMechanism['com.linkedin.digitalmedia.uploading.MediaUploadHttpRequest'].uploadUrl;
    const assetUrn = registerUploadResponse.data.value.asset;

    // 3. Download the image from the provided URL
    const imageResponse = await axios.get(imageUrl, {
      responseType: 'arraybuffer',
    });
    const imageBuffer = Buffer.from(imageResponse.data, 'binary');

    // 4. Upload the image to LinkedIn's servers
    await axios.put(uploadUrl, imageBuffer, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/octet-stream',
      },
    });

    // 5. Create the post with the uploaded image
    const response = await axios.post(
      `${LINKEDIN_API_URL}/ugcPosts`,
      {
        author: `urn:li:person:${userId}`,
        lifecycleState: 'PUBLISHED',
        specificContent: {
          'com.linkedin.ugc.ShareContent': {
            shareCommentary: {
              text,
            },
            shareMediaCategory: 'IMAGE',
            media: [
              {
                status: 'READY',
                description: {
                  text: title || text.substring(0, 100),
                },
                media: assetUrn,
                title: {
                  text: title || text.substring(0, 50),
                },
              },
            ],
          },
        },
        visibility: {
          'com.linkedin.ugc.MemberNetworkVisibility': 'PUBLIC',
        },
      },
      {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
          'X-Restli-Protocol-Version': '2.0.0',
        },
      }
    );

    return response.data;
  } catch (error) {
    console.error('Error sharing LinkedIn image post:', error);
    throw error;
  }
}

/**
 * Get the LinkedIn user ID from an access token
 * 
 * @param accessToken The LinkedIn access token
 * @returns The LinkedIn user ID
 */
async function getLinkedInUserId(accessToken: string): Promise<string> {
  try {
    const response = await axios.get(`${LINKEDIN_API_URL}/me`, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });
    return response.data.id;
  } catch (error) {
    console.error('Error getting LinkedIn user ID:', error);
    throw error;
  }
}

/**
 * Share a video post on LinkedIn
 * 
 * @param accessToken The LinkedIn access token
 * @param text The text content to share
 * @param videoUrl The URL of the video to share
 * @param title Optional title for the video
 * @returns The response from the LinkedIn API
 */
export async function shareVideoPost(
  accessToken: string,
  text: string,
  videoUrl: string,
  title?: string
): Promise<any> {
  try {
    // 1. Register the video upload
    const userId = await getLinkedInUserId(accessToken);
    const registerUploadResponse = await axios.post(
      `${LINKEDIN_API_URL}/assets?action=registerUpload`,
      {
        registerUploadRequest: {
          recipes: ['urn:li:digitalmediaRecipe:feedshare-video'],
          owner: `urn:li:person:${userId}`,
          serviceRelationships: [
            {
              relationshipType: 'OWNER',
              identifier: 'urn:li:userGeneratedContent',
            },
          ],
        },
      },
      {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
          'X-Restli-Protocol-Version': '2.0.0',
        },
      }
    );

    // 2. Get upload URL and asset URN from the response
    const uploadUrl = registerUploadResponse.data.value.uploadMechanism['com.linkedin.digitalmedia.uploading.MediaUploadHttpRequest'].uploadUrl;
    const assetUrn = registerUploadResponse.data.value.asset;

    // 3. Download the video from the provided URL
    const videoResponse = await axios.get(videoUrl, {
      responseType: 'arraybuffer',
    });
    const videoBuffer = Buffer.from(videoResponse.data, 'binary');

    // 4. Upload the video to LinkedIn's servers
    await axios.put(uploadUrl, videoBuffer, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/octet-stream',
      },
    });

    // 5. Create the post with the uploaded video
    const response = await axios.post(
      `${LINKEDIN_API_URL}/ugcPosts`,
      {
        author: `urn:li:person:${userId}`,
        lifecycleState: 'PUBLISHED',
        specificContent: {
          'com.linkedin.ugc.ShareContent': {
            shareCommentary: {
              text,
            },
            shareMediaCategory: 'VIDEO',
            media: [
              {
                status: 'READY',
                description: {
                  text: title || text.substring(0, 100),
                },
                media: assetUrn,
                title: {
                  text: title || text.substring(0, 50),
                },
              },
            ],
          },
        },
        visibility: {
          'com.linkedin.ugc.MemberNetworkVisibility': 'PUBLIC',
        },
      },
      {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
          'X-Restli-Protocol-Version': '2.0.0',
        },
      }
    );

    return response.data;
  } catch (error) {
    console.error('Error sharing LinkedIn video post:', error);
    throw error;
  }
}

/**
 * Check if a LinkedIn access token is valid
 * 
 * @param accessToken The LinkedIn access token to check
 * @returns True if the token is valid, false otherwise
 */
export async function isAccessTokenValid(accessToken: string): Promise<boolean> {
  try {
    await axios.get(`${LINKEDIN_API_URL}/me`, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });
    return true;
  } catch (error) {
    return false;
  }
}