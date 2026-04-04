import { v4 as uuidv4 } from 'uuid';
import Expense from '../models/Expense.js';
import SharedExpense from '../models/SharedExpense.js';
import { isDBConnected } from '../config/database.js';

const SORTABLE_FIELDS = new Set(['date', 'amount', 'category', 'created_at']);

function checkDB(res) {
    if (!isDBConnected()) {
        res.status(503).json({ error: 'Database not available.' });
        return false;
    }
    return true;
}

/** POST / — create expense (analyst, admin) */
export async function createExpense(req, res, next) {
    try {
        if (!checkDB(res)) return;
        const { type, category, amount, date, description, tags, isRecurring, recurringFrequency, recurringEndDate, notes } = req.body;

        const expense = await Expense.create({
            id: uuidv4(),
            userId: req.userId,
            type, category,
            amount: parseFloat(amount),
            date: new Date(date),
            description, tags, isRecurring, recurringFrequency, recurringEndDate, notes,
        });

        return res.status(201).json(expense);
    } catch (err) { next(err); }
}

/** GET / — list with full filtering, sorting, pagination */
export async function getAllExpenses(req, res, next) {
    try {
        if (!checkDB(res)) return;
        const { startDate, endDate, category, type, minAmount, maxAmount, tags,
            sortBy = 'date', sortOrder = 'desc', page = 1, limit = 20 } = req.query;

        const filter = { userId: req.userId };
        if (startDate || endDate) {
            filter.date = {};
            if (startDate) filter.date.$gte = new Date(startDate);
            if (endDate) filter.date.$lte = new Date(endDate);
        }
        if (category) filter.category = category;
        if (type) filter.type = type;
        if (minAmount || maxAmount) {
            filter.amount = {};
            if (minAmount) filter.amount.$gte = parseFloat(minAmount);
            if (maxAmount) filter.amount.$lte = parseFloat(maxAmount);
        }
        if (tags) filter.tags = { $in: Array.isArray(tags) ? tags : [tags] };

        const sortField = SORTABLE_FIELDS.has(sortBy) ? sortBy : 'date';
        const sort = { [sortField]: sortOrder === 'asc' ? 1 : -1 };
        const skip = (parseInt(page) - 1) * parseInt(limit);

        const [data, total] = await Promise.all([
            Expense.find(filter).sort(sort).skip(skip).limit(parseInt(limit)).lean(),
            Expense.countDocuments(filter),
        ]);

        return res.json({
            data,
            pagination: { total, page: parseInt(page), limit: parseInt(limit), pages: Math.ceil(total / parseInt(limit)) },
            activeFilters: { startDate, endDate, category, type, minAmount, maxAmount, tags, sortBy: sortField, sortOrder },
        });
    } catch (err) { next(err); }
}

/** GET /recent - interlace regular and shared expenses */
export async function getRecentExpenses(req, res, next) {
    try {
        if (!checkDB(res)) return;
        const limit = parseInt(req.query.limit) || 10;

        // Parallel queries
        const [expenses, shared] = await Promise.all([
            Expense.find({ userId: req.userId })
                .sort({ date: -1, created_at: -1 })
                .limit(limit)
                .lean(),
            SharedExpense.find({ createdBy: req.userId })
                .sort({ date: -1, createdAt: -1 })
                .limit(limit)
                .lean()
        ]);

        // Merge and sort
        const merged = [...expenses, ...shared]
            .sort((a, b) => new Date(b.date) - new Date(a.date))
            .slice(0, limit);

        return res.json(merged);
    } catch (err) { next(err); }
}

/** GET /stats — totals + breakdown from all sources */
export async function getExpenseStats(req, res, next) {
    try {
        if (!checkDB(res)) return;

        const now = new Date();
        const currentMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
        const prevMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        const prevMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999);

        // Filter: match regular expenses that are not 'income' (to catch legacy records without a type)
        // AND match shared expenses created by this user
        const personalFilter = { userId: String(req.userId), type: { $ne: 'income' } };
        const incomeFilter = { userId: String(req.userId), type: 'income' };
        const sharedFilter = { createdBy: String(req.userId) };

        const [
            personalTotal, personalCat, personalCur, personalPrev,
            incomeTotal,
            sharedTotal, sharedCat, sharedCur, sharedPrev
        ] = await Promise.all([
            Expense.aggregate([
                { $match: personalFilter },
                { $group: { _id: null, total: { $sum: '$amount' }, count: { $sum: 1 } } }
            ]),
            Expense.aggregate([
                { $match: personalFilter },
                { $group: { _id: '$category', total: { $sum: '$amount' } } }
            ]),
            Expense.aggregate([
                { $match: { ...personalFilter, date: { $gte: currentMonthStart } } },
                { $group: { _id: null, total: { $sum: '$amount' }, count: { $sum: 1 } } }
            ]),
            Expense.aggregate([
                { $match: { ...personalFilter, date: { $gte: prevMonthStart, $lt: currentMonthStart } } },
                { $group: { _id: null, total: { $sum: '$amount' }, count: { $sum: 1 } } }
            ]),
            Expense.aggregate([
                { $match: incomeFilter },
                { $group: { _id: null, total: { $sum: '$amount' } } }
            ]),
            SharedExpense.aggregate([
                { $match: sharedFilter },
                { $group: { _id: null, total: { $sum: '$amount' }, count: { $sum: 1 } } }
            ]),
            SharedExpense.aggregate([
                { $match: sharedFilter },
                { $group: { _id: '$category', total: { $sum: '$amount' } } }
            ]),
            SharedExpense.aggregate([
                { $match: { ...sharedFilter, date: { $gte: currentMonthStart.toISOString().split('T')[0] } } },
                { $group: { _id: null, total: { $sum: '$amount' }, count: { $sum: 1 } } }
            ]),
            SharedExpense.aggregate([
                { $match: { ...sharedFilter, date: { $gte: prevMonthStart.toISOString().split('T')[0], $lt: currentMonthStart.toISOString().split('T')[0] } } },
                { $group: { _id: null, total: { $sum: '$amount' }, count: { $sum: 1 } } }
            ]),
        ]);

        // Merge results
        const total = (personalTotal[0]?.total ?? 0) + (sharedTotal[0]?.total ?? 0);
        const count = (personalTotal[0]?.count ?? 0) + (sharedTotal[0]?.count ?? 0);
        const curTotal = (personalCur[0]?.total ?? 0) + (sharedCur[0]?.total ?? 0);
        const prevTotal = (personalPrev[0]?.total ?? 0) + (sharedPrev[0]?.total ?? 0);
        const curCount = (personalCur[0]?.count ?? 0) + (sharedCur[0]?.count ?? 0);
        const prevCount = (personalPrev[0]?.count ?? 0) + (sharedPrev[0]?.count ?? 0);

        // Combined category map
        const by_category = {};
        const combine = (arr) => {
            for (const cat of arr) {
                const name = cat._id || 'Others';
                by_category[name] = (by_category[name] || 0) + (cat.total || 0);
            }
        };
        combine(personalCat);
        combine(sharedCat);

        // Round values
        for (const k of Object.keys(by_category)) {
            by_category[k] = Math.round(by_category[k] * 100) / 100;
        }

        // Percentage changes
        const totalChange = prevTotal > 0
            ? Math.round(((curTotal - prevTotal) / prevTotal) * 1000) / 10
            : (curTotal > 0 ? 100 : 0);

        const countChange = prevCount > 0
            ? Math.round(((curCount - prevCount) / prevCount) * 1000) / 10
            : (curCount > 0 ? 100 : 0);

        const avgCur = curCount > 0 ? curTotal / curCount : 0;
        const avgPrev = prevCount > 0 ? prevTotal / prevCount : 0;
        const avgChange = avgPrev > 0
            ? Math.round(((avgCur - avgPrev) / avgPrev) * 1000) / 10
            : (avgCur > 0 ? 100 : 0);

        const budgetRatio = prevTotal > 0 ? Math.round((curTotal / prevTotal) * 100) : (curTotal > 0 ? 100 : 0);

        return res.json({
            total: Math.round(total * 100) / 100,
            count,
            by_category,
            currentMonth: { total: Math.round(curTotal * 100) / 100, count: curCount },
            previousMonth: { total: Math.round(prevTotal * 100) / 100, count: prevCount },
            totalChange,
            countChange,
            avgChange,
            budgetRatio,
            totalIncome: incomeTotal[0]?.total ?? 0
        });
    } catch (err) { next(err); }
}
/** GET /monthly — aggregate from both collections by YYYY-MM */
export async function getMonthlyExpense(req, res, next) {
    try {
        if (!checkDB(res)) return;

        const months = parseInt(req.query.months) || 12;
        const since = new Date();
        since.setMonth(since.getMonth() - months + 1);
        since.setDate(1); since.setHours(0, 0, 0, 0);
        const sinceStr = since.toISOString().split('T')[0];

        // Parallel aggregations
        const [personalResults, sharedResults] = await Promise.all([
            // 1. Personal Aggregation
            Expense.aggregate([
                { $match: { userId: req.userId, date: { $gte: since } } },
                {
                    $group: {
                        _id: { year: { $year: '$date' }, month: { $month: '$date' }, type: '$type' },
                        total: { $sum: '$amount' }, count: { $sum: 1 },
                    },
                },
            ]),
            // 2. Shared Aggregation (All shared items are expenses)
            SharedExpense.aggregate([
                { $match: { createdBy: req.userId, date: { $gte: sinceStr } } },
                {
                    $group: {
                        _id: {
                            year: { $year: { $dateFromString: { dateString: '$date' } } },
                            month: { $month: { $dateFromString: { dateString: '$date' } } }
                        },
                        total: { $sum: '$amount' }, count: { $sum: 1 },
                    },
                },
            ])
        ]);

        // Reshape into { "YYYY-MM": { income, expenses, net, count } }
        const byMonth = {};

        const ensureMonth = (y, m) => {
            if (!y || !m) return null;
            const key = `${y}-${String(m).padStart(2, '0')}`;
            if (!byMonth[key]) byMonth[key] = { income: 0, expenses: 0, net: 0, count: 0 };
            return key;
        };

        // Merge personal
        for (const r of personalResults) {
            const key = ensureMonth(r._id.year, r._id.month);
            if (!key) continue;
            if (r._id.type === 'income') byMonth[key].income += r.total;
            else byMonth[key].expenses += r.total;
            byMonth[key].count += r.count;
        }

        // Merge shared
        for (const r of sharedResults) {
            const key = ensureMonth(r._id.year, r._id.month);
            if (!key) continue;
            byMonth[key].expenses += r.total;
            byMonth[key].count += r.count;
        }

        // Final calculations
        for (const k of Object.keys(byMonth)) {
            byMonth[k].expenses = Math.round(byMonth[k].expenses * 100) / 100;
            byMonth[k].income = Math.round(byMonth[k].income * 100) / 100;
            byMonth[k].net = Math.round((byMonth[k].income - byMonth[k].expenses) * 100) / 100;
        }

        return res.json(byMonth);
    } catch (err) { next(err); }
}

/** PUT /:id — update (analyst own / admin any) */
export async function updateExpense(req, res, next) {
    try {
        const { isDBConnected } = await import('../config/database.js');
        if (!isDBConnected()) return res.status(503).json({ error: 'Database not available.' });
        const { default: Expense } = await import('../models/Expense.js');

        const { id } = req.params;
        const ALLOWED = ['type', 'category', 'amount', 'date', 'description', 'tags', 'isRecurring',
            'recurringFrequency', 'recurringEndDate', 'notes'];

        const filterQuery = req.user.role === 'admin'
            ? { id }
            : { id, userId: req.userId };

        const updates = {};
        for (const key of ALLOWED) {
            if (req.body[key] !== undefined) updates[key] = req.body[key];
        }
        if (updates.amount) updates.amount = parseFloat(updates.amount);
        if (updates.date) updates.date = new Date(updates.date);

        const expense = await Expense.findOneAndUpdate(filterQuery, { $set: updates }, { new: true, runValidators: true }).lean();
        if (!expense) return res.status(404).json({ error: 'Expense not found or access denied.' });

        return res.json(expense);
    } catch (err) { next(err); }
}

/** DELETE /:id — admin only (enforced at route level too) */
export async function deleteExpense(req, res, next) {
    try {
        const { isDBConnected } = await import('../config/database.js');
        if (!isDBConnected()) return res.status(503).json({ error: 'Database not available.' });
        const { default: Expense } = await import('../models/Expense.js');

        const expense = await Expense.findOneAndDelete({ id: req.params.id, userId: req.userId }).lean();
        if (!expense) return res.status(404).json({ error: 'Expense not found.' });
        return res.json({ message: 'Expense deleted.', id: req.params.id });
    } catch (err) { next(err); }
}

/** GET /category/:category — filter by category + optional date range */
export async function getExpensesByCategory(req, res, next) {
    try {
        const { isDBConnected } = await import('../config/database.js');
        if (!isDBConnected()) return res.status(503).json({ error: 'Database not available.' });
        const { default: Expense } = await import('../models/Expense.js');

        const { category } = req.params;
        const { startDate, endDate, page = 1, limit = 20 } = req.query;
        const filter = { userId: req.userId, category };
        if (startDate || endDate) {
            filter.date = {};
            if (startDate) filter.date.$gte = new Date(startDate);
            if (endDate) filter.date.$lte = new Date(endDate);
        }
        const skip = (parseInt(page) - 1) * parseInt(limit);
        const [data, total] = await Promise.all([
            Expense.find(filter).sort({ date: -1 }).skip(skip).limit(parseInt(limit)).lean(),
            Expense.countDocuments(filter),
        ]);
        return res.json({ data, pagination: { total, page: parseInt(page), limit: parseInt(limit), pages: Math.ceil(total / parseInt(limit)) } });
    } catch (err) { next(err); }
}
