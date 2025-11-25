import { v4 as uuidv4 } from 'uuid';
import Expense from '../models/Expense.js';

export async function createExpense({ userId, date, amount, category, description }) {
  // Validate userId is provided
  if (!userId) {
    throw new Error('UserId is required to create an expense');
  }

  const expenseData = {
    id: uuidv4(),
    userId: String(userId), // Ensure userId is stored as string
    date,
    amount: parseFloat(amount),
    category,
    description,
    // created_at is handled by timestamps in model
  };

  // Create and save the expense
  const expense = await Expense.create(expenseData);

  // Return plain object without mongoose internals if needed, or just the document
  // Previous implementation returned the plain object inserted.
  return expense.toObject ? expense.toObject() : expense;
}

export async function getAllExpenses(userId, limit = 1000) {
  // Filter expenses by userId
  const expenses = await Expense.find({ userId })
    .select('-_id -__v') // Exclude internal fields to match previous behavior
    .limit(limit)
    .lean();

  return expenses;
}

export async function getRecentExpenses(userId, limit = 10) {
  // Filter expenses by userId
  const expenses = await Expense.find({ userId })
    .select('-_id -__v')
    .sort({ date: -1 })
    .limit(limit)
    .lean();

  return expenses;
}

export async function getExpenseStats(userId) {
  // Get expenses filtered by userId
  const expenses = await getAllExpenses(userId);

  const total = expenses.reduce((sum, exp) => sum + exp.amount, 0);

  const byCategory = {};
  expenses.forEach(exp => {
    const cat = exp.category;
    byCategory[cat] = (byCategory[cat] || 0) + exp.amount;
  });

  return {
    total,
    by_category: byCategory,
    count: expenses.length
  };
}

export async function getMonthlyExpense(userId) {
  // Get expenses filtered by userId
  const expenses = await getAllExpenses(userId);

  const monthlyExpenses = expenses.reduce((acc, exp) => {
    const dateObj = new Date(exp.date);
    // Skip invalid dates
    if (isNaN(dateObj.getTime())) return acc;

    const month = dateObj.getMonth();
    const year = dateObj.getFullYear();
    const key = `${year}-${month}`;
    acc[key] = (acc[key] || 0) + exp.amount;
    return acc;
  }, {});

  return monthlyExpenses;
}