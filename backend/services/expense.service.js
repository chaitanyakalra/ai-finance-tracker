import { v4 as uuidv4 } from 'uuid';
import { getDB } from '../config/database.js';

export async function createExpense({ userId, date, amount, category, description }) {
  const db = getDB();
  
  // Validate userId is provided
  if (!userId) {
    throw new Error('UserId is required to create an expense');
  }
  
  const expense = {
    id: uuidv4(),
    userId: String(userId), // Ensure userId is stored as string
    date,
    amount: parseFloat(amount),
    category,
    description,
    created_at: new Date().toISOString()
  };
  
  await db.collection('expenses').insertOne(expense);
  return expense;
}

export async function getAllExpenses(userId, limit = 1000) {
  const db = getDB();
  
  // Filter expenses by userId
  const expenses = await db.collection('expenses')
    .find({ userId }, { projection: { _id: 0 } })
    .limit(limit)
    .toArray();
  
  return expenses;
}

export async function getRecentExpenses(userId, limit = 10) {
  const db = getDB();
  
  // Filter expenses by userId
  const expenses = await db.collection('expenses')
    .find({ userId }, { projection: { _id: 0 } })
    .sort({ date: -1 })
    .limit(limit)
    .toArray();
  
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