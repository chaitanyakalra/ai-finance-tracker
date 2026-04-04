import { v4 as uuidv4 } from 'uuid';
import User from '../models/User.js';
import RefreshToken from '../models/RefreshToken.js';

/**
 * Find or create user from Google profile
 * @param {object} googleProfile - Google user profile
 * @param {string} googleProfile.id - Google user ID
 * @param {string} googleProfile.email - User email
 * @param {string} googleProfile.name - User name
 * @param {string} googleProfile.picture - User profile picture URL
 * @returns {Promise<object>} User object
 */
export async function findOrCreateUser(googleProfile) {
  const { id: googleId, email, name, picture } = googleProfile;

  // Check if user exists by email
  let user = await User.findOne({ email });

  if (user) {
    // Update Google ID and profile pic if not set
    if (!user.googleId) {
      user.googleId = googleId;
      user.profilePic = picture || user.profilePic;
      await user.save();
    }
    return user;
  }

  // Check if user exists by Google ID
  user = await User.findOne({ googleId });

  if (user) {
    return user;
  }

  // Create new user
  const newUser = await User.create({
    id: uuidv4(),
    googleId,
    email,
    name,
    profilePic: picture || null,
    role: 'viewer',
  });

  return newUser;
}

/**
 * Store refresh token in database
 * @param {string} userId - User ID
 * @param {string} refreshToken - Refresh token
 * @returns {Promise<void>}
 */
export async function storeRefreshToken(userId, refreshToken) {
  // Store refresh token with expiry
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 7); // 7 days

  await RefreshToken.create({
    userId,
    token: refreshToken,
    expiresAt: expiresAt
  });
}

/**
 * Remove refresh token from database
 * @param {string} refreshToken - Refresh token to remove
 * @returns {Promise<void>}
 */
export async function removeRefreshToken(refreshToken) {
  await RefreshToken.deleteOne({ token: refreshToken });
}

/**
 * Verify refresh token exists in database
 * @param {string} refreshToken - Refresh token to verify
 * @returns {Promise<object|null>} Token document or null
 */
export async function verifyRefreshTokenInDB(refreshToken) {
  const tokenDoc = await RefreshToken.findOne({ token: refreshToken });

  if (!tokenDoc) {
    return null;
  }

  // Check if token is expired
  if (new Date(tokenDoc.expiresAt) < new Date()) {
    await RefreshToken.deleteOne({ token: refreshToken });
    return null;
  }

  return tokenDoc;
}




