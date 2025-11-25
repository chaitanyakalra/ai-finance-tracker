import express from 'express';
import { authenticateToken } from '../middleware/auth.middleware.js';
import { setUserRole } from '../controllers/user.controller.js';

const router = express.Router();

// Set user role (requires authentication)
router.post('/set-role', authenticateToken, setUserRole);

export default router;
