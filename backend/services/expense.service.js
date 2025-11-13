import { v4 as uuidv4 } from 'uuid';
import { getDB } from '../config/database.js';

export async function createExpense({ date, amount, category, description }) {
  const db = getDB();
  
  const expense = {
    id: uuidv4(),
    date,
    amount: parseFloat(amount),
    category,
    description,
    created_at: new Date().toISOString()
  };
  
  await db.collection('expenses').insertOne(expense);
  return expense;
}

export async function getAllExpenses(limit = 1000) {
  const db = getDB();
  
  const expenses = await db.collection('expenses')
    .find({}, { projection: { _id: 0 } })
    .limit(limit)
    .toArray();
  
  return expenses;
}

export async function getRecentExpenses(limit = 10) {
  const db = getDB();
  
  const expenses = await db.collection('expenses')
    .find({}, { projection: { _id: 0 } })
    .sort({ date: -1 })
    .limit(limit)
    .toArray();
  
  return expenses;
}

export async function getExpenseStats() {
  const expenses = await getAllExpenses();
  
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