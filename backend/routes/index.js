import express from 'express';
import expenseRoutes from './expense.routes.js';
import aiRoutes from './ai.routes.js';
import authRoutes from './auth.routes.js';
import groupRoutes from './group.routes.js';
import sharedExpenseRoutes from './sharedExpense.routes.js';

const router = express.Router();

router.get('/', (req, res) => {
  res.json({ message: "FinanceGuard AI Backend" });
});

router.use('/expenses', expenseRoutes);
router.use('/ai', aiRoutes);
router.use('/auth', authRoutes);
router.use('/groups', groupRoutes);
router.use('/shared-expenses', sharedExpenseRoutes);

export default router;