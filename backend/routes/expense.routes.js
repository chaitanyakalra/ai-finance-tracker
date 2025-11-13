import express from 'express';
import * as expenseController from '../controllers/expense.controller.js';

const router = express.Router();

router.post('/', expenseController.createExpense);
router.get('/', expenseController.getAllExpenses);
router.get('/recent', expenseController.getRecentExpenses);
router.get('/stats', expenseController.getExpenseStats);

export default router;