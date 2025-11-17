import { signAccessToken, signRefreshToken } from '../utils/jwt.js';
import { storeRefreshToken } from './auth.service.js';

/**
 * Generate access and refresh tokens for user
 * @param {string} userId - User ID
 * @returns {Promise<object>} Object containing accessToken and refreshToken
 */
export async function generateTokens(userId) {
  // Sign tokens
  const accessToken = signAccessToken(userId);
  const refreshToken = signRefreshToken(userId);

  // Store refresh token in database
  await storeRefreshToken(userId, refreshToken);

  return {
    accessToken,
    refreshToken
  };
}

