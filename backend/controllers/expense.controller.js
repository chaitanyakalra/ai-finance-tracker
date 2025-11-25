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
    
    // Extract userId from JWT token (set by authenticateToken middleware)
    const userId = req.userId;
    
    // Validate userId is present
    if (!userId) {
      console.error('createExpense: userId is missing from request');
      return res.status(401).json({ 
        error: 'User ID not found. Authentication required.' 
      });
    }
    
    console.log('createExpense: Creating expense for userId:', userId);
    
    const { date, amount, category, description } = req.body;
    const expense = await expenseService.createExpense({ userId, date, amount, category, description });
    
    console.log('createExpense: Expense created with userId:', expense.userId);
    
    res.json(expense);
  } catch (error) {
    console.error('createExpense error:', error);
    next(error);
  }
}

export async function getAllExpenses(req, res, next) {
  try {
    if (!checkDB(res)) return;
    
    // Extract userId from JWT token (set by authenticateToken middleware)
    const userId = req.userId;
    
    const expenses = await expenseService.getAllExpenses(userId);
    res.json(expenses);
  } catch (error) {
    next(error);
  }
}

export async function getRecentExpenses(req, res, next) {
  try {
    if (!checkDB(res)) return;
    
    // Extract userId from JWT token (set by authenticateToken middleware)
    const userId = req.userId;
    
    const expenses = await expenseService.getRecentExpenses(userId);
    res.json(expenses);
  } catch (error) {
    next(error);
  }
}

export async function getMonthlyExpense(req, res, next) {
  try {
    if (!checkDB(res)) return;
    
    // Extract userId from JWT token (set by authenticateToken middleware)
    const userId = req.userId;
    
    const expenses = await expenseService.getMonthlyExpense(userId);
    res.json(expenses);
  } catch (error) {
    next(error);
  }
}

export async function getExpenseStats(req, res, next) {
  try {
    if (!checkDB(res)) return;
    
    // Extract userId from JWT token (set by authenticateToken middleware)
    const userId = req.userId;
    
    const stats = await expenseService.getExpenseStats(userId);
    res.json(stats);
  } catch (error) {
    next(error);
  }
}