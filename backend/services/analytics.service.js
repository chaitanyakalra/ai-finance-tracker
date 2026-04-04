import Expense from '../models/Expense.js';

export default class AnalyticsService {

    static async getTotalIncome(userId, startDate, endDate) {
        const match = { userId, type: 'income' };
        if (startDate || endDate) {
            match.date = {};
            if (startDate) match.date.$gte = new Date(startDate);
            if (endDate) match.date.$lte = new Date(endDate);
        }
        const [res] = await Expense.aggregate([
            { $match: match },
            { $group: { _id: null, total: { $sum: '$amount' } } },
        ]);
        return res?.total ?? 0;
    }

    static async getTotalExpenses(userId, startDate, endDate) {
        const match = { userId, type: 'expense' };
        if (startDate || endDate) {
            match.date = {};
            if (startDate) match.date.$gte = new Date(startDate);
            if (endDate) match.date.$lte = new Date(endDate);
        }
        const [res] = await Expense.aggregate([
            { $match: match },
            { $group: { _id: null, total: { $sum: '$amount' } } },
        ]);
        return res?.total ?? 0;
    }

    static async getCategoryBreakdown(userId, startDate, endDate) {
        const match = { userId, type: 'expense' };
        if (startDate || endDate) {
            match.date = {};
            if (startDate) match.date.$gte = new Date(startDate);
            if (endDate) match.date.$lte = new Date(endDate);
        }
        const results = await Expense.aggregate([
            { $match: match },
            { $group: { _id: '$category', total: { $sum: '$amount' }, count: { $sum: 1 } } },
            { $sort: { total: -1 } },
        ]);
        const grandTotal = results.reduce((s, r) => s + r.total, 0);
        return results.map(r => ({
            category: r._id,
            total: Math.round(r.total * 100) / 100,
            count: r.count,
            percentage: grandTotal > 0 ? Math.round((r.total / grandTotal) * 10000) / 100 : 0,
        }));
    }

    static async getMonthlyTrends(userId, months = 12) {
        const since = new Date();
        since.setMonth(since.getMonth() - months + 1);
        since.setDate(1); since.setHours(0, 0, 0, 0);

        const results = await Expense.aggregate([
            { $match: { userId, date: { $gte: since } } },
            {
                $group: {
                    _id: { year: { $year: '$date' }, month: { $month: '$date' }, type: '$type' },
                    total: { $sum: '$amount' }, count: { $sum: 1 },
                },
            },
            { $sort: { '_id.year': 1, '_id.month': 1 } },
        ]);

        const map = {};
        for (const r of results) {
            const key = `${r._id.year}-${String(r._id.month).padStart(2, '0')}`;
            if (!map[key]) map[key] = { month: key, income: 0, expenses: 0, netBalance: 0, txCount: 0 };
            if (r._id.type === 'income') map[key].income += r.total;
            else map[key].expenses += r.total;
            map[key].txCount += r.count;
        }
        return Object.values(map).map(m => ({
            ...m,
            income: Math.round(m.income * 100) / 100,
            expenses: Math.round(m.expenses * 100) / 100,
            netBalance: Math.round((m.income - m.expenses) * 100) / 100,
        }));
    }

    static async getRecentActivity(userId, limit = 10) {
        return Expense.find({ userId })
            .sort({ date: -1, created_at: -1 })
            .limit(limit)
            .lean();
    }

    static async getTopCategories(userId, limit = 5, startDate, endDate) {
        const breakdown = await this.getCategoryBreakdown(userId, startDate, endDate);
        return breakdown.slice(0, limit);
    }

    static async getSpendingInsights(userId, startDate, endDate) {
        const match = { userId, type: 'expense' };
        if (startDate || endDate) {
            match.date = {};
            if (startDate) match.date.$gte = new Date(startDate);
            if (endDate) match.date.$lte = new Date(endDate);
        }
        const daily = await Expense.aggregate([
            { $match: match },
            {
                $group: {
                    _id: { $dateToString: { format: '%Y-%m-%d', date: '$date' } },
                    total: { $sum: '$amount' },
                },
            },
        ]);
        if (!daily.length) return { avgDaily: 0, maxDaily: 0, minDaily: 0 };
        const totals = daily.map(d => d.total);
        const avg = totals.reduce((s, t) => s + t, 0) / totals.length;
        return {
            avgDaily: Math.round(avg * 100) / 100,
            maxDaily: Math.round(Math.max(...totals) * 100) / 100,
            minDaily: Math.round(Math.min(...totals) * 100) / 100,
        };
    }

    static async getBudgetVsActual(userId, year, month, budgetData = {}) {
        const start = new Date(year, month - 1, 1);
        const end = new Date(year, month, 0, 23, 59, 59);
        const breakdown = await this.getCategoryBreakdown(userId, start, end);
        return breakdown.map(cat => ({
            category: cat.category,
            actual: cat.total,
            budget: budgetData[cat.category] ?? null,
            variance: budgetData[cat.category] != null ? cat.total - budgetData[cat.category] : null,
        }));
    }
}
