/**
 * LinkedIn authentication and API routes
 */

import express from 'express';
import { 
  getAuthorizationUrl, 
  getAccessToken, 
  getUserProfile, 
  shareTextPost,
  shareImagePost,
  shareVideoPost,
  isAccessTokenValid
} from '../integrations/linkedin';
import { storage } from '../storage';
import { generateNonce } from '../utils/auth';

const router = express.Router();

// Get the LinkedIn OAuth URL for login
router.get('/auth/linkedin', (req, res) => {
  // Generate a state parameter to protect against CSRF
  const state = generateNonce();
  
  // Store the state in the session (if no session, this is a no-op)
  if (req.session) {
    req.session.linkedinState = state;
  }
  
  // Get the redirect URI
  const host = req.headers.host || 'localhost:3000';
  const protocol = host.includes('localhost') ? 'http' : 'https';
  const redirectUri = `${protocol}://${host}/api/auth/linkedin/callback`;
  
  // Generate the authorization URL
  const authUrl = getAuthorizationUrl(redirectUri, state);
  
  // Redirect to LinkedIn for authentication
  res.redirect(authUrl);
});

// Handle the callback from LinkedIn OAuth
router.get('/auth/linkedin/callback', async (req, res) => {
  try {
    const { code, state, error } = req.query;
    
    // Check for error
    if (error) {
      return res.status(400).json({ error: `LinkedIn authentication error: ${error}` });
    }
    
    // Verify state to prevent CSRF
    if (req.session?.linkedinState !== state) {
      return res.status(403).json({ error: 'Invalid state parameter' });
    }
    
    // Clear the state from the session
    if (req.session) {
      delete req.session.linkedinState;
    }
    
    // Get the redirect URI
    const host = req.headers.host || 'localhost:3000';
    const protocol = host.includes('localhost') ? 'http' : 'https';
    const redirectUri = `${protocol}://${host}/api/auth/linkedin/callback`;
    
    // Exchange code for access token
    const tokenData = await getAccessToken(code as string, redirectUri);
    
    // Get user profile from LinkedIn
    const profile = await getUserProfile(tokenData.access_token);
    
    // Check if user is authenticated
    if (!req.isAuthenticated() || !req.user?.id) {
      return res.redirect('/auth?error=Please log in to connect LinkedIn');
    }
    
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
    
    // Redirect to the social connections page
    res.redirect('/dashboard/settings/connections#linkedin-connected');
  } catch (error) {
    console.error('LinkedIn callback error:', error);
    res.status(500).json({ error: 'Failed to authenticate with LinkedIn' });
  }
});

// Get LinkedIn connection status for the current user
router.get('/linkedin/status', async (req, res) => {
  try {
    if (!req.isAuthenticated() || !req.user?.id) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    
    const connection = await storage.getLinkedInConnection(req.user.id);
    
    if (!connection) {
      return res.json({ connected: false });
    }
    
    // Check if token is expired
    const isExpired = new Date(connection.expiresAt) <= new Date();
    
    // If not expired, also check if the token is still valid with LinkedIn
    let isValid = !isExpired;
    if (isValid) {
      isValid = await isAccessTokenValid(connection.accessToken);
    }
    
    return res.json({
      connected: isValid,
      profile: isValid ? {
        name: connection.name,
        profilePicture: connection.profilePicture,
      } : null,
    });
  } catch (error) {
    console.error('LinkedIn status error:', error);
    res.status(500).json({ error: 'Failed to get LinkedIn connection status' });
  }
});

// Disconnect LinkedIn from the current user
router.post('/linkedin/disconnect', async (req, res) => {
  try {
    if (!req.isAuthenticated() || !req.user?.id) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    
    await storage.removeLinkedInConnection(req.user.id);
    res.json({ success: true });
  } catch (error) {
    console.error('LinkedIn disconnect error:', error);
    res.status(500).json({ error: 'Failed to disconnect LinkedIn' });
  }
});

// Share content on LinkedIn
router.post('/linkedin/share', async (req, res) => {
  try {
    if (!req.isAuthenticated() || !req.user?.id) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    
    const { text, mediaType, mediaUrl, title } = req.body;
    
    if (!text) {
      return res.status(400).json({ error: 'Text content is required' });
    }
    
    // Get LinkedIn connection
    const connection = await storage.getLinkedInConnection(req.user.id);
    
    if (!connection) {
      return res.status(400).json({ error: 'LinkedIn account not connected' });
    }
    
    // Check if token is expired
    if (new Date(connection.expiresAt) <= new Date()) {
      return res.status(400).json({ error: 'LinkedIn token expired, please reconnect your account' });
    }
    
    let result;
    
    // Share based on media type
    if (!mediaType || mediaType === 'none') {
      // Text-only post
      result = await shareTextPost(connection.accessToken, text);
    } else if (mediaType === 'image' && mediaUrl) {
      // Image post
      result = await shareImagePost(connection.accessToken, text, mediaUrl, title);
    } else if (mediaType === 'video' && mediaUrl) {
      // Video post
      result = await shareVideoPost(connection.accessToken, text, mediaUrl, title);
    } else {
      return res.status(400).json({ error: 'Invalid media type or missing media URL' });
    }
    
    // Record the share in analytics
    await storage.recordSocialShare(req.user.id, {
      platform: 'linkedin',
      contentType: mediaType || 'text',
      postId: result.id,
      text,
      mediaUrl: mediaUrl || null,
      timestamp: new Date(),
    });
    
    res.json({ success: true, result });
  } catch (error) {
    console.error('LinkedIn share error:', error);
    res.status(500).json({ error: 'Failed to share on LinkedIn' });
  }
});

export default router;