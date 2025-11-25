import express from 'express';
import * as sharedExpenseController from '../controllers/sharedExpense.controller.js';
import { authenticateToken } from '../middleware/auth.middleware.js';

const router = express.Router();

// All shared expense routes require JWT authentication
router.post('/', authenticateToken, sharedExpenseController.createSharedExpense);
router.get('/', authenticateToken, sharedExpenseController.getUserSharedExpenses);
router.get('/amount-owed', authenticateToken, sharedExpenseController.getTotalAmountOwed);
router.get('/amount-owed-by-person', authenticateToken, sharedExpenseController.getAmountOwedByPerson);
router.get('/amount-i-owe-by-person', authenticateToken, sharedExpenseController.getAmountIOweByPerson);
router.get('/group/:groupId', authenticateToken, sharedExpenseController.getGroupExpenses);
router.get('/group/:groupId/balance', authenticateToken, sharedExpenseController.getGroupBalance);
router.get('/:expenseId', authenticateToken, sharedExpenseController.getSharedExpenseById);
router.delete('/:expenseId', authenticateToken, sharedExpenseController.deleteSharedExpense);

export default router;
