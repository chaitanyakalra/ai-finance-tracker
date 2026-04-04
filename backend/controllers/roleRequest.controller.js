import { v4 as uuidv4 } from 'uuid';
import RoleRequest from '../models/RoleRequest.js';
import User from '../models/User.js';

const REQUESTABLE_ROLES = ['analyst', 'admin'];
const VALID_STATUSES = ['PENDING', 'APPROVED', 'REJECTED'];

/** POST /api/users/request-role — authenticated user submits a role upgrade request */
export async function requestRoleUpgrade(req, res, next) {
    try {
        const userId = req.user.id;
        const { requestedRole, reason } = req.body;

        if (!requestedRole || !REQUESTABLE_ROLES.includes(requestedRole)) {
            return res.status(400).json({
                error: `requestedRole must be one of: ${REQUESTABLE_ROLES.join(', ')}`,
            });
        }
        if (!reason || reason.trim().length < 20) {
            return res.status(400).json({ error: 'reason must be at least 20 characters.' });
        }

        // Check for existing PENDING request
        const existing = await RoleRequest.findOne({ userId, status: 'PENDING' }).lean();
        if (existing) {
            return res.status(409).json({ error: 'You already have a pending role request.' });
        }

        const roleRequest = new RoleRequest({
            id: uuidv4(),
            userId,
            requestedRole,
            reason: reason.trim(),
        });
        await roleRequest.save();

        return res.status(201).json({
            message: 'Role request submitted successfully.',
            roleRequest: {
                id: roleRequest.id,
                requestedRole: roleRequest.requestedRole,
                status: roleRequest.status,
                createdAt: roleRequest.createdAt,
            },
        });
    } catch (err) {
        next(err);
    }
}

/** GET /api/users/my-requests — returns the authenticated user's role requests */
export async function getMyRequests(req, res, next) {
    try {
        const userId = req.user.id;
        const requests = await RoleRequest.find({ userId })
            .sort({ createdAt: -1 })
            .lean();
        return res.json({ requests });
    } catch (err) {
        next(err);
    }
}

/** GET /api/admin/role-requests — admin only; lists requests with optional status filter + pagination */
export async function getAdminRoleRequests(req, res, next) {
    try {
        const { status } = req.query;
        const page = Math.max(1, parseInt(req.query.page, 10) || 1);
        const limit = Math.min(100, Math.max(1, parseInt(req.query.limit, 10) || 20));
        const filter = {};
        if (status && VALID_STATUSES.includes(status)) filter.status = status;

        const skip = (page - 1) * limit;
        const [requests, total] = await Promise.all([
            RoleRequest.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
            RoleRequest.countDocuments(filter),
        ]);

        // Enrich with user info
        const userIds = [...new Set(requests.map((r) => r.userId))];
        const users = await User.find({ id: { $in: userIds } })
            .select('id name email role')
            .lean();
        const userMap = Object.fromEntries(users.map((u) => [u.id, u]));

        const enriched = requests.map((r) => ({
            ...r,
            user: userMap[r.userId] || null,
        }));

        return res.json({
            requests: enriched,
            pagination: {
                total,
                page: parseInt(page),
                limit: parseInt(limit),
                pages: Math.ceil(total / parseInt(limit)),
            },
        });
    } catch (err) {
        next(err);
    }
}

/** GET /api/admin/role-requests/:id — admin only; get single request */
export async function getAdminRoleRequestById(req, res, next) {
    try {
        const request = await RoleRequest.findOne({ id: req.params.id }).lean();
        if (!request) return res.status(404).json({ error: 'Role request not found.' });

        const user = await User.findOne({ id: request.userId })
            .select('id name email role')
            .lean();
        return res.json({ request: { ...request, user } });
    } catch (err) {
        next(err);
    }
}

/** POST /api/admin/role-requests/:id/approve — admin approves request and upgrades user role */
export async function approveRoleRequest(req, res, next) {
    try {
        const { id } = req.params;
        const { adminNotes } = req.body;

        const roleRequest = await RoleRequest.findOne({ id });
        if (!roleRequest) return res.status(404).json({ error: 'Role request not found.' });
        if (roleRequest.status !== 'PENDING') {
            return res.status(400).json({ error: 'Only PENDING requests can be approved.' });
        }

        // Update role request
        roleRequest.status = 'APPROVED';
        roleRequest.adminNotes = adminNotes || null;
        roleRequest.reviewedBy = req.user.id;
        roleRequest.reviewedAt = new Date();
        await roleRequest.save();

        // Update user role
        await User.findOneAndUpdate(
            { id: roleRequest.userId },
            { role: roleRequest.requestedRole },
            { runValidators: true }
        );

        return res.json({
            message: 'Role request approved and user role updated.',
            roleRequest: {
                id: roleRequest.id,
                status: roleRequest.status,
                requestedRole: roleRequest.requestedRole,
                reviewedAt: roleRequest.reviewedAt,
            },
        });
    } catch (err) {
        next(err);
    }
}

/** POST /api/admin/role-requests/:id/reject — admin rejects request */
export async function rejectRoleRequest(req, res, next) {
    try {
        const { id } = req.params;
        const { reason } = req.body;

        if (!reason || reason.trim().length < 5) {
            return res.status(400).json({ error: 'A rejection reason (min 5 chars) is required.' });
        }

        const roleRequest = await RoleRequest.findOne({ id });
        if (!roleRequest) return res.status(404).json({ error: 'Role request not found.' });
        if (roleRequest.status !== 'PENDING') {
            return res.status(400).json({ error: 'Only PENDING requests can be rejected.' });
        }

        roleRequest.status = 'REJECTED';
        roleRequest.rejectionReason = reason.trim();
        roleRequest.reviewedBy = req.user.id;
        roleRequest.reviewedAt = new Date();
        await roleRequest.save();

        return res.json({
            message: 'Role request rejected.',
            roleRequest: {
                id: roleRequest.id,
                status: roleRequest.status,
                rejectionReason: roleRequest.rejectionReason,
                reviewedAt: roleRequest.reviewedAt,
            },
        });
    } catch (err) {
        next(err);
    }
}

export default {
    requestRoleUpgrade,
    getMyRequests,
    getAdminRoleRequests,
    getAdminRoleRequestById,
    approveRoleRequest,
    rejectRoleRequest,
};
