import { v4 as uuidv4 } from 'uuid';

export const SAMPLE_EXPENSES = [
  { id: uuidv4(), date: "2025-10-12", amount: 1200, category: "Food", description: "Groceries" },
  { id: uuidv4(), date: "2025-10-11", amount: 500, category: "Transport", description: "Uber" },
  { id: uuidv4(), date: "2025-10-10", amount: 3500, category: "Shopping", description: "Clothes" },
  { id: uuidv4(), date: "2025-10-09", amount: 2000, category: "Entertainment", description: "Movie night" },
  { id: uuidv4(), date: "2025-10-08", amount: 800, category: "Food", description: "Restaurant" },
  { id: uuidv4(), date: "2025-10-07", amount: 5000, category: "Bills", description: "Electricity" },
  { id: uuidv4(), date: "2025-10-06", amount: 1500, category: "Food", description: "Groceries" },
  { id: uuidv4(), date: "2025-10-05", amount: 600, category: "Transport", description: "Petrol" }
];