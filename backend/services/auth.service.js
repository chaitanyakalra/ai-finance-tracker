import { getDB } from '../config/database.js';
import { v4 as uuidv4 } from 'uuid';

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
  const db = getDB();
  const usersCollection = db.collection('users');

  const { id: googleId, email, name, picture } = googleProfile;

  // Check if user exists by email
  let user = await usersCollection.findOne({ email });

  if (user) {
    // Update Google ID and profile pic if not set
    if (!user.googleId) {
      await usersCollection.updateOne(
        { email },
        { $set: { googleId, profilePic: picture || user.profilePic } }
      );
      user.googleId = googleId;
      user.profilePic = picture || user.profilePic;
    }
    return user;
  }

  // Check if user exists by Google ID
  user = await usersCollection.findOne({ googleId });

  if (user) {
    return user;
  }

  // Create new user
  const newUser = {
    id: uuidv4(),
    googleId,
    email,
    name,
    profilePic: picture || null,
    role: 'user', // default role
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  await usersCollection.insertOne(newUser);
  return newUser;
}

/**
 * Store refresh token in database
 * @param {string} userId - User ID
 * @param {string} refreshToken - Refresh token
 * @returns {Promise<void>}
 */
export async function storeRefreshToken(userId, refreshToken) {
  const db = getDB();
  const refreshTokensCollection = db.collection('refreshTokens');

  // Store refresh token with expiry
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 7); // 7 days

  await refreshTokensCollection.insertOne({
    userId,
    token: refreshToken,
    expiresAt: expiresAt.toISOString(),
    createdAt: new Date().toISOString()
  });
}

/**
 * Remove refresh token from database
 * @param {string} refreshToken - Refresh token to remove
 * @returns {Promise<void>}
 */
export async function removeRefreshToken(refreshToken) {
  const db = getDB();
  const refreshTokensCollection = db.collection('refreshTokens');
  await refreshTokensCollection.deleteOne({ token: refreshToken });
}

/**
 * Verify refresh token exists in database
 * @param {string} refreshToken - Refresh token to verify
 * @returns {Promise<object|null>} Token document or null
 */
export async function verifyRefreshTokenInDB(refreshToken) {
  const db = getDB();
  const refreshTokensCollection = db.collection('refreshTokens');
  
  const tokenDoc = await refreshTokensCollection.findOne({ token: refreshToken });
  
  if (!tokenDoc) {
    return null;
  }

  // Check if token is expired
  if (new Date(tokenDoc.expiresAt) < new Date()) {
    await refreshTokensCollection.deleteOne({ token: refreshToken });
    return null;
  }

  return tokenDoc;
}

