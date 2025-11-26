import Grant from '../models/Grant.js';
import User from '../models/User.js';
import BillUpload from '../models/BillUpload.js';

/**
 * Create a new grant
 * @param {string} facultyId - Faculty's MongoDB ObjectId
 * @param {string} studentEmail - Student's email
 * @param {number} totalAmount - Grant amount
 * @returns {Promise<Object>} - { success: boolean, grant: Object, error: string }
 */
export async function createGrant(facultyId, studentEmail, totalAmount) {
    try {
        // Verify faculty exists
        const faculty = await User.findById(facultyId);
        if (!faculty) {
            return { success: false, grant: null, error: 'Faculty not found' };
        }

        // Check if student already exists
        let student = await User.findOne({ email: studentEmail });

        // Cancel any existing pending grants for this email
        await Grant.updateMany(
            { studentEmail: studentEmail.toLowerCase().trim(), status: 'pending' },
            { status: 'cancelled' }
        );

        // Mark any existing active grants as completed (superseded)
        if (student) {
            await Grant.updateMany(
                { studentId: student._id, status: 'active' },
                { status: 'completed' }
            );
        }

        // Create grant
        const grant = new Grant({
            facultyId,
            studentId: student ? student._id : null,
            studentEmail: studentEmail.toLowerCase().trim(),
            totalAmount,
            remainingAmount: totalAmount,
            status: 'pending'
        });

        await grant.save();

        // Update faculty's hasAwardedGrant flag
        if (!faculty.hasAwardedGrant) {
            faculty.hasAwardedGrant = true;
            faculty.isTeacher = true;
            await faculty.save();
        }

        return { success: true, grant, error: null };
    } catch (error) {
        console.error('Create grant error:', error);
        return { success: false, grant: null, error: error.message };
    }
}

/**
 * Get grants for a user (faculty or student)
 * @param {string} userId - User's MongoDB ObjectId
 * @param {string} role - 'faculty' or 'student'
 * @returns {Promise<Object>} - { success: boolean, grants: Array, error: string }
 */
export async function getUserGrants(userId, role) {
    try {
        let grants;

        if (role === 'faculty') {
            grants = await Grant.find({ facultyId: userId })
                .populate('studentId', 'name email profilePic')
                .sort({ createdAt: -1 });
        } else if (role === 'student') {
            grants = await Grant.find({ studentId: userId })
                .populate('facultyId', 'name email profilePic')
                .sort({ createdAt: -1 });
        } else {
            return { success: false, grants: [], error: 'Invalid role' };
        }

        return { success: true, grants, error: null };
    } catch (error) {
        console.error('Get user grants error:', error);
        return { success: false, grants: [], error: error.message };
    }
}

/**
 * Get grant by ID
 * @param {string} grantId - Grant's MongoDB ObjectId
 * @returns {Promise<Object>} - { success: boolean, grant: Object, error: string }
 */
export async function getGrantById(grantId) {
    try {
        const grant = await Grant.findById(grantId)
            .populate('facultyId', 'name email profilePic')
            .populate('studentId', 'name email profilePic');

        if (!grant) {
            return { success: false, grant: null, error: 'Grant not found' };
        }

        return { success: true, grant, error: null };
    } catch (error) {
        console.error('Get grant by ID error:', error);
        return { success: false, grant: null, error: error.message };
    }
}

/**
 * Activate grant when student accepts invitation
 * @param {string} grantId - Grant's MongoDB ObjectId
 * @param {string} studentId - Student's MongoDB ObjectId
 * @returns {Promise<Object>} - { success: boolean, grant: Object, error: string }
 */
export async function activateGrant(grantId, studentId) {
    try {
        const grant = await Grant.findById(grantId);

        if (!grant) {
            return { success: false, grant: null, error: 'Grant not found' };
        }

        if (grant.status !== 'pending') {
            return { success: false, grant: null, error: 'Grant is not pending' };
        }

        // Update grant
        grant.studentId = studentId;
        grant.status = 'active';
        grant.invitationAcceptedAt = new Date();
        await grant.save();

        // Update student's flags
        const student = await User.findById(studentId);
        if (student) {
            student.isStudent = true;
            student.hasReceivedGrant = true;
            await student.save();
        }

        return { success: true, grant, error: null };
    } catch (error) {
        console.error('Activate grant error:', error);
        return { success: false, grant: null, error: error.message };
    }
}

/**
 * Update grant balance after bill approval
 * @param {string} grantId - Grant's MongoDB ObjectId
 * @param {number} amount - Amount to deduct
 * @returns {Promise<Object>} - { success: boolean, grant: Object, error: string }
 */
export async function deductGrantBalance(grantId, amount) {
    try {
        const grant = await Grant.findById(grantId);

        if (!grant) {
            return { success: false, grant: null, error: 'Grant not found' };
        }

        if (!grant.hasSufficientBalance(amount)) {
            return { success: false, grant: null, error: 'Insufficient grant balance' };
        }

        grant.usedAmount += amount;
        grant.remainingAmount = grant.totalAmount - grant.usedAmount;

        // Mark as completed if fully used
        if (grant.remainingAmount === 0) {
            grant.status = 'completed';
        }

        await grant.save();

        return { success: true, grant, error: null };
    } catch (error) {
        console.error('Deduct grant balance error:', error);
        return { success: false, grant: null, error: error.message };
    }
}

/**
 * Cancel a grant
 * @param {string} grantId - Grant's MongoDB ObjectId
 * @param {string} facultyId - Faculty's MongoDB ObjectId (for authorization)
 * @returns {Promise<Object>} - { success: boolean, error: string }
 */
export async function cancelGrant(grantId, facultyId) {
    try {
        const grant = await Grant.findById(grantId);

        if (!grant) {
            return { success: false, error: 'Grant not found' };
        }

        // Verify faculty owns this grant
        if (grant.facultyId.toString() !== facultyId) {
            return { success: false, error: 'Unauthorized' };
        }

        grant.status = 'cancelled';
        await grant.save();

        return { success: true, error: null };
    } catch (error) {
        console.error('Cancel grant error:', error);
        return { success: false, error: error.message };
    }
}

/**
 * Get student's active grant
 * @param {string} studentId - Student's MongoDB ObjectId
 * @returns {Promise<Object>} - { success: boolean, grant: Object, error: string }
 */
export async function getStudentActiveGrant(studentId) {
    try {
        const grant = await Grant.findOne({
            studentId,
            status: 'active',
            expiresAt: { $gt: new Date() }
        })
        .sort({ createdAt: -1 }) // Get the most recent active grant
        .populate('facultyId', 'name email profilePic');

        if (!grant) {
            return { success: false, grant: null, error: 'No active grant found' };
        }

        return { success: true, grant, error: null };
    } catch (error) {
        console.error('Get student active grant error:', error);
        return { success: false, grant: null, error: error.message };
    }
}

export default {
    createGrant,
    getUserGrants,
    getGrantById,
    activateGrant,
    deductGrantBalance,
    cancelGrant,
    getStudentActiveGrant
};
