import express from 'express';
import { authenticateToken } from '../middleware/auth.middleware.js';
import { adminOnly } from '../middleware/authorize.middleware.js';
import { validate } from '../middleware/validate.middleware.js';
import { updateRoleSchema, updateStatusSchema, updateProfileSchema } from '../validators/user.validator.js';
import {
    getCurrentUser,
    getAllUsers,
    getUserById,
    updateUserRole,
    updateUserStatus,
    updateUserProfile,
} from '../controllers/user.controller.js';
import { requestRoleUpgrade, getMyRequests } from '../controllers/roleRequest.controller.js';

const router = express.Router();

// All user routes require authentication
router.use(authenticateToken);

router.get('/me', getCurrentUser);                                                             // any authenticated user
router.get('/', adminOnly, getAllUsers);                                                        // admin only
router.post('/request-role', requestRoleUpgrade);                                              // any authenticated user
router.get('/my-requests', getMyRequests);                                                     // any authenticated user
router.get('/:userId', getUserById);                                                           // admin or self (enforced in controller)
router.put('/:userId/role', adminOnly, validate(updateRoleSchema), updateUserRole);            // admin only
router.put('/:userId/status', adminOnly, validate(updateStatusSchema), updateUserStatus);      // admin only
router.put('/:userId/profile', validate(updateProfileSchema), updateUserProfile);              // admin or self (enforced in controller)

export default router;
