import express from 'express';
import { authenticateToken } from '../middleware/auth.middleware.js';
import { authorizeRoles, adminOnly } from '../middleware/authorize.middleware.js';
import {
    createExpense,
    getAllExpenses,
    getRecentExpenses,
    getExpenseStats,
    getMonthlyExpense,
    getExpensesByCategory,
    updateExpense,
    deleteExpense,
} from '../controllers/expense.controller.js';

const router = express.Router();

// All expense routes require authentication
router.use(authenticateToken);

const anyRole = authorizeRoles('viewer', 'analyst', 'admin');
const writerRole = authorizeRoles('analyst', 'admin');

router.post('/',                       writerRole,  createExpense);
router.get('/',                        anyRole,     getAllExpenses);
router.get('/recent',                  anyRole,     getRecentExpenses);
router.get('/stats',                   anyRole,     getExpenseStats);
router.get('/monthly',                 anyRole,     getMonthlyExpense);
router.get('/category/:category',      anyRole,     getExpensesByCategory);
router.put('/:id',                     writerRole,  updateExpense);
router.delete('/:id',                  adminOnly,   deleteExpense);

export default router;
