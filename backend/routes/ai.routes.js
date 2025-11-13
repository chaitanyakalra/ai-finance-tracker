import express from 'express';
import * as aiController from '../controllers/ai.controller.js';

const router = express.Router();

router.post('/chat', aiController.handleChat);
router.post('/multi-agent', aiController.handleMultiAgent);
router.get('/behavioral-insight', aiController.getBehavioralInsight);

export default router;