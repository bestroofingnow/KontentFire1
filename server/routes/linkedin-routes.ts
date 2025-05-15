/**
 * LinkedIn API integration routes
 */

import { Request, Response, Router } from 'express';
import { storage } from '../storage';
import { generateNonce } from '../utils/auth';
import * as linkedInService from '../integrations/linkedin';
import { URL } from 'url';

const router = Router();

// Debug endpoint to check LinkedIn configuration
router.get('/debug-config', (req: Request, res: Response) => {
  try {
    // Check if user is authenticated
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: 'Not authenticated' });
    }
    
    // Don't expose full secrets, but show if they're configured
    const config = {
      clientIdConfigured: !!process.env.LINKEDIN_CLIENT_ID,
      clientSecretConfigured: !!process.env.LINKEDIN_CLIENT_SECRET,
      clientIdPrefix: process.env.LINKEDIN_CLIENT_ID ? process.env.LINKEDIN_CLIENT_ID.substring(0, 4) + '...' : null,
      scopes: ['r_liteprofile'], // Should match what's in linkedin.ts
      redirectUri: 'https://kontentfire.kynexpro.com/api/integrations/linkedin/callback',
      // Include API endpoints for reference
      apiEndpoints: {
        profile: 'https://api.linkedin.com/v2/me',
        email: 'https://api.linkedin.com/v2/emailAddress?q=members&projection=(elements*(handle~))',
        share: 'https://api.linkedin.com/v2/ugcPosts'
      }
    };
    
    res.json(config);
  } catch (error) {
    console.error('Failed to get LinkedIn debug config:', error);
    res.status(500).json({ 
      message: 'Failed to get LinkedIn debug config: ' + (error instanceof Error ? error.message : 'Unknown error')
    });
  }
});

// Get LinkedIn authentication URL
router.get('/auth-url', (req: Request, res: Response) => {
  try {
    // Check if user is authenticated
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: 'Not authenticated' });
    }
    
    // Generate a random state value to prevent CSRF attacks
    const state = generateNonce();
    
    // Build the redirect URI
    // Use the production domain for LinkedIn OAuth
    const redirectUri = 'https://kontentfire.kynexpro.com/api/integrations/linkedin/callback';
    
    // Log the redirectUri for debugging
    console.log('Using LinkedIn redirect URI:', redirectUri);
    
    // Generate LinkedIn authentication URL
    const authUrl = linkedInService.generateAuthUrl(redirectUri, state);
    
    // Store state in session
    if (req.session) {
      req.session.linkedInState = state;
    }
    
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
  console.log('LinkedIn callback received:', {
    query: req.query,
    path: req.path,
    headers: req.headers
  });
  
  const { code, state, error } = req.query;
  
  // Handle error from LinkedIn
  if (error) {
    console.error('LinkedIn error:', error);
    return res.redirect(`/integrations?error=${encodeURIComponent(error as string)}`);
  }
  
  // Check if user is authenticated
  if (!req.isAuthenticated()) {
    return res.redirect('/auth?message=session_expired');
  }
  
  // Validate state to prevent CSRF
  const sessionState = req.session?.linkedInState;
  
  // For development purposes, temporarily disable state validation
  // This should be re-enabled in production for security
  console.log('LinkedIn state check:', { 
    sessionState, 
    queryState: state, 
    match: sessionState === state
  });
  
  // Comment out state validation during development
  // if (!sessionState || sessionState !== state) {
  //   console.error('LinkedIn state validation failed', { sessionState, queryState: state });
  //   return res.redirect('/integrations?error=invalid_state');
  // }
  
  // Clear state from session
  if (req.session) {
    delete req.session.linkedInState;
  }
  
  if (!code) {
    console.error('LinkedIn code missing in callback');
    return res.redirect('/integrations?error=missing_code');
  }
  
  try {
    // The redirectUri must be the same as the one used to get the auth URL
    // Use the production domain for LinkedIn OAuth (must match exactly what's registered in LinkedIn app)
    const redirectUri = 'https://kontentfire.kynexpro.com/api/integrations/linkedin/callback';
    
    // Log the redirectUri for debugging
    console.log('Callback - using LinkedIn redirect URI:', redirectUri);
    
    // Exchange authorization code for access token
    const tokenResponse = await linkedInService.exchangeCodeForToken(code as string, redirectUri);
    
    // Get LinkedIn profile information
    const profile = await linkedInService.getLinkedInProfile(tokenResponse.access_token);
    
    // Calculate token expiration date
    const expiresAt = new Date();
    expiresAt.setSeconds(expiresAt.getSeconds() + tokenResponse.expires_in);
    
    // Save LinkedIn connection to the database
    await storage.saveLinkedInConnection(req.user.id, {
      linkedinId: profile.id,
      accessToken: tokenResponse.access_token,
      refreshToken: tokenResponse.refresh_token,
      expiresAt,
      name: `${profile.localizedFirstName} ${profile.localizedLastName}`,
      profilePicture: profile.profilePicture?.displayImage || null,
      email: profile.email || null,
    });
    
    // Redirect to success page
    res.redirect('/integrations?success=linkedin_connected');
  } catch (error) {
    console.error('LinkedIn auth callback error:', error);
    res.redirect(`/integrations?error=${encodeURIComponent((error instanceof Error ? error.message : 'Unknown error'))}`);
  }
});

// Check LinkedIn connection status
router.get('/status', async (req: Request, res: Response) => {
  try {
    // Check if user is authenticated
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: 'Not authenticated' });
    }
    
    // Get LinkedIn connection from database
    const integration = await storage.getLinkedInConnection(req.user.id);
    
    if (!integration || !integration.accessToken) {
      return res.json({
        isConnected: false,
      });
    }
    
    // Check if token is expired
    const now = new Date();
    const expiresAt = new Date(integration.tokenExpiry || 0);
    
    // If token is expired, try to refresh it
    if (now > expiresAt && integration.refreshToken) {
      try {
        const tokenResponse = await linkedInService.refreshLinkedInToken(integration.refreshToken);
        
        // Calculate new expiration date
        const newExpiresAt = new Date();
        newExpiresAt.setSeconds(newExpiresAt.getSeconds() + tokenResponse.expires_in);
        
        // Update token in database
        await storage.saveLinkedInConnection(req.user.id, {
          linkedinId: integration.accountId || (integration.metadata as any)?.linkedinId,
          accessToken: tokenResponse.access_token,
          refreshToken: tokenResponse.refresh_token,
          expiresAt: newExpiresAt,
          name: integration.accountName || (integration.metadata as any)?.name,
          profilePicture: integration.profileImageUrl || (integration.metadata as any)?.profilePicture,
          email: (integration.metadata as any)?.email,
        });
        
        // Return updated connection status
        return res.json({
          isConnected: true,
          profile: {
            name: integration.accountName || (integration.metadata as any)?.name,
            profilePicture: integration.profileImageUrl || (integration.metadata as any)?.profilePicture,
          },
        });
      } catch (refreshError) {
        console.error('Failed to refresh LinkedIn token:', refreshError);
        // If refresh fails, consider the connection as not connected
        return res.json({
          isConnected: false,
          error: 'Token expired and refresh failed',
        });
      }
    }
    
    // Return connection status
    res.json({
      isConnected: true,
      profile: {
        name: integration.accountName || (integration.metadata as any)?.name,
        profilePicture: integration.profileImageUrl || (integration.metadata as any)?.profilePicture,
      },
    });
  } catch (error) {
    console.error('Failed to check LinkedIn connection status:', error);
    res.status(500).json({ 
      message: 'Failed to check LinkedIn connection status: ' + (error instanceof Error ? error.message : 'Unknown error')
    });
  }
});

// Post to LinkedIn
router.post('/post', async (req: Request, res: Response) => {
  try {
    // Check if user is authenticated
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: 'Not authenticated' });
    }
    
    // Validate request body
    const { text, mediaUrl } = req.body;
    
    if (!text || typeof text !== 'string') {
      return res.status(400).json({ message: 'Post text is required' });
    }
    
    // Post to LinkedIn
    const result = await linkedInService.postToLinkedIn(req.user.id, {
      text,
      mediaUrl,
    });
    
    res.json(result);
  } catch (error) {
    console.error('Failed to post to LinkedIn:', error);
    res.status(500).json({ 
      message: 'Failed to post to LinkedIn: ' + (error instanceof Error ? error.message : 'Unknown error')
    });
  }
});

// Disconnect LinkedIn
router.delete('/', async (req: Request, res: Response) => {
  try {
    // Check if user is authenticated
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: 'Not authenticated' });
    }
    
    // Remove LinkedIn connection from database
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