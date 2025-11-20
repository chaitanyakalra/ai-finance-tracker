import express from 'express';
import * as aiController from '../controllers/ai.controller.js';
import { authenticateToken } from '../middleware/auth.middleware.js';

const router = express.Router();

router.post('/chat', authenticateToken, aiController.handleChat);
router.post('/multi-agent', authenticateToken, aiController.handleMultiAgent);
router.get('/behavioral-insight', authenticateToken, aiController.getBehavioralInsight);

export default router;