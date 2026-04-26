import { OAuth2Client } from 'google-auth-library';
import dotenv from 'dotenv';

dotenv.config();

const client = new OAuth2Client(process.env.GOOGLE_OAUTH_CLIENT_ID);

/**
 * Verify Google ID token and return user details
 * @param {string} idToken - The ID token from Google
 * @returns {Promise<Object>} User details (email, name, picture, googleId)
 */
export async function verifyGoogleToken(idToken) {
  try {
    const ticket = await client.verifyIdToken({
      idToken,
      audience: process.env.GOOGLE_OAUTH_CLIENT_ID,
    });
    
    const payload = ticket.getPayload();
    if (!payload) {
      throw new Error('Invalid Google token payload');
    }

    return {
      email: payload.email,
      name: payload.name,
      picture: payload.picture,
      googleId: payload.sub, // This is the unique Google ID
    };
  } catch (error) {
    console.error('Google token verification error:', error);
    throw new Error('Failed to verify Google token');
  }
}
