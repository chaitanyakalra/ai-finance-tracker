import mongoose from 'mongoose';
import dns from 'dns';
import { SAMPLE_EXPENSES } from '../utils/sampleData.js';
import dotenv from 'dotenv';
import Expense from '../models/Expense.js';

dotenv.config();

const mongoUrl = process.env.MONGO_URL || 'mongodb://localhost:27017';
const dbName = process.env.DB_NAME || 'finance_tracker';


// Set DNS servers to resolve MongoDB SRV records reliably
// This fixes ECONNREFUSED issues on some networks (like Jio/Airtel) 
dns.setServers(['8.8.8.8', '1.1.1.1']);

export async function connectDB() {
  try {
    // Ensure the connection string includes the database name
    let connectionString = mongoUrl;
    if (!connectionString.includes(dbName) && !connectionString.includes('?')) {
      // If it ends with /, append dbName. If not, append /dbName
      connectionString = connectionString.endsWith('/')
        ? `${connectionString}${dbName}`
        : `${connectionString}/${dbName}`;
    }

    await mongoose.connect(connectionString);

    console.log(`✅ Connected to MongoDB at ${connectionString}`);

    // Initialize sample data if needed
    try {
      const count = await Expense.countDocuments();
      if (count === 0) {
        const expensesWithTimestamp = SAMPLE_EXPENSES.map(expense => ({
          ...expense,
          userId: 'demo-user', // Add default userId for sample data
          created_at: new Date().toISOString()
        }));
        await Expense.insertMany(expensesWithTimestamp);
        console.log('✅ Sample expenses loaded');
      } else {
        console.log(`✅ Found ${count} existing expenses in database`);
      }
    } catch (err) {
      console.log('⚠️ Could not check/load sample data:', err.message);
    }

    return true;
  } catch (error) {
    console.warn(`
╔═══════════════════════════════════════════════════════════════╗
║  ⚠️  MongoDB Connection Warning                                ║
╠═══════════════════════════════════════════════════════════════╣
║  MongoDB is not running or not accessible.                    ║
║  Server will start but database features will not work.        ║
║                                                               ║
║  Current connection string: ${mongoUrl.padEnd(35)}║
║  Error: ${error.message.substring(0, 40).padEnd(40)}║
╚═══════════════════════════════════════════════════════════════╝
    `);
    return false;
  }
}

export async function closeDB() {
  await mongoose.disconnect();
  console.log('MongoDB connection closed');
}

export function isDBConnected() {
  return mongoose.connection.readyState === 1;
}