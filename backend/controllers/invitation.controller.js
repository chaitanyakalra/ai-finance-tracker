import { verifyInvitationToken } from '../services/invitation.service.js';
import { activateGrant } from '../services/grant.service.js';
import User from '../models/User.js';
import Grant from '../models/Grant.js';

/**
 * Accept grant invitation via magic link
 * GET /api/invitations/accept?token=xxx
 * This is a PUBLIC endpoint - no authentication required
 */
export async function acceptInvitationController(req, res) {
    try {
        const { token } = req.query;

        if (!token) {
            return res.status(400).json({ error: 'Invitation token is required' });
        }

        // Verify token
        const { valid, payload, error } = verifyInvitationToken(token);
        if (!valid) {
            return res.status(400).json({ error });
        }

        // Get grant
        const grant = await Grant.findById(payload.grantId).populate('facultyId', 'name email');
        if (!grant) {
            return res.status(404).json({ error: 'Grant not found' });
        }

        // Check if grant is still pending
        if (grant.status !== 'pending') {
            return res.status(400).json({ error: 'Grant already accepted or cancelled' });
        }

        // Check if grant is expired
        if (new Date() > grant.expiresAt) {
            grant.status = 'cancelled';
            await grant.save();
            return res.status(400).json({ error: 'Grant invitation has expired' });
        }

        // Find user by email from token
        const user = await User.findOne({ email: payload.studentEmail.toLowerCase() });
        
        if (!user) {
            return res.status(400).json({ 
                error: 'Please sign up or log in first with the email that received this invitation',
                studentEmail: payload.studentEmail,
                requiresSignup: true
            });
        }

        // Activate grant
        const result = await activateGrant(grant._id.toString(), user._id.toString());
        if (!result.success) {
            return res.status(400).json({ error: result.error });
        }

        res.json({
            message: 'Grant invitation accepted successfully',
            grant: {
                grantId: result.grant.grantId,
                _id: result.grant._id,
                totalAmount: result.grant.totalAmount,
                remainingAmount: result.grant.remainingAmount,
                status: result.grant.status,
                facultyName: grant.facultyId?.name || 'Faculty'
            }
        });

    } catch (error) {
        console.error('Accept invitation controller error:', error);
        res.status(500).json({ error: 'Failed to accept invitation' });
    }
}

export default {
    acceptInvitationController
};
