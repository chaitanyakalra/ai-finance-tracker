import express from 'express';
import expenseRoutes from './expense.routes.js';
import aiRoutes from './ai.routes.js';
import authRoutes from './auth.routes.js';
import billRoutes from './bill.routes.js';
import grantRoutes from './grant.routes.js';
import invitationRoutes from './invitation.routes.js';
import userRoutes from './user.routes.js';

const router = express.Router();

router.get('/', (req, res) => {
  res.json({ message: "FinanceGuard AI Backend" });
});

router.use('/expenses', expenseRoutes);
router.use('/ai', aiRoutes);
router.use('/auth', authRoutes);
router.use('/bills', billRoutes);
router.use('/grants', grantRoutes);
router.use('/invitations', invitationRoutes);
router.use('/users', userRoutes);

export default router;