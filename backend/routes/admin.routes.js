import express from 'express';
import { authenticateToken } from '../middleware/auth.middleware.js';
import { adminOnly } from '../middleware/authorize.middleware.js';
import {
    getAdminRoleRequests,
    getAdminRoleRequestById,
    approveRoleRequest,
    rejectRoleRequest,
} from '../controllers/roleRequest.controller.js';

const router = express.Router();

// All admin routes require authentication and admin role
router.use(authenticateToken);
router.use(adminOnly);

/**
 * GET /api/admin/role-requests
 * List all role requests with optional status filter and pagination.
 * Query: status (PENDING|APPROVED|REJECTED), page, limit
 */
router.get('/role-requests', getAdminRoleRequests);

/**
 * GET /api/admin/role-requests/:id
 * Get a single role request by its ID.
 */
router.get('/role-requests/:id', getAdminRoleRequestById);

/**
 * POST /api/admin/role-requests/:id/approve
 * Approve a pending role request and upgrade the user's role.
 * Body: { adminNotes? }
 */
router.post('/role-requests/:id/approve', approveRoleRequest);

/**
 * POST /api/admin/role-requests/:id/reject
 * Reject a pending role request.
 * Body: { reason } (required, min 5 chars)
 */
router.post('/role-requests/:id/reject', rejectRoleRequest);

export default router;
