import express from 'express';
import { authenticateToken } from '../middleware/auth.middleware.js';
import { 
    uploadMiddleware, 
    uploadBill, 
    getBillAnalysis, 
    getUserBills, 
    deleteBill,
    approveBill,
    rejectBill,
    getGrantBills
} from '../controllers/bill.controller.js';

const router = express.Router();

// Upload bills (requires authentication)
router.post('/upload', authenticateToken, uploadMiddleware, uploadBill);

// Get user's bills (requires authentication)
router.get('/list', authenticateToken, getUserBills);

// Get bills for a specific grant (faculty only) - MUST come before /:billId
router.get('/grant/:grantId', authenticateToken, getGrantBills);

// Get bill analysis (requires authentication) - specific path before /:billId
router.get('/analysis/:billId', authenticateToken, getBillAnalysis);

// Approve a bill (faculty only) - specific path before /:billId
router.patch('/:billId/approve', authenticateToken, approveBill);

// Reject a bill (faculty only) - specific path before /:billId
router.patch('/:billId/reject', authenticateToken, rejectBill);

// Delete a bill (requires authentication) - generic /:billId route comes LAST
router.delete('/:billId', authenticateToken, deleteBill);

export default router;
