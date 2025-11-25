import User from '../models/User.js';

/**
 * Set user role (faculty or student)
 * POST /api/users/set-role
 */
export async function setUserRole(req, res) {
    try {
        const userId = req.userId;
        const { role } = req.body;

        if (!role || (role !== 'faculty' && role !== 'student')) {
            return res.status(400).json({ error: 'Valid role (faculty or student) is required' });
        }

        // Get user
        const user = await User.findOne({ id: userId });
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        // Set role flags
        if (role === 'faculty') {
            user.isTeacher = true;
            user.isStudent = false;
        } else {
            user.isStudent = true;
            user.isTeacher = false;
        }

        await user.save();

        res.json({
            message: 'Role set successfully',
            role
        });

    } catch (error) {
        console.error('Set user role error:', error);
        res.status(500).json({ error: 'Failed to set role' });
    }
}

export default {
    setUserRole
};
