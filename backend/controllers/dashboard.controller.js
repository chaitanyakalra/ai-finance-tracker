import AnalyticsService from '../services/analytics.service.js';
import { isDBConnected } from '../config/database.js';

function checkDB(res) {
    if (!isDBConnected()) {
        res.status(503).json({ error: 'Service Unavailable', message: 'Database not available.', statusCode: 503 });
        return false;
    }
    return true;
}

/**
 * GET /api/dashboard
 * Returns a complete summary: totals, category breakdown, monthly trends, recent activity.
 */
export async function getDashboardSummary(req, res, next) {
    try {
        if (!checkDB(res)) return;

        const { startDate, endDate } = req.query;
        const userId = req.userId;

        const start = startDate ? new Date(startDate) : new Date(new Date().getFullYear(), 0, 1);
        const end = endDate ? new Date(endDate) : new Date();

        const [totalIncome, totalExpenses, categoryBreakdown, monthlyTrends, recentActivity] =
            await Promise.all([
                AnalyticsService.getTotalIncome(userId, start, end),
                AnalyticsService.getTotalExpenses(userId, start, end),
                AnalyticsService.getCategoryBreakdown(userId, start, end),
                AnalyticsService.getMonthlyTrends(userId),
                AnalyticsService.getRecentActivity(userId),
            ]);

        const netBalance = Math.round((totalIncome - totalExpenses) * 100) / 100;

        return res.json({
            summary: {
                totalIncome: Math.round(totalIncome * 100) / 100,
                totalExpenses: Math.round(totalExpenses * 100) / 100,
                netBalance,
                dateRange: { startDate: start, endDate: end },
            },
            categoryBreakdown,
            monthlyTrends,
            recentActivity,
        });
    } catch (err) {
        next(err);
    }
}

/**
 * GET /api/dashboard/categories
 * Returns expense breakdown by category with totals and percentages.
 */
export async function getCategoryAnalytics(req, res, next) {
    try {
        if (!checkDB(res)) return;

        const { startDate, endDate } = req.query;
        const userId = req.userId;

        const start = startDate ? new Date(startDate) : undefined;
        const end = endDate ? new Date(endDate) : undefined;

        const breakdown = await AnalyticsService.getCategoryBreakdown(userId, start, end);
        return res.json({ categories: breakdown });
    } catch (err) {
        next(err);
    }
}

/**
 * GET /api/dashboard/trends
 * Returns monthly income/expense/net trends over the last N months.
 * Query param: months (default 12)
 */
export async function getMonthlyTrendsAnalytics(req, res, next) {
    try {
        if (!checkDB(res)) return;

        const months = Math.min(parseInt(req.query.months) || 12, 60);
        const trends = await AnalyticsService.getMonthlyTrends(req.userId, months);
        return res.json({ trends });
    } catch (err) {
        next(err);
    }
}

/**
 * GET /api/dashboard/top-categories
 * Returns the top N spending categories.
 * Query param: limit (default 5), startDate, endDate
 */
export async function getTopSpendingCategories(req, res, next) {
    try {
        if (!checkDB(res)) return;

        const { startDate, endDate } = req.query;
        const limit = Math.min(parseInt(req.query.limit) || 5, 20);
        const userId = req.userId;

        const start = startDate ? new Date(startDate) : undefined;
        const end = endDate ? new Date(endDate) : undefined;

        const topCategories = await AnalyticsService.getTopCategories(userId, limit, start, end);
        return res.json({ topCategories });
    } catch (err) {
        next(err);
    }
}

/**
 * GET /api/dashboard/insights
 * Returns daily spending insights (avg, max, min per day).
 * Query param: startDate, endDate
 */
export async function getSpendingInsights(req, res, next) {
    try {
        if (!checkDB(res)) return;

        const { startDate, endDate } = req.query;
        const userId = req.userId;

        const start = startDate ? new Date(startDate) : undefined;
        const end = endDate ? new Date(endDate) : undefined;

        const insights = await AnalyticsService.getSpendingInsights(userId, start, end);
        return res.json({ insights });
    } catch (err) {
        next(err);
    }
}

/**
 * GET /api/dashboard/budget-vs-actual
 * Compares actual spending against provided budget figures per category.
 * Query param: year (default current), month (default current)
 * Body / query: budget object, e.g. { Food: 500, Transport: 200 }
 * The budget values are passed as query parameters prefixed with "budget_":
 *   ?budget_Food=500&budget_Transport=200
 */
export async function getBudgetComparison(req, res, next) {
    try {
        if (!checkDB(res)) return;

        const now = new Date();
        const year = parseInt(req.query.year) || now.getFullYear();
        const month = parseInt(req.query.month) || now.getMonth() + 1;

        // Collect budget_* query params into a budget map
        const budgetData = {};
        for (const [key, value] of Object.entries(req.query)) {
            if (key.startsWith('budget_')) {
                const category = key.slice(7);
                const parsed = parseFloat(value);
                if (!isNaN(parsed)) budgetData[category] = parsed;
            }
        }

        const comparison = await AnalyticsService.getBudgetVsActual(req.userId, year, month, budgetData);
        return res.json({ year, month, budgetComparison: comparison });
    } catch (err) {
        next(err);
    }
}
