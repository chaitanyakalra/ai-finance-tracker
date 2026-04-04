import { v4 as uuidv4 } from 'uuid';
import Expense from '../models/Expense.js';
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

/** GET /recent */
export async function getRecentExpenses(req, res, next) {
    try {
        if (!checkDB(res)) return;
        const limit = parseInt(req.query.limit) || 10;
        const expenses = await Expense.find({ userId: req.userId })
            .sort({ date: -1, created_at: -1 })
            .limit(limit)
            .lean();
        return res.json(expenses);
    } catch (err) { next(err); }
}

/** GET /stats — totals + breakdown */
export async function getExpenseStats(req, res, next) {
    try {
        if (!checkDB(res)) return;
        const [incomeResult, expenseResult] = await Promise.all([
            Expense.aggregate([
                { $match: { userId: req.userId, type: 'income' } },
                { $group: { _id: null, total: { $sum: '$amount' }, count: { $sum: 1 } } },
            ]),
            Expense.aggregate([
                { $match: { userId: req.userId, type: 'expense' } },
                { $group: { _id: null, total: { $sum: '$amount' }, count: { $sum: 1 } } },
            ]),
        ]);
        const totalIncome = incomeResult[0]?.total ?? 0;
        const totalExpenses = expenseResult[0]?.total ?? 0;
        return res.json({
            totalIncome, totalExpenses, netBalance: totalIncome - totalExpenses,
            incomeCount: incomeResult[0]?.count ?? 0,
            expenseCount: expenseResult[0]?.count ?? 0,
        });
    } catch (err) { next(err); }
}
/** GET /monthly — aggregate by YYYY-MM */
export async function getMonthlyExpense(req, res, next) {
    try {
        const { isDBConnected } = await import('../config/database.js');
        if (!isDBConnected()) return res.status(503).json({ error: 'Database not available.' });

        const months = parseInt(req.query.months) || 12;
        const since = new Date();
        since.setMonth(since.getMonth() - months + 1);
        since.setDate(1); since.setHours(0, 0, 0, 0);

        const { default: Expense } = await import('../models/Expense.js');
        const results = await Expense.aggregate([
            { $match: { userId: req.userId, date: { $gte: since } } },
            {
                $group: {
                    _id: { year: { $year: '$date' }, month: { $month: '$date' }, type: '$type' },
                    total: { $sum: '$amount' }, count: { $sum: 1 },
                },
            },
            { $sort: { '_id.year': 1, '_id.month': 1 } },
        ]);

        // Reshape into { "YYYY-MM": { income, expense, net, count } }
        const byMonth = {};
        for (const r of results) {
            const key = `${r._id.year}-${String(r._id.month).padStart(2, '0')}`;
            if (!byMonth[key]) byMonth[key] = { income: 0, expenses: 0, net: 0, count: 0 };
            if (r._id.type === 'income') byMonth[key].income += r.total;
            else byMonth[key].expenses += r.total;
            byMonth[key].count += r.count;
        }
        for (const k of Object.keys(byMonth)) {
            byMonth[k].net = byMonth[k].income - byMonth[k].expenses;
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
