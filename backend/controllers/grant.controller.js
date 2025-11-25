import { createGrant, getUserGrants, getGrantById, cancelGrant, getStudentActiveGrant } from '../services/grant.service.js';
import { generateInvitationLink } from '../services/invitation.service.js';
import { sendGrantInvitation } from '../services/email.service.js';
import User from '../models/User.js';
import Grant from '../models/Grant.js';

/**
 * Create a new grant and send invitation
 * POST /api/grants/create
 */
export async function createGrantController(req, res) {
    try {
        const facultyUserId = req.userId; // From auth middleware
        const { studentEmail, amount } = req.body;

        // Validation
        if (!studentEmail || !amount) {
            return res.status(400).json({ error: 'Student email and amount are required' });
        }

        if (amount <= 0) {
            return res.status(400).json({ error: 'Amount must be greater than 0' });
        }

        // Get faculty user
        const faculty = await User.findOne({ id: facultyUserId });
        if (!faculty) {
            return res.status(404).json({ error: 'Faculty not found' });
        }

        // Create grant
        const result = await createGrant(faculty._id, studentEmail, amount);
        if (!result.success) {
            return res.status(400).json({ error: result.error });
        }

        const grant = result.grant;

        // Generate invitation link
        const invitationLink = generateInvitationLink(grant._id.toString(), studentEmail);

        // Update grant with invitation token
        grant.invitationToken = invitationLink.split('token=')[1];
        grant.invitationSentAt = new Date();
        await grant.save();

        // Send invitation email
        const emailResult = await sendGrantInvitation({
            studentEmail,
            facultyName: faculty.name || faculty.email,
            grantAmount: amount,
            invitationLink
        });

        if (!emailResult.success) {
            console.error('Failed to send invitation email:', emailResult.error);
            // Don't fail the request, just log the error
        }

        res.status(201).json({
            message: 'Grant created and invitation sent successfully',
            grant: {
                grantId: grant.grantId,
                _id: grant._id,
                studentEmail: grant.studentEmail,
                totalAmount: grant.totalAmount,
                status: grant.status,
                invitationLink: emailResult.success ? null : invitationLink // Only return link if email failed
            }
        });

    } catch (error) {
        console.error('Create grant controller error:', error);
        res.status(500).json({ error: 'Failed to create grant' });
    }
}

/**
 * Get grants for authenticated user
 * GET /api/grants/my-grants
 */
export async function getMyGrantsController(req, res) {
    try {
        const userId = req.userId;

        // Get user
        const user = await User.findOne({ id: userId });
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        // Determine role based on user flags
        let role = null;
        
        if (user.isTeacher || user.hasAwardedGrant) {
            role = 'faculty';
        } else if (user.isStudent || user.hasReceivedGrant) {
            role = 'student';
        }
        // If neither flag is set, role remains null (first-time user)

        // Get grants only if user has a role
        let grants = [];
        if (role) {
            const result = await getUserGrants(user._id, role);
            if (result.success) {
                grants = result.grants;
            }
        }

        res.json({
            role, // Will be null for first-time users
            grants
        });

    } catch (error) {
        console.error('Get my grants controller error:', error);
        res.status(500).json({ error: 'Failed to get grants' });
    }
}

/**
 * Get grant details by ID
 * GET /api/grants/:grantId
 */
export async function getGrantDetailsController(req, res) {
    try {
        const userId = req.userId;
        const { grantId } = req.params;

        // Get user
        const user = await User.findOne({ id: userId });
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        // Get grant
        const result = await getGrantById(grantId);
        if (!result.success) {
            return res.status(404).json({ error: result.error });
        }

        const grant = result.grant;

        // Verify user has access to this grant
        const isFaculty = grant.facultyId._id.toString() === user._id.toString();
        const isStudent = grant.studentId && grant.studentId._id.toString() === user._id.toString();

        if (!isFaculty && !isStudent) {
            return res.status(403).json({ error: 'Unauthorized access to this grant' });
        }

        res.json({ grant });

    } catch (error) {
        console.error('Get grant details controller error:', error);
        res.status(500).json({ error: 'Failed to get grant details' });
    }
}

/**
 * Cancel a grant (faculty only)
 * PATCH /api/grants/:grantId/cancel
 */
export async function cancelGrantController(req, res) {
    try {
        const userId = req.userId;
        const { grantId } = req.params;

        // Get user
        const user = await User.findOne({ id: userId });
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        // Cancel grant
        const result = await cancelGrant(grantId, user._id.toString());
        if (!result.success) {
            return res.status(400).json({ error: result.error });
        }

        res.json({ message: 'Grant cancelled successfully' });

    } catch (error) {
        console.error('Cancel grant controller error:', error);
        res.status(500).json({ error: 'Failed to cancel grant' });
    }
}

/**
 * Get student's active grant
 * GET /api/grants/active
 */
export async function getActiveGrantController(req, res) {
    try {
        const userId = req.userId;

        // Get user
        const user = await User.findOne({ id: userId });
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        // Get active grant
        const result = await getStudentActiveGrant(user._id);
        if (!result.success) {
            return res.status(404).json({ error: result.error });
        }

        res.json({ grant: result.grant });

    } catch (error) {
        console.error('Get active grant controller error:', error);
        res.status(500).json({ error: 'Failed to get active grant' });
    }
}

export default {
    createGrantController,
    getMyGrantsController,
    getGrantDetailsController,
    cancelGrantController,
    getActiveGrantController
};
