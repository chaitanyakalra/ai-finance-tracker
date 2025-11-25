import * as sharedExpenseService from '../services/sharedExpense.service.js';
import { isDBConnected } from '../config/database.js';

function checkDB(res) {
    if (!isDBConnected()) {
        res.status(503).json({
            error: 'Database not available. Please configure MongoDB connection.'
        });
        return false;
    }
    return true;
}

/**
 * Create a shared expense
 */
export async function createSharedExpense(req, res, next) {
    try {
        if (!checkDB(res)) return;

        const userId = req.userId;
        const { groupId, description, amount, category, date, splitType, selectedMembers } = req.body;

        if (!groupId || !amount || !category || !date) {
            return res.status(400).json({
                error: 'Group ID, amount, category, and date are required'
            });
        }

        const sharedExpense = await sharedExpenseService.createSharedExpense({
            groupId,
            createdBy: userId,
            description,
            amount: parseFloat(amount),
            category,
            date,
            splitType: splitType || 'equal',
            selectedMembers: selectedMembers || []
        });

        res.status(201).json(sharedExpense);
    } catch (error) {
        console.error('createSharedExpense error:', error);
        if (error.message === 'Group not found') {
            return res.status(404).json({ error: error.message });
        }
        if (error.message === 'You are not a member of this group') {
            return res.status(403).json({ error: error.message });
        }
        next(error);
    }
}

/**
 * Get all shared expenses for a group
 */
export async function getGroupExpenses(req, res, next) {
    try {
        if (!checkDB(res)) return;

        const userId = req.userId;
        const { groupId } = req.params;

        const expenses = await sharedExpenseService.getGroupExpenses(groupId, userId);

        res.json(expenses);
    } catch (error) {
        console.error('getGroupExpenses error:', error);
        if (error.message === 'Group not found') {
            return res.status(404).json({ error: error.message });
        }
        if (error.message === 'You are not a member of this group') {
            return res.status(403).json({ error: error.message });
        }
        next(error);
    }
}

/**
 * Get all shared expenses for the authenticated user
 */
export async function getUserSharedExpenses(req, res, next) {
    try {
        if (!checkDB(res)) return;

        const userId = req.userId;
        const expenses = await sharedExpenseService.getUserSharedExpenses(userId);

        res.json(expenses);
    } catch (error) {
        console.error('getUserSharedExpenses error:', error);
        next(error);
    }
}

/**
 * Get balance for a user in a group
 */
export async function getGroupBalance(req, res, next) {
    try {
        if (!checkDB(res)) return;

        const userId = req.userId;
        const { groupId } = req.params;

        const balance = await sharedExpenseService.getGroupBalance(groupId, userId);

        res.json(balance);
    } catch (error) {
        console.error('getGroupBalance error:', error);
        if (error.message === 'Group not found') {
            return res.status(404).json({ error: error.message });
        }
        if (error.message === 'You are not a member of this group') {
            return res.status(403).json({ error: error.message });
        }
        next(error);
    }
}

/**
 * Get shared expense by ID
 */
export async function getSharedExpenseById(req, res, next) {
    try {
        if (!checkDB(res)) return;

        const userId = req.userId;
        const { expenseId } = req.params;

        const expense = await sharedExpenseService.getSharedExpenseById(expenseId, userId);

        res.json(expense);
    } catch (error) {
        console.error('getSharedExpenseById error:', error);
        if (error.message === 'Expense not found') {
            return res.status(404).json({ error: error.message });
        }
        if (error.message === 'You are not authorized to view this expense') {
            return res.status(403).json({ error: error.message });
        }
        next(error);
    }
}

/**
 * Delete a shared expense
 */
export async function deleteSharedExpense(req, res, next) {
    try {
        if (!checkDB(res)) return;

        const userId = req.userId;
        const { expenseId } = req.params;

        const result = await sharedExpenseService.deleteSharedExpense(expenseId, userId);

        res.json(result);
    } catch (error) {
        console.error('deleteSharedExpense error:', error);
        if (error.message === 'Expense not found') {
            return res.status(404).json({ error: error.message });
        }
        if (error.message === 'Only the creator can delete this expense') {
            return res.status(403).json({ error: error.message });
        }
        next(error);
    }
}

/**
 * Get total amount owed to user
 */
export async function getTotalAmountOwed(req, res, next) {
    try {
        if (!checkDB(res)) return;
        const userId = req.userId;
        const result = await sharedExpenseService.getTotalAmountOwed(userId);
        res.json(result);
    } catch (error) {
        console.error('getTotalAmountOwed error:', error);
        next(error);
    }
}

/**
 * Get breakdown of who owes money to the user
 */
export async function getAmountOwedByPerson(req, res, next) {
    try {
        if (!checkDB(res)) return;
        const userId = req.userId;
        const result = await sharedExpenseService.getAmountOwedByPerson(userId);
        res.json(result);
    } catch (error) {
        console.error('getAmountOwedByPerson error:', error);
        next(error);
    }
}

/**
 * Get breakdown of who the user owes money to
 */
export async function getAmountIOweByPerson(req, res, next) {
    try {
        if (!checkDB(res)) return;
        const userId = req.userId;
        const result = await sharedExpenseService.getAmountIOweByPerson(userId);
        res.json(result);
    } catch (error) {
        console.error('getAmountIOweByPerson error:', error);
        next(error);
    }
}

