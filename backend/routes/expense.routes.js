import express from 'express';
import * as expenseController from '../controllers/expense.controller.js';
import { authenticateToken } from '../middleware/auth.middleware.js';

const router = express.Router();

// All expense routes require JWT authentication
router.post('/', authenticateToken, expenseController.createExpense);
router.get('/', authenticateToken, expenseController.getAllExpenses);
router.get('/recent', authenticateToken, expenseController.getRecentExpenses);
router.get('/stats', authenticateToken, expenseController.getExpenseStats);
router.get('/monthly', authenticateToken, expenseController.getMonthlyExpense);

export default router;