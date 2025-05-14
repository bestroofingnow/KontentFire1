/**
 * LinkedIn API integration routes
 */

import express from 'express';
import { Request, Response } from 'express';
import { storage } from '../storage';
import { 
  getAuthorizationUrl, 
  getAccessToken, 
  getUserProfile,
  shareTextPost,
  shareImagePost,
  shareVideoPost,
  isAccessTokenValid
} from '../integrations/linkedin';
import { generateNonce } from '../utils/auth';

// Random string generation for CSRF protection
const generateState = () => Math.random().toString(36).substring(2, 15);

const router = express.Router();

// Get LinkedIn authorization URL
router.get('/auth-url', (req: Request, res: Response) => {
  if (!req.isAuthenticated()) {
    return res.status(401).json({ message: 'Not authenticated' });
  }
  
  try {
    // The OAuth redirect URI that LinkedIn will redirect back to
    const redirectUri = `${req.protocol}://${req.get('host')}/api/integrations/linkedin/callback`;
    
    // Generate a random state for CSRF protection
    const state = generateState();
    
    // Store state in session
    if (req.session) {
      req.session.linkedInState = state;
    }
    
    const authUrl = getAuthorizationUrl(redirectUri, state);
    res.json({ authUrl });
  } catch (error) {
    console.error('Failed to get LinkedIn auth URL:', error);
    res.status(500).json({ 
      message: 'Failed to get LinkedIn auth URL: ' + (error instanceof Error ? error.message : 'Unknown error')
    });
  }
});

// OAuth callback endpoint that LinkedIn will redirect to
router.get('/callback', async (req: Request, res: Response) => {
  const { code, state, error } = req.query;
  
  // Handle error from LinkedIn
  if (error) {
    return res.redirect(`/dashboard/settings/connections?error=${encodeURIComponent(error as string)}`);
  }
  
  // Check if user is authenticated
  if (!req.isAuthenticated()) {
    return res.redirect('/auth?error=Please log in to connect LinkedIn');
  }
  
  // Validate state to prevent CSRF
  const sessionState = req.session?.linkedInState;
  if (!sessionState || sessionState !== state) {
    return res.redirect('/dashboard/settings/connections?error=invalid_state');
  }
  
  // Clear state from session
  if (req.session) {
    delete req.session.linkedInState;
  }
  
  if (!code) {
    return res.redirect('/dashboard/settings/connections?error=missing_code');
  }
  
  try {
    // The redirectUri must be the same as the one used to get the auth URL
    const redirectUri = `${req.protocol}://${req.get('host')}/api/integrations/linkedin/callback`;
    
    // Exchange the code for an access token
    const tokenData = await getAccessToken(code as string, redirectUri);
    
    // Get the user's LinkedIn profile
    const profile = await getUserProfile(tokenData.access_token);
    
    // Store the LinkedIn connection details
    await storage.saveLinkedInConnection(req.user.id, {
      linkedinId: profile.id,
      accessToken: tokenData.access_token,
      refreshToken: tokenData.refresh_token,
      expiresAt: new Date(Date.now() + tokenData.expires_in * 1000),
      name: `${profile.firstName} ${profile.lastName}`,
      profilePicture: profile.profilePicture || null,
      email: profile.email || null,
    });
    
    // Redirect back to the settings page
    return res.redirect('/dashboard/settings/connections?linkedin=connected');
  } catch (error) {
    console.error('LinkedIn OAuth callback error:', error);
    return res.redirect(`/dashboard/settings/connections?error=${encodeURIComponent(error instanceof Error ? error.message : 'Unknown error')}`);
  }
});

// Get LinkedIn connection status
router.get('/status', async (req: Request, res: Response) => {
  if (!req.isAuthenticated()) {
    return res.status(401).json({ message: 'Not authenticated' });
  }
  
  try {
    const connection = await storage.getLinkedInConnection(req.user.id);
    
    if (!connection) {
      return res.json({ connected: false });
    }
    
    // Check if token is expired
    const isExpired = connection.tokenExpiry && new Date(connection.tokenExpiry) <= new Date();
    
    // If not expired, also check if the token is still valid with LinkedIn
    let isValid = !isExpired;
    if (isValid && connection.accessToken) {
      isValid = await isAccessTokenValid(connection.accessToken);
    }
    
    return res.json({
      connected: isValid,
      profile: isValid ? {
        name: connection.accountName,
        profilePicture: connection.profileImageUrl,
      } : null,
    });
  } catch (error) {
    console.error('Failed to get LinkedIn status:', error);
    res.status(500).json({ 
      message: 'Failed to get LinkedIn status: ' + (error instanceof Error ? error.message : 'Unknown error')
    });
  }
});

// Post to LinkedIn
router.post('/post', async (req: Request, res: Response) => {
  if (!req.isAuthenticated()) {
    return res.status(401).json({ message: 'Not authenticated' });
  }
  
  const { text, mediaType, mediaUrl, title } = req.body;
  
  if (!text) {
    return res.status(400).json({ message: 'Text content is required' });
  }
  
  try {
    // Get the user's LinkedIn connection
    const connection = await storage.getLinkedInConnection(req.user.id);
    
    if (!connection) {
      return res.status(400).json({ message: 'LinkedIn account not connected' });
    }
    
    // Check if token is expired
    if (connection.tokenExpiry && new Date(connection.tokenExpiry) <= new Date()) {
      return res.status(401).json({ message: 'LinkedIn token expired, please reconnect your account' });
    }
    
    // Check if token is still valid
    const isValid = await isAccessTokenValid(connection.accessToken!);
    
    if (!isValid) {
      return res.status(401).json({ message: 'LinkedIn token is invalid, please reconnect your account' });
    }
    
    // Post to LinkedIn based on media type
    let result;
    
    if (!mediaType || mediaType === 'none') {
      // Text-only post
      result = await shareTextPost(connection.accessToken!, text);
    } else if (mediaType === 'image' && mediaUrl) {
      // Image post
      result = await shareImagePost(connection.accessToken!, text, mediaUrl, title);
    } else if (mediaType === 'video' && mediaUrl) {
      // Video post
      result = await shareVideoPost(connection.accessToken!, text, mediaUrl, title);
    } else {
      return res.status(400).json({ message: 'Invalid media type or missing media URL' });
    }
    
    // Record the share in analytics
    await storage.recordSocialShare(req.user.id, {
      platform: 'linkedin',
      contentType: mediaType || 'text',
      postId: result.id || 'unknown',
      text,
      mediaUrl: mediaUrl || null,
      timestamp: new Date(),
    });
    
    // Return success
    res.json({ success: true, result });
  } catch (error) {
    console.error('Failed to post to LinkedIn:', error);
    res.status(500).json({ 
      message: 'Failed to post to LinkedIn: ' + (error instanceof Error ? error.message : 'Unknown error')
    });
  }
});

// Disconnect LinkedIn integration
router.delete('/', async (req: Request, res: Response) => {
  if (!req.isAuthenticated()) {
    return res.status(401).json({ message: 'Not authenticated' });
  }
  
  try {
    await storage.removeLinkedInConnection(req.user.id);
    res.json({ success: true });
  } catch (error) {
    console.error('Failed to disconnect LinkedIn account:', error);
    res.status(500).json({ 
      message: 'Failed to disconnect LinkedIn account: ' + (error instanceof Error ? error.message : 'Unknown error')
    });
  }
});

export default router;
