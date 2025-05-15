/**
 * LinkedIn Deployment-Specific Integration
 * 
 * This file contains routes specifically designed to work in the deployed
 * environment, with special attention to the correct redirect URIs.
 */

import { Request, Response, Router } from 'express';
import { storage } from '../storage';
import { generateNonce } from '../utils/auth';
import * as linkedInService from '../integrations/linkedin';

const router = Router();

// List of approved redirect URIs that have been registered with LinkedIn
const APPROVED_REDIRECT_URIS = [
  'https://kontentfire.kynexpro.com/api/integrations/linkedin/callback',
  'https://kontentfire.kynexpro.com/integrations/linkedin/callback', // Version without /api prefix
  'https://kontent-fire-kfuwmk.replit.app/api/integrations/linkedin/callback',
  'https://kontent-fire-kfuwmk.replit.app/integrations/linkedin/callback', // Version without /api prefix
  // Add any other approved URIs here
];

// Debug endpoint to show deployment settings
router.get('/deployment-info', (req: Request, res: Response) => {
  try {
    // Get current request details
    const url = `${req.protocol}://${req.get('host')}${req.originalUrl}`;
    const baseUrl = `${req.protocol}://${req.get('host')}`;
    
    // Calculate potential callback URLs
    const possibleCallbacks = [
      `${baseUrl}/api/integrations/linkedin/callback`,
      `${baseUrl}/api/integrations/linkedin/deployment-callback`,
    ];
    
    // Prepare response
    const info = {
      environment: process.env.NODE_ENV || 'development',
      currentUrl: url,
      baseUrl: baseUrl,
      host: req.get('host'),
      possibleCallbacks,
      approvedRedirectUris: APPROVED_REDIRECT_URIS,
      recommendedRedirectUri: `${baseUrl}/api/integrations/linkedin/deployment-callback`,
      linkedinClientConfigured: !!process.env.LINKEDIN_CLIENT_ID,
      linkedinSecretConfigured: !!process.env.LINKEDIN_CLIENT_SECRET,
      scopes: ['r_liteprofile'] // Minimal scope for testing
    };
    
    res.json(info);
  } catch (error) {
    console.error('Failed to get deployment info:', error);
    res.status(500).json({ 
      message: 'Failed to get deployment info: ' + (error instanceof Error ? error.message : 'Unknown error')
    });
  }
});

// Special LinkedIn auth URL generator for deployment
router.get('/auth-url', (req: Request, res: Response) => {
  try {
    // Check if user is authenticated
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: 'Not authenticated' });
    }
    
    // Generate a random state value to prevent CSRF attacks
    const state = generateNonce();
    
    // Build the redirect URI based on the current host
    const baseUrl = `${req.protocol}://${req.get('host')}`;
    const redirectUri = `${baseUrl}/api/integrations/linkedin/deployment-callback`;
    
    // Log the redirectUri for debugging
    console.log('Using deployment redirect URI:', redirectUri);
    
    // Generate LinkedIn authentication URL with minimal scope
    const authUrl = linkedInService.generateAuthUrl(redirectUri, state, ['r_liteprofile']);
    
    // Store state in session
    if (req.session) {
      req.session.linkedInDeploymentState = state;
    }
    
    res.json({ 
      authUrl,
      redirectUri,
      message: 'Use this URL to authenticate with LinkedIn in deployment'
    });
  } catch (error) {
    console.error('Failed to get deployment LinkedIn auth URL:', error);
    res.status(500).json({ 
      message: 'Failed to get deployment LinkedIn auth URL: ' + 
               (error instanceof Error ? error.message : 'Unknown error')
    });
  }
});

// Special callback endpoint for deployment
router.get('/deployment-callback', async (req: Request, res: Response) => {
  console.log('LinkedIn DEPLOYMENT callback received:', {
    query: req.query,
    state: req.session?.linkedInDeploymentState,
    queryState: req.query.state
  });
  
  try {
    // Check for error from LinkedIn
    if (req.query.error) {
      console.error('LinkedIn auth error:', req.query.error, req.query.error_description);
      return res.redirect(`/linkedin-troubleshoot?error=${req.query.error}&error_description=${req.query.error_description}`);
    }
    
    // Verify state to prevent CSRF
    const storedState = req.session?.linkedInDeploymentState;
    const receivedState = req.query.state as string;
    
    if (!storedState || storedState !== receivedState) {
      console.error('LinkedIn state mismatch', { storedState, receivedState });
      return res.redirect('/linkedin-troubleshoot?error=state_mismatch');
    }
    
    // Clear the state from session
    if (req.session) {
      delete req.session.linkedInDeploymentState;
    }
    
    // Get the authorization code
    const code = req.query.code as string;
    
    if (!code) {
      console.error('No code received from LinkedIn');
      return res.redirect('/linkedin-troubleshoot?error=no_code');
    }
    
    // Build the redirect URI (must match what was used to get the code)
    const baseUrl = `${req.protocol}://${req.get('host')}`;
    const redirectUri = `${baseUrl}/api/integrations/linkedin/deployment-callback`;
    
    // Exchange code for token
    const tokenData = await linkedInService.exchangeCodeForToken(code, redirectUri);
    
    // Get the user's LinkedIn profile
    const profile = await linkedInService.getLinkedInProfile(tokenData.access_token);
    
    if (!req.user?.id) {
      return res.redirect('/linkedin-troubleshoot?error=not_authenticated');
    }
    
    // Store the LinkedIn credentials for the user using the existing storage interface
    await storage.saveLinkedInConnection(req.user.id, {
      linkedinId: profile.id,
      accessToken: tokenData.access_token,
      expiresAt: new Date(Date.now() + tokenData.expires_in * 1000),
      refreshToken: tokenData.refresh_token,
      name: `${profile.localizedFirstName} ${profile.localizedLastName}`,
      profilePicture: profile.profilePicture?.displayImage || null,
      email: null // LinkedIn email address requires additional scope
    });
    
    // Redirect to success page
    res.redirect('/linkedin-troubleshoot?success=true');
  } catch (error) {
    console.error('Error in LinkedIn deployment callback:', error);
    res.redirect(`/linkedin-troubleshoot?error=callback_error&message=${encodeURIComponent(String(error))}`);
  }
});

export default router;