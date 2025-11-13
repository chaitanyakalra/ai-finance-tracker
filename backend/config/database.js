import { MongoClient } from 'mongodb';
import { SAMPLE_EXPENSES } from '../utils/sampleData.js';
import dotenv from 'dotenv';
dotenv.config();

const mongoUrl = process.env.MONGO_URL || 'mongodb://localhost:27017';
const dbName = process.env.DB_NAME || 'finance_tracker';

let client;
let db;

export async function connectDB() {
  try {
    client = new MongoClient(mongoUrl, { serverSelectionTimeoutMS: 5000 });
    await client.connect();
    db = client.db(dbName);
    
    await client.db('admin').command({ ping: 1 });
    console.log(`✅ Connected to MongoDB at ${mongoUrl}`);
    
    // Initialize sample data if needed
    const count = await db.collection('expenses').countDocuments({});
    if (count === 0) {
      const expensesWithTimestamp = SAMPLE_EXPENSES.map(expense => ({
        ...expense,
        created_at: new Date().toISOString()
      }));
      await db.collection('expenses').insertMany(expensesWithTimestamp);
      console.log('✅ Sample expenses loaded');
    } else {
      console.log(`✅ Found ${count} existing expenses in database`);
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
  if (client) {
    await client.close();
    console.log('MongoDB connection closed');
  }
}

export function getDB() {
  if (!db) {
    throw new Error('Database not connected');
  }
  return db;
}

export function isDBConnected() {
  return !!db;
}