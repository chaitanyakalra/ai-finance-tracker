import express from 'express';
import { redirectToGoogle, handleGoogleCallback } from '../controllers/auth.controller.js';

const router = express.Router();

/**
 * @route   GET /api/auth/google
 * @desc    Redirect user to Google OAuth
 * @access  Public
 */
router.get('/google', redirectToGoogle);

/**
 * @route   GET /api/auth/google/callback
 * @desc    Handle Google OAuth callback
 * @access  Public
 */
router.get('/google/callback', handleGoogleCallback);

export default router;

