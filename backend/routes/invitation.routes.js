import express from 'express';
import { acceptInvitationController } from '../controllers/invitation.controller.js';

const router = express.Router();

// Accept invitation (public endpoint - uses token for authentication)
router.get('/accept', acceptInvitationController);

export default router;
