import * as expenseService from '../services/expense.service.js';
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

export async function createExpense(req, res, next) {
  try {
    if (!checkDB(res)) return;
    
    const { date, amount, category, description } = req.body;
    const expense = await expenseService.createExpense({ date, amount, category, description });
    
    res.json(expense);
  } catch (error) {
    next(error);
  }
}

export async function getAllExpenses(req, res, next) {
  try {
    if (!checkDB(res)) return;
    
    const expenses = await expenseService.getAllExpenses();
    res.json(expenses);
  } catch (error) {
    next(error);
  }
}

export async function getRecentExpenses(req, res, next) {
  try {
    if (!checkDB(res)) return;
    
    const expenses = await expenseService.getRecentExpenses();
    res.json(expenses);
  } catch (error) {
    next(error);
  }
}

export async function getExpenseStats(req, res, next) {
  try {
    if (!checkDB(res)) return;
    
    const stats = await expenseService.getExpenseStats();
    res.json(stats);
  } catch (error) {
    next(error);
  }
}