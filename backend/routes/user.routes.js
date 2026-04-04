import express from 'express';
import { authenticateToken } from '../middleware/auth.middleware.js';
import { adminOnly } from '../middleware/authorize.middleware.js';
import {
    getCurrentUser,
    getAllUsers,
    getUserById,
    updateUserRole,
    updateUserStatus,
    updateUserProfile,
} from '../controllers/user.controller.js';

const router = express.Router();

// All user routes require authentication
router.use(authenticateToken);

router.get('/me', getCurrentUser);                         // any authenticated user
router.get('/', adminOnly, getAllUsers);                    // admin only
router.get('/:userId', getUserById);                       // admin or self (enforced in controller)
router.put('/:userId/role', adminOnly, updateUserRole);    // admin only
router.put('/:userId/status', adminOnly, updateUserStatus);// admin only
router.put('/:userId/profile', updateUserProfile);         // admin or self (enforced in controller)

export default router;
