import { google } from 'googleapis';
import { findOrCreateUser } from '../services/auth.service.js';
import { generateTokens } from '../services/token.service.js';
import dotenv from 'dotenv';

dotenv.config();

const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;
const FRONTEND_URL = process.env.FRONTEND_URL;
const BACKEND_URL = process.env.BACKEND_URL;

const oauth2Client = new google.auth.OAuth2(
  GOOGLE_CLIENT_ID,
  GOOGLE_CLIENT_SECRET,
  `${BACKEND_URL}/api/auth/google/callback`
);

/**
 * Redirect to Google OAuth URL
 * GET /auth/google
 */
export async function redirectToGoogle(req, res) {
  try {
    if (!GOOGLE_CLIENT_ID || !GOOGLE_CLIENT_SECRET) {
      return res.status(500).json({
        error: 'Google OAuth not configured. Please set GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET'
      });
    }

    // Generate Google OAuth URL with scopes
    const scopes = [
      'https://www.googleapis.com/auth/userinfo.email',
      'https://www.googleapis.com/auth/userinfo.profile'
    ];

    const authUrl = oauth2Client.generateAuthUrl({
      access_type: 'offline',
      scope: scopes,
      prompt: 'consent'
    });

    // Redirect user to Google
    res.redirect(authUrl);
  } catch (error) {
    console.error('Error in redirectToGoogle:', error);
    res.status(500).json({ error: 'Failed to initiate Google OAuth' });
  }
}

/**
 * Handle Google OAuth callback
 * GET /auth/google/callback
 */
export async function handleGoogleCallback(req, res) {
  try {
    const { code } = req.query;

    if (!code) {
      return res.redirect(`${FRONTEND_URL}/login?error=no_code`);
    }

    if (!GOOGLE_CLIENT_ID || !GOOGLE_CLIENT_SECRET) {
      return res.redirect(`${FRONTEND_URL}/login?error=oauth_not_configured`);
    }

    // Exchange code for tokens
    const { tokens } = await oauth2Client.getToken(code);
    oauth2Client.setCredentials(tokens);

    // Get user profile from Google using OAuth2 API
    const oauth2 = google.oauth2({
      auth: oauth2Client,
      version: 'v2'
    });

    const { data } = await oauth2.userinfo.get();
    
    const googleProfile = {
      id: data.id,
      email: data.email,
      name: data.name,
      picture: data.picture
    };

    // Find or create user
    console.log('🔐 Auth Controller: Finding or creating user...');
    const user = await findOrCreateUser(googleProfile);
    console.log('🔐 Auth Controller: User found/created:', {
      userId: user.id,
      email: googleProfile.email,
      name: googleProfile.name
    });

    // Generate JWT tokens
    console.log('🔐 Auth Controller: Generating JWT tokens for userId:', user.id);
    const { accessToken, refreshToken } = await generateTokens(user.id);
    console.log('🔐 Auth Controller: Tokens generated:', {
      accessTokenLength: accessToken?.length,
      refreshTokenLength: refreshToken?.length,
      accessTokenPreview: accessToken ? `${accessToken.substring(0, 20)}...` : 'null'
    });

    // Redirect to frontend with tokens
    const redirectUrl = new URL(`${FRONTEND_URL}/auth/callback`);
    redirectUrl.searchParams.set('accessToken', accessToken);
    redirectUrl.searchParams.set('refreshToken', refreshToken);
    redirectUrl.searchParams.set('userId', user.id);

    console.log('🔐 Auth Controller: Redirecting to frontend:', redirectUrl.toString());
    res.redirect(redirectUrl.toString());
  } catch (error) {
    console.error('Error in handleGoogleCallback:', error);
    res.redirect(`${FRONTEND_URL}/login?error=authentication_failed`);
  }
}
