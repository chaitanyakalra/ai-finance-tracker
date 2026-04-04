import express from 'express';
import { authenticateToken } from '../middleware/auth.middleware.js';
import { requireMinimumRole } from '../middleware/authorize.middleware.js';
import {
    getDashboardSummary,
    getCategoryAnalytics,
    getMonthlyTrendsAnalytics,
    getTopSpendingCategories,
    getSpendingInsights,
    getBudgetComparison,
} from '../controllers/dashboard.controller.js';

const router = express.Router();

// All dashboard routes require authentication + at least viewer role
router.use(authenticateToken);
router.use(requireMinimumRole('viewer'));

/**
 * GET /api/dashboard
 * Complete summary: totals, category breakdown, monthly trends, recent activity.
 * Query: startDate, endDate
 */
router.get('/', getDashboardSummary);

/**
 * GET /api/dashboard/categories
 * Category-wise expense breakdown with totals and percentages.
 * Query: startDate, endDate
 */
router.get('/categories', getCategoryAnalytics);

/**
 * GET /api/dashboard/trends
 * Monthly income / expense / net balance trends.
 * Query: months (default 12, max 60)
 */
router.get('/trends', getMonthlyTrendsAnalytics);

/**
 * GET /api/dashboard/top-categories
 * Top N spending categories.
 * Query: limit (default 5, max 20), startDate, endDate
 */
router.get('/top-categories', getTopSpendingCategories);

/**
 * GET /api/dashboard/insights
 * Daily spending insights (average, max, min per day).
 * Query: startDate, endDate
 */
router.get('/insights', getSpendingInsights);

/**
 * GET /api/dashboard/budget-vs-actual
 * Compare actual spending vs. provided budget per category.
 * Query: year, month, budget_<Category>=<amount> (e.g. budget_Food=500)
 */
router.get('/budget-vs-actual', getBudgetComparison);

export default router;
