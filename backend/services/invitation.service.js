import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
import Grant from '../models/Grant.js';
import User from '../models/User.js';

dotenv.config();

const INVITATION_SECRET = process.env.INVITATION_TOKEN_SECRET || process.env.JWT_SECRET;
const INVITATION_EXPIRY = '7d'; // 7 days

/**
 * Generate invitation token for grant
 * @param {string} grantId - Grant's MongoDB ObjectId
 * @param {string} studentEmail - Student's email
 * @returns {string} - JWT token
 */
export function generateInvitationToken(grantId, studentEmail) {
    return jwt.sign(
        {
            grantId,
            studentEmail,
            type: 'grant_invitation'
        },
        INVITATION_SECRET,
        { expiresIn: INVITATION_EXPIRY }
    );
}

/**
 * Verify invitation token
 * @param {string} token - JWT token
 * @returns {Object} - { valid: boolean, payload: Object, error: string }
 */
export function verifyInvitationToken(token) {
    try {
        const payload = jwt.verify(token, INVITATION_SECRET);
        
        if (payload.type !== 'grant_invitation') {
            return { valid: false, payload: null, error: 'Invalid token type' };
        }

        return { valid: true, payload, error: null };
    } catch (error) {
        if (error.name === 'TokenExpiredError') {
            return { valid: false, payload: null, error: 'Invitation link has expired' };
        }
        return { valid: false, payload: null, error: 'Invalid invitation link' };
    }
}

/**
 * Generate magic link for student invitation
 * @param {string} grantId - Grant's MongoDB ObjectId
 * @param {string} studentEmail - Student's email
 * @returns {string} - Full invitation URL
 */
export function generateInvitationLink(grantId, studentEmail) {
    const token = generateInvitationToken(grantId, studentEmail);
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
    return `${frontendUrl}/accept-grant?token=${token}`;
}

/**
 * Process invitation acceptance
 * @param {string} token - Invitation token
 * @param {string} userId - User's ID from Google OAuth
 * @returns {Promise<Object>} - { success: boolean, grant: Object, user: Object, error: string }
 */
export async function acceptInvitation(token, userId) {
    try {
        // Verify token
        const { valid, payload, error } = verifyInvitationToken(token);
        if (!valid) {
            return { success: false, grant: null, user: null, error };
        }

        // Get grant
        const grant = await Grant.findById(payload.grantId);
        if (!grant) {
            return { success: false, grant: null, user: null, error: 'Grant not found' };
        }

        // Check if grant is still pending
        if (grant.status !== 'pending') {
            return { success: false, grant: null, user: null, error: 'Grant already accepted or cancelled' };
        }

        // Check if grant is expired
        if (grant.isExpired()) {
            grant.status = 'cancelled';
            await grant.save();
            return { success: false, grant: null, user: null, error: 'Grant has expired' };
        }

        // Get or create user
        let user = await User.findOne({ id: userId });
        if (!user) {
            return { success: false, grant: null, user: null, error: 'User not found. Please log in first.' };
        }

        // Verify email matches
        if (user.email.toLowerCase() !== payload.studentEmail.toLowerCase()) {
            return { 
                success: false, 
                grant: null, 
                user: null, 
                error: 'Email mismatch. Please log in with the email that received the invitation.' 
            };
        }

        // Activate grant
        grant.studentId = user._id;
        grant.status = 'active';
        grant.invitationAcceptedAt = new Date();
        await grant.save();

        // Update user flags
        user.isStudent = true;
        user.hasReceivedGrant = true;
        await user.save();

        return { success: true, grant, user, error: null };
    } catch (error) {
        console.error('Accept invitation error:', error);
        return { success: false, grant: null, user: null, error: error.message };
    }
}

export default {
    generateInvitationToken,
    verifyInvitationToken,
    generateInvitationLink,
    acceptInvitation
};
