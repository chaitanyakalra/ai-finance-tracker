import User from '../models/User.js';
import { getPermissions } from '../config/permissions.js';

const VALID_ROLES = ['viewer', 'analyst', 'admin'];
const VALID_STATUSES = ['active', 'inactive'];

/** GET /me — returns current user + permissions */
export async function getCurrentUser(req, res, next) {
    try {
        const user = await User.findOne({ id: req.user.id })
            .select('id email name role status profilePic lastLogin createdAt')
            .lean();
        if (!user) return res.status(404).json({ error: 'User not found.' });

        // ⚡ DEBUG: Log the raw role from DB
        console.log(`🔍 getCurrentUser: ${user.email} | DB role: '${user.role}' (type: ${typeof user.role})`);

        // Normalize role for legacy users who were created before RBAC was added
        if (!user.role) user.role = 'viewer';

        console.log(`🔍 getCurrentUser: Sending role='${user.role}' to frontend`);

        return res.json({ user, permissions: getPermissions(user.role) });
    } catch (err) {
        next(err);
    }
}

/** GET / — admin only; supports ?role= ?status= ?page= ?limit= */
export async function getAllUsers(req, res, next) {
    try {
        const { role, status, page = 1, limit = 20 } = req.query;
        const filter = {};
        if (role) filter.role = role;
        if (status) filter.status = status;

        const skip = (parseInt(page) - 1) * parseInt(limit);
        const [users, total] = await Promise.all([
            User.find(filter)
                .select('id email name role status lastLogin createdAt')
                .skip(skip)
                .limit(parseInt(limit))
                .lean(),
            User.countDocuments(filter),
        ]);

        return res.json({
            users,
            pagination: { total, page: parseInt(page), limit: parseInt(limit), pages: Math.ceil(total / parseInt(limit)) },
        });
    } catch (err) {
        next(err);
    }
}

/** GET /:userId — admin sees anyone; others only see themselves */
export async function getUserById(req, res, next) {
    try {
        const { userId } = req.params;
        if (req.user.role !== 'admin' && req.user.id !== userId) {
            return res.status(403).json({ error: 'Forbidden. You can only view your own profile.' });
        }
        const user = await User.findOne({ id: userId })
            .select('id email name role status profilePic lastLogin createdAt')
            .lean();
        if (!user) return res.status(404).json({ error: 'User not found.' });
        return res.json({ user, permissions: getPermissions(user.role) });
    } catch (err) {
        next(err);
    }
}

/** PUT /:userId/role — admin only */
export async function updateUserRole(req, res, next) {
    try {
        const { userId } = req.params;
        const { role } = req.body;
        if (!role || !VALID_ROLES.includes(role)) {
            return res.status(400).json({ error: `Invalid role. Must be one of: ${VALID_ROLES.join(', ')}` });
        }
        const user = await User.findOneAndUpdate(
            { id: userId },
            { role },
            { new: true, runValidators: true }
        ).select('id email name role status').lean();
        if (!user) return res.status(404).json({ error: 'User not found.' });
        return res.json({ message: 'Role updated.', user });
    } catch (err) {
        next(err);
    }
}

/** PUT /:userId/status — admin only */
export async function updateUserStatus(req, res, next) {
    try {
        const { userId } = req.params;
        const { status } = req.body;
        if (!status || !VALID_STATUSES.includes(status)) {
            return res.status(400).json({ error: `Invalid status. Must be one of: ${VALID_STATUSES.join(', ')}` });
        }
        const user = await User.findOneAndUpdate(
            { id: userId },
            { status },
            { new: true, runValidators: true }
        ).select('id email name role status').lean();
        if (!user) return res.status(404).json({ error: 'User not found.' });
        return res.json({ message: 'Status updated.', user });
    } catch (err) {
        next(err);
    }
}

/** PUT /:userId/profile — admin or self only */
export async function updateUserProfile(req, res, next) {
    try {
        const { userId } = req.params;
        if (req.user.role !== 'admin' && req.user.id !== userId) {
            return res.status(403).json({ error: 'Forbidden. You can only update your own profile.' });
        }
        const { name, profilePic } = req.body;
        const update = {};
        if (name !== undefined) update.name = name;
        if (profilePic !== undefined) update.profilePic = profilePic;

        const user = await User.findOneAndUpdate(
            { id: userId },
            { $set: update },
            { new: true, runValidators: true }
        ).select('id email name role status profilePic').lean();
        if (!user) return res.status(404).json({ error: 'User not found.' });
        return res.json({ message: 'Profile updated.', user });
    } catch (err) {
        next(err);
    }
}

export default { getCurrentUser, getAllUsers, getUserById, updateUserRole, updateUserStatus, updateUserProfile };
