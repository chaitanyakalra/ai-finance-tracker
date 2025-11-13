// import express from 'express';
// import cors from 'cors';
// import dotenv from 'dotenv';
// import { MongoClient } from 'mongodb';
// import { GoogleGenerativeAI } from '@google/generative-ai';
// import { v4 as uuidv4 } from 'uuid';
// import { fileURLToPath } from 'url';
// import { dirname, join } from 'path';
// import { readFileSync } from 'fs';

// const __filename = fileURLToPath(import.meta.url);
// const __dirname = dirname(__filename);

// // Load environment variables
// dotenv.config({ path: join(__dirname, '.env') });

// const app = express();
// const PORT = process.env.PORT || 8000;

// // Middleware - CORS configuration
// const corsOptions = {
//   credentials: true,
//   origin: function (origin, callback) {
//     // Allow requests with no origin (like mobile apps or curl requests)
//     if (!origin) return callback(null, true);
    
//     // Allow localhost on any port
//     if (origin.match(/^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/)) {
//       return callback(null, true);
//     }
    
//     // Check configured origins
//     const allowedOrigins = process.env.CORS_ORIGINS 
//       ? process.env.CORS_ORIGINS.split(',').map(o => o.trim())
//       : ['http://localhost:3000', 'http://localhost:3001'];
    
//     if (allowedOrigins.includes(origin) || allowedOrigins.includes('*')) {
//       return callback(null, true);
//     }
    
//     callback(null, true); // Allow all for development
//   },
//   methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
//   allowedHeaders: ['Content-Type', 'Authorization']
// };

// app.use(cors(corsOptions));
// app.use(express.json());

// // MongoDB connection
// const mongoUrl = process.env.MONGO_URL || 'mongodb://localhost:27017';
// const dbName = process.env.DB_NAME || 'finance_tracker';
// let client;
// let db;

// // Configure Gemini API
// const geminiApiKey = process.env.GEMINI_API_KEY;
// let genAI;
// if (geminiApiKey) {
//   genAI = new GoogleGenerativeAI(geminiApiKey);
// }

// // Sample data for demo
// const SAMPLE_EXPENSES = [
//   { id: uuidv4(), date: "2025-10-12", amount: 1200, category: "Food", description: "Groceries" },
//   { id: uuidv4(), date: "2025-10-11", amount: 500, category: "Transport", description: "Uber" },
//   { id: uuidv4(), date: "2025-10-10", amount: 3500, category: "Shopping", description: "Clothes" },
//   { id: uuidv4(), date: "2025-10-09", amount: 2000, category: "Entertainment", description: "Movie night" },
//   { id: uuidv4(), date: "2025-10-08", amount: 800, category: "Food", description: "Restaurant" },
//   { id: uuidv4(), date: "2025-10-07", amount: 5000, category: "Bills", description: "Electricity" },
//   { id: uuidv4(), date: "2025-10-06", amount: 1500, category: "Food", description: "Groceries" },
//   { id: uuidv4(), date: "2025-10-05", amount: 600, category: "Transport", description: "Petrol" }
// ];

// // Initialize MongoDB connection (optional - server will start even if MongoDB fails)
// async function connectDB() {
//   try {
//     client = new MongoClient(mongoUrl, { serverSelectionTimeoutMS: 5000 });
//     await client.connect();
//     db = client.db(dbName);
    
//     // Test connection
//     await client.db('admin').command({ ping: 1 });
//     console.log(`✅ Connected to MongoDB at ${mongoUrl}`);
    
//     // Check if expenses collection is empty
//     const count = await db.collection('expenses').countDocuments({});
//     if (count === 0) {
//       // Add sample expenses
//       const expensesWithTimestamp = SAMPLE_EXPENSES.map(expense => ({
//         ...expense,
//         created_at: new Date().toISOString()
//       }));
//       await db.collection('expenses').insertMany(expensesWithTimestamp);
//       console.log('Sample expenses loaded');
//     } else {
//       console.log(`Found ${count} existing expenses in database`);
//     }
//     return true;
//   } catch (error) {
//     console.warn(`
// ╔═══════════════════════════════════════════════════════════════╗
// ║  ⚠️  MongoDB Connection Warning                                ║
// ╠═══════════════════════════════════════════════════════════════╣
// ║                                                               ║
// ║  MongoDB is not running or not accessible.                    ║
// ║  Server will start but database features will not work.        ║
// ║                                                               ║
// ║  SOLUTION OPTIONS:                                            ║
// ║                                                               ║
// ║  Option 1: Use MongoDB Atlas (Cloud - Recommended)            ║
// ║    1. Sign up at: https://www.mongodb.com/cloud/atlas        ║
// ║    2. Create a free cluster                                   ║
// ║    3. Create backend-js/.env file with:                        ║
// ║       MONGO_URL=mongodb+srv://user:pass@cluster.mongodb.net/  ║
// ║       DB_NAME=finance_tracker                                 ║
// ║                                                               ║
// ║  Option 2: Install MongoDB Locally                            ║
// ║    1. Download from: https://www.mongodb.com/try/download     ║
// ║    2. Install and start MongoDB service                       ║
// ║    3. Create backend-js/.env file with:                        ║
// ║       MONGO_URL=mongodb://localhost:27017                     ║
// ║       DB_NAME=finance_tracker                                 ║
// ║                                                               ║
// ║  Current connection string: ${mongoUrl}                       ║
// ║  Error: ${error.message.substring(0, 40)}...                 ║
// ║                                                               ║
// ╚═══════════════════════════════════════════════════════════════╝
//     `);
//     return false;
//   }
// }

// // Helper function to check if DB is available
// function checkDB(res) {
//   if (!db) {
//     res.status(503).json({ 
//       error: 'Database not available. Please configure MongoDB connection.' 
//     });
//     return false;
//   }
//   return true;
// }

// // Routes
// const apiRouter = express.Router();

// apiRouter.get('/', (req, res) => {
//   res.json({ message: "FinanceGuard AI Backend" });
// });

// // Create expense
// apiRouter.post('/expenses', async (req, res) => {
//   try {
//     if (!checkDB(res)) return;
    
//     const { date, amount, category, description } = req.body;
    
//     const expense = {
//       id: uuidv4(),
//       date,
//       amount: parseFloat(amount),
//       category,
//       description,
//       created_at: new Date().toISOString()
//     };
    
//     await db.collection('expenses').insertOne(expense);
//     res.json(expense);
//   } catch (error) {
//     console.error('Error creating expense:', error);
//     res.status(500).json({ error: error.message });
//   }
// });

// // Get all expenses
// apiRouter.get('/expenses', async (req, res) => {
//   try {
//     if (!checkDB(res)) return;
    
//     const expenses = await db.collection('expenses')
//       .find({}, { projection: { _id: 0 } })
//       .limit(1000)
//       .toArray();
    
//     res.json(expenses);
//   } catch (error) {
//     console.error('Error fetching expenses:', error);
//     res.status(500).json({ error: error.message });
//   }
// });

// // Get recent expenses
// apiRouter.get('/expenses/recent', async (req, res) => {
//   try {
//     if (!checkDB(res)) return;
    
//     const expenses = await db.collection('expenses')
//       .find({}, { projection: { _id: 0 } })
//       .sort({ date: -1 })
//       .limit(10)
//       .toArray();
    
//     res.json(expenses);
//   } catch (error) {
//     console.error('Error fetching recent expenses:', error);
//     res.status(500).json({ error: error.message });
//   }
// });

// // Get expense stats
// apiRouter.get('/expenses/stats', async (req, res) => {
//   try {
//     if (!checkDB(res)) return;
    
//     const expenses = await db.collection('expenses')
//       .find({}, { projection: { _id: 0 } })
//       .limit(1000)
//       .toArray();
    
//     const total = expenses.reduce((sum, exp) => sum + exp.amount, 0);
    
//     // Calculate by category
//     const byCategory = {};
//     expenses.forEach(exp => {
//       const cat = exp.category;
//       byCategory[cat] = (byCategory[cat] || 0) + exp.amount;
//     });
    
//     res.json({
//       total,
//       by_category: byCategory,
//       count: expenses.length
//     });
//   } catch (error) {
//     console.error('Error fetching stats:', error);
//     res.status(500).json({ error: error.message });
//   }
// });

// // AI Chat
// apiRouter.post('/ai/chat', async (req, res) => {
//   try {
//     if (!genAI) {
//       return res.status(500).json({ error: 'Gemini API key not configured' });
//     }
    
//     if (!checkDB(res)) return;
    
//     const { question } = req.body;
    
//     // Get expenses data
//     const expenses = await db.collection('expenses')
//       .find({}, { projection: { _id: 0 } })
//       .limit(1000)
//       .toArray();
    
//     // Prepare context for AI
//     let expenseSummary = `Total expenses: ${expenses.length}\n`;
//     const byCategory = {};
//     expenses.forEach(exp => {
//       const cat = exp.category;
//       byCategory[cat] = (byCategory[cat] || 0) + exp.amount;
//     });
    
//     expenseSummary += "\nSpending by category:\n";
//     Object.entries(byCategory).forEach(([cat, amt]) => {
//       expenseSummary += `- ${cat}: ₹${amt.toFixed(2)}\n`;
//     });
    
//     expenseSummary += "\nRecent transactions:\n";
//     expenses.slice(-5).forEach(exp => {
//       expenseSummary += `- ${exp.date}: ${exp.category} - ₹${exp.amount} (${exp.description})\n`;
//     });
    
//     // Use Gemini API
//     const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash-exp' });
//     const prompt = `
// You are a personal finance assistant. Based on the following expense data, answer the user's question.

// ${expenseSummary}

// User Question: ${question}

// Provide a helpful, concise response with specific insights and recommendations.
// `;
    
//     const result = await model.generateContent(prompt);
//     const response = await result.response;
//     const text = response.text();
    
//     res.json({
//       response: text,
//       context: expenseSummary
//     });
//   } catch (error) {
//     console.error('AI Chat error:', error);
//     res.status(500).json({ error: error.message });
//   }
// });

// // Multi-Agent conversation
// apiRouter.post('/ai/multi-agent', async (req, res) => {
//   try {
//     if (!genAI) {
//       return res.status(500).json({ error: 'Gemini API key not configured' });
//     }
    
//     if (!checkDB(res)) return;
    
//     const { question } = req.body;
    
//     const agents = [
//       {
//         name: "Budget Analyst",
//         role: "Analyzes spending patterns and budget implications",
//         emoji: "📊"
//       },
//       {
//         name: "Investment Advisor",
//         role: "Provides investment and financial planning advice",
//         emoji: "💰"
//       },
//       {
//         name: "Risk Assessor",
//         role: "Evaluates financial risks and provides warnings",
//         emoji: "🛡️"
//       }
//     ];
    
//     // Get expenses data for context
//     const expenses = await db.collection('expenses')
//       .find({}, { projection: { _id: 0 } })
//       .limit(1000)
//       .toArray();
//     const totalExpenses = expenses.reduce((sum, exp) => sum + exp.amount, 0);
    
//     const contextInfo = `Current monthly spending: ₹${totalExpenses.toFixed(2)}`;
//     const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash-exp' });
    
//     const responses = [];
    
//     for (const agent of agents) {
//       const prompt = `
// You are the ${agent.name}, a specialist in ${agent.role}.

// User's financial context: ${contextInfo}

// User's question: ${question}

// Provide your expert analysis from your specialized perspective. Be concise (3-4 sentences max).
// Focus on your area of expertise.
// `;
      
//       const result = await model.generateContent(prompt);
//       const response = await result.response;
//       const text = response.text();
      
//       responses.push({
//         agent: agent.name,
//         emoji: agent.emoji,
//         response: text
//       });
//     }
    
//     // Generate final summary
//     const summaryPrompt = `
// Based on these expert opinions:

// ${responses.map(r => `${r.agent}: ${r.response}`).join('\n')}

// Provide a brief final recommendation (2-3 sentences) for the user's question: ${question}
// `;
    
//     const summaryResult = await model.generateContent(summaryPrompt);
//     const summaryResponse = await summaryResult.response;
//     const summaryText = summaryResponse.text();
    
//     res.json({
//       agents: responses,
//       summary: summaryText
//     });
//   } catch (error) {
//     console.error('Multi-agent error:', error);
//     res.status(500).json({ error: error.message });
//   }
// });

// // Behavioral insight
// apiRouter.get('/ai/behavioral-insight', async (req, res) => {
//   try {
//     if (!genAI) {
//       return res.status(500).json({ error: 'Gemini API key not configured' });
//     }
    
//     if (!checkDB(res)) return;
    
//     const expenses = await db.collection('expenses')
//       .find({}, { projection: { _id: 0 } })
//       .limit(1000)
//       .toArray();
    
//     if (expenses.length === 0) {
//       return res.json({ insight: "No data available yet", stats: {} });
//     }
    
//     // Analyze patterns
//     const byCategory = {};
//     expenses.forEach(exp => {
//       const cat = exp.category;
//       byCategory[cat] = (byCategory[cat] || 0) + exp.amount;
//     });
    
//     const total = Object.values(byCategory).reduce((sum, amt) => sum + amt, 0);
    
//     // Find top spending category
//     const topCategory = Object.entries(byCategory)
//       .sort((a, b) => b[1] - a[1])[0];
    
//     // Use Gemini for insight
//     const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash-exp' });
//     const prompt = `
// Analyze this spending pattern and provide ONE key behavioral finance insight:

// Total spending: ₹${total.toFixed(2)}
// Spending by category: ${JSON.stringify(byCategory, null, 2)}

// Provide:
// 1. A short insight title (max 10 words)
// 2. A brief explanation (2-3 sentences)
// 3. One actionable recommendation

// Format your response as:
// INSIGHT: [title]
// EXPLANATION: [explanation]
// RECOMMENDATION: [recommendation]
// `;
    
//     const result = await model.generateContent(prompt);
//     const response = await result.response;
//     const insightText = response.text();
    
//     res.json({
//       insight: insightText,
//       stats: {
//         total,
//         top_category: topCategory[0],
//         top_amount: topCategory[1],
//         by_category: byCategory
//       }
//     });
//   } catch (error) {
//     console.error('Behavioral insight error:', error);
//     res.status(500).json({ error: error.message });
//   }
// });

// // Mount API router
// app.use('/api', apiRouter);

// // Start server
// async function startServer() {
//   // Try to connect to MongoDB, but don't fail if it's not available
//   await connectDB();
  
//   // Start server regardless of MongoDB connection status
//   app.listen(PORT, () => {
//     console.log(`🚀 Server running on http://localhost:${PORT}`);
//     console.log(`📡 API available at http://localhost:${PORT}/api`);
//     if (!db) {
//       console.log(`⚠️  Note: MongoDB not connected. Database features will not work.`);
//     }
//   });
// }

// // Graceful shutdown
// process.on('SIGTERM', async () => {
//   console.log('SIGTERM signal received: closing HTTP server');
//   if (client) {
//     await client.close();
//     console.log('MongoDB connection closed');
//   }
//   process.exit(0);
// });

// process.on('SIGINT', async () => {
//   console.log('SIGINT signal received: closing HTTP server');
//   if (client) {
//     await client.close();
//     console.log('MongoDB connection closed');
//   }
//   process.exit(0);
// });

// startServer();

import express from 'express';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import corsConfig from './config/cors.js';
import { connectDB, closeDB } from './config/database.js';
import routes from './routes/index.js';
import errorHandler from './middleware/errorHandler.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
dotenv.config({ path: join(__dirname, '.env') });

// Load environment variables

dotenv.config();
const app = express();
const PORT = process.env.PORT || 8000;

// Middleware
app.use(corsConfig);
app.use(express.json());

// Routes
app.use('/api', routes);

// Error handling
app.use(errorHandler);

// Start server
async function startServer() {
  await connectDB();
  
  app.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
    console.log(`📡 API available at http://localhost:${PORT}/api`);
  });
}

// Graceful shutdown
const shutdown = async (signal) => {
  console.log(`${signal} signal received: closing HTTP server`);
  await closeDB();
  process.exit(0);
};

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));

startServer();

