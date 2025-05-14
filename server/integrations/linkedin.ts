/**
 * LinkedIn Integration Service
 * 
 * Provides functions for authenticating with LinkedIn OAuth,
 * retrieving user profile information, and posting content.
 */

import axios from 'axios';
import { URL } from 'url';
import querystring from 'querystring';

// Constants
const LINKEDIN_API_URL = 'https://api.linkedin.com/v2';
const LINKEDIN_AUTH_URL = 'https://www.linkedin.com/oauth/v2/authorization';
const LINKEDIN_TOKEN_URL = 'https://www.linkedin.com/oauth/v2/accessToken';

// LinkedIn API scopes needed for our application
const SCOPES = [
  'r_liteprofile', 
  'r_emailaddress', 
  'w_member_social'
];

// Check if LinkedIn credentials are configured
if (!process.env.LINKEDIN_CLIENT_ID || !process.env.LINKEDIN_CLIENT_SECRET) {
  console.warn('LinkedIn API credentials not configured. LinkedIn integration will not function properly.');
}

/**
 * Generate LinkedIn OAuth authorization URL
 * 
 * @param redirectUri - The redirect URI to return to after authentication
 * @param state - Random state string for CSRF protection
 * @returns The authorization URL to redirect the user to
 */
export function getAuthorizationUrl(redirectUri: string, state: string): string {
  const url = new URL(LINKEDIN_AUTH_URL);
  
  url.searchParams.append('response_type', 'code');
  url.searchParams.append('client_id', process.env.LINKEDIN_CLIENT_ID!);
  url.searchParams.append('redirect_uri', redirectUri);
  url.searchParams.append('state', state);
  url.searchParams.append('scope', SCOPES.join(' '));
  
  return url.toString();
}

/**
 * Exchange authorization code for access token
 * 
 * @param code - The authorization code from LinkedIn
 * @param redirectUri - The redirect URI used in the authorization request
 * @returns The access token response
 */
export async function getAccessToken(code: string, redirectUri: string): Promise<{
  access_token: string;
  expires_in: number;
  refresh_token?: string;
}> {
  try {
    const response = await axios.post(
      LINKEDIN_TOKEN_URL,
      querystring.stringify({
        grant_type: 'authorization_code',
        code,
        redirect_uri: redirectUri,
        client_id: process.env.LINKEDIN_CLIENT_ID,
        client_secret: process.env.LINKEDIN_CLIENT_SECRET,
      }),
      {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      }
    );
    
    return {
      access_token: response.data.access_token,
      expires_in: response.data.expires_in,
      refresh_token: response.data.refresh_token,
    };
  } catch (error) {
    console.error('LinkedIn getAccessToken error:', error);
    if (axios.isAxiosError(error) && error.response) {
      throw new Error(`LinkedIn API error: ${error.response.status} - ${JSON.stringify(error.response.data)}`);
    }
    throw error;
  }
}

/**
 * Check if an access token is still valid
 * 
 * @param accessToken - The access token to validate
 * @returns True if the token is valid, false otherwise
 */
export async function isAccessTokenValid(accessToken: string): Promise<boolean> {
  try {
    // Make a simple API request to test the token
    await axios.get(`${LINKEDIN_API_URL}/me`, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });
    return true;
  } catch (error) {
    console.warn('LinkedIn token validation failed:', error);
    return false;
  }
}

/**
 * Get LinkedIn user profile information
 * 
 * @param accessToken - The user's access token
 * @returns User profile information
 */
export async function getUserProfile(accessToken: string): Promise<{
  id: string;
  firstName: string;
  lastName: string;
  profilePicture?: string;
  email?: string;
}> {
  try {
    // Get basic profile information
    const profileResponse = await axios.get(`${LINKEDIN_API_URL}/me`, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });
    
    // Get profile picture if available
    let profilePicture: string | undefined;
    try {
      const pictureResponse = await axios.get(`${LINKEDIN_API_URL}/me?projection=(id,profilePicture(displayImage~:playableStreams))`, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });
      
      const pictures = pictureResponse.data?.profilePicture?.['displayImage~']?.elements || [];
      if (pictures.length > 0) {
        // Get the highest resolution image
        const sortedPictures = pictures.sort((a: any, b: any) => b.width.pixelSize - a.width.pixelSize);
        profilePicture = sortedPictures[0]?.identifiers?.[0]?.identifier;
      }
    } catch (error) {
      console.warn('Failed to retrieve LinkedIn profile picture:', error);
    }
    
    // Get email address if available
    let email: string | undefined;
    try {
      const emailResponse = await axios.get(`${LINKEDIN_API_URL}/emailAddress?q=members&projection=(elements*(handle~))`, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });
      
      email = emailResponse.data?.elements?.[0]?.['handle~']?.emailAddress;
    } catch (error) {
      console.warn('Failed to retrieve LinkedIn email:', error);
    }
    
    return {
      id: profileResponse.data.id,
      firstName: profileResponse.data.localizedFirstName,
      lastName: profileResponse.data.localizedLastName,
      profilePicture,
      email,
    };
  } catch (error) {
    console.error('LinkedIn getUserProfile error:', error);
    if (axios.isAxiosError(error) && error.response) {
      throw new Error(`LinkedIn API error: ${error.response.status} - ${JSON.stringify(error.response.data)}`);
    }
    throw error;
  }
}

/**
 * Share a text-only post to LinkedIn
 * 
 * @param accessToken - The user's access token
 * @param text - The text content to share
 * @returns The post response data
 */
export async function shareTextPost(accessToken: string, text: string): Promise<any> {
  try {
    // Get the user's LinkedIn ID (needed for the author field)
    const profileResponse = await axios.get(`${LINKEDIN_API_URL}/me`, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });
    
    const linkedInId = profileResponse.data.id;
    
    // Create the share post
    const response = await axios.post(
      `${LINKEDIN_API_URL}/ugcPosts`,
      {
        author: `urn:li:person:${linkedInId}`,
        lifecycleState: 'PUBLISHED',
        specificContent: {
          'com.linkedin.ugc.ShareContent': {
            shareCommentary: {
              text: text
            },
            shareMediaCategory: 'NONE',
          }
        },
        visibility: {
          'com.linkedin.ugc.MemberNetworkVisibility': 'PUBLIC'
        }
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
    console.error('LinkedIn shareTextPost error:', error);
    if (axios.isAxiosError(error) && error.response) {
      throw new Error(`LinkedIn API error: ${error.response.status} - ${JSON.stringify(error.response.data)}`);
    }
    throw error;
  }
}

/**
 * Share an image post to LinkedIn
 * 
 * @param accessToken - The user's access token
 * @param text - The text content to share
 * @param imageUrl - The URL of the image to share
 * @param title - Optional title for the image
 * @returns The post response data
 */
export async function shareImagePost(
  accessToken: string, 
  text: string, 
  imageUrl: string, 
  title?: string
): Promise<any> {
  try {
    // Get the user's LinkedIn ID (needed for the author field)
    const profileResponse = await axios.get(`${LINKEDIN_API_URL}/me`, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });
    
    const linkedInId = profileResponse.data.id;
    
    // First, register the image with LinkedIn
    const registerImageResponse = await axios.post(
      `${LINKEDIN_API_URL}/assets?action=registerUpload`,
      {
        registerUploadRequest: {
          recipes: ['urn:li:digitalmediaRecipe:feedshare-image'],
          owner: `urn:li:person:${linkedInId}`,
          serviceRelationships: [
            {
              relationshipType: 'OWNER',
              identifier: 'urn:li:userGeneratedContent'
            }
          ]
        }
      },
      {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
          'X-Restli-Protocol-Version': '2.0.0',
        },
      }
    );
    
    // Get the upload URL from the response
    const uploadUrl = registerImageResponse.data.value.uploadMechanism['com.linkedin.digitalmedia.uploading.MediaUploadHttpRequest'].uploadUrl;
    const asset = registerImageResponse.data.value.asset;
    
    // Download the image from the provided URL
    const imageResponse = await axios.get(imageUrl, { responseType: 'arraybuffer' });
    const imageBuffer = Buffer.from(imageResponse.data, 'binary');
    
    // Upload the image to LinkedIn
    await axios.put(
      uploadUrl,
      imageBuffer,
      {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/octet-stream',
        },
      }
    );
    
    // Now create the post with the uploaded image
    const postResponse = await axios.post(
      `${LINKEDIN_API_URL}/ugcPosts`,
      {
        author: `urn:li:person:${linkedInId}`,
        lifecycleState: 'PUBLISHED',
        specificContent: {
          'com.linkedin.ugc.ShareContent': {
            shareCommentary: {
              text: text
            },
            shareMediaCategory: 'IMAGE',
            media: [
              {
                status: 'READY',
                description: {
                  text: title || ''
                },
                media: asset,
                title: {
                  text: title || 'Image'
                }
              }
            ]
          }
        },
        visibility: {
          'com.linkedin.ugc.MemberNetworkVisibility': 'PUBLIC'
        }
      },
      {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
          'X-Restli-Protocol-Version': '2.0.0',
        },
      }
    );
    
    return postResponse.data;
  } catch (error) {
    console.error('LinkedIn shareImagePost error:', error);
    if (axios.isAxiosError(error) && error.response) {
      throw new Error(`LinkedIn API error: ${error.response.status} - ${JSON.stringify(error.response.data)}`);
    }
    throw error;
  }
}

/**
 * Share a video post to LinkedIn
 * 
 * @param accessToken - The user's access token
 * @param text - The text content to share
 * @param videoUrl - The URL of the video to share
 * @param title - Optional title for the video
 * @returns The post response data
 */
export async function shareVideoPost(
  accessToken: string, 
  text: string, 
  videoUrl: string, 
  title?: string
): Promise<any> {
  try {
    // Get the user's LinkedIn ID (needed for the author field)
    const profileResponse = await axios.get(`${LINKEDIN_API_URL}/me`, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });
    
    const linkedInId = profileResponse.data.id;
    
    // First, register the video with LinkedIn
    const registerVideoResponse = await axios.post(
      `${LINKEDIN_API_URL}/assets?action=registerUpload`,
      {
        registerUploadRequest: {
          recipes: ['urn:li:digitalmediaRecipe:feedshare-video'],
          owner: `urn:li:person:${linkedInId}`,
          serviceRelationships: [
            {
              relationshipType: 'OWNER',
              identifier: 'urn:li:userGeneratedContent'
            }
          ]
        }
      },
      {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
          'X-Restli-Protocol-Version': '2.0.0',
        },
      }
    );
    
    // Get the upload URL from the response
    const uploadUrl = registerVideoResponse.data.value.uploadMechanism['com.linkedin.digitalmedia.uploading.MediaUploadHttpRequest'].uploadUrl;
    const asset = registerVideoResponse.data.value.asset;
    
    // Download the video from the provided URL
    const videoResponse = await axios.get(videoUrl, { responseType: 'arraybuffer' });
    const videoBuffer = Buffer.from(videoResponse.data, 'binary');
    
    // Upload the video to LinkedIn
    await axios.put(
      uploadUrl,
      videoBuffer,
      {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/octet-stream',
        },
      }
    );
    
    // Now create the post with the uploaded video
    const postResponse = await axios.post(
      `${LINKEDIN_API_URL}/ugcPosts`,
      {
        author: `urn:li:person:${linkedInId}`,
        lifecycleState: 'PUBLISHED',
        specificContent: {
          'com.linkedin.ugc.ShareContent': {
            shareCommentary: {
              text: text
            },
            shareMediaCategory: 'VIDEO',
            media: [
              {
                status: 'READY',
                description: {
                  text: title || ''
                },
                media: asset,
                title: {
                  text: title || 'Video'
                }
              }
            ]
          }
        },
        visibility: {
          'com.linkedin.ugc.MemberNetworkVisibility': 'PUBLIC'
        }
      },
      {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
          'X-Restli-Protocol-Version': '2.0.0',
        },
      }
    );
    
    return postResponse.data;
  } catch (error) {
    console.error('LinkedIn shareVideoPost error:', error);
    if (axios.isAxiosError(error) && error.response) {
      throw new Error(`LinkedIn API error: ${error.response.status} - ${JSON.stringify(error.response.data)}`);
    }
    throw error;
  }
}