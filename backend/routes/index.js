import express from 'express';
import expenseRoutes from './expense.routes.js';
import aiRoutes from './ai.routes.js';

const router = express.Router();

router.get('/', (req, res) => {
  res.json({ message: "FinanceGuard AI Backend" });
});

router.use('/expenses', expenseRoutes);
router.use('/ai', aiRoutes);

export default router;