/**
 * Authentication utility functions
 */

import { randomBytes } from 'crypto';

/**
 * Generate a random nonce string for use with CSRF protection
 * @param length The length of the nonce string (default: 32)
 * @returns A random string
 */
export function generateNonce(length = 32): string {
  return randomBytes(length).toString('hex');
}

// Add typings to extend Express.Session
declare module 'express-session' {
  interface SessionData {
    linkedInState?: string;
    facebookState?: string;
    twitterState?: string;
    instagramState?: string;
  }
}