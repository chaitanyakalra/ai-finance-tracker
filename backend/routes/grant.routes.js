import express from 'express';
import { authenticateToken } from '../middleware/auth.middleware.js';
import {
    createGrantController,
    getMyGrantsController,
    getGrantDetailsController,
    cancelGrantController,
    getActiveGrantController
} from '../controllers/grant.controller.js';

const router = express.Router();

// All routes require authentication
router.use(authenticateToken);

// Create grant (faculty)
router.post('/create', createGrantController);

// Get user's grants (faculty or student)
router.get('/my-grants', getMyGrantsController);

// Get active grant (student)
router.get('/active', getActiveGrantController);

// Get grant details
router.get('/:grantId', getGrantDetailsController);

// Cancel grant (faculty)
router.patch('/:grantId/cancel', cancelGrantController);

export default router;
