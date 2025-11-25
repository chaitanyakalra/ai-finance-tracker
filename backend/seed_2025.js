import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { v4 as uuidv4 } from 'uuid';
import Expense from './models/Expense.js';

dotenv.config();

const mongoUrl = process.env.MONGO_URL || 'mongodb://localhost:27017';
const dbName = process.env.DB_NAME || 'finance_tracker';
const userId = '5f82cd8e-9c05-4399-be58-42bd8ff52c25';

const categories = ['Food', 'Transport', 'Shopping', 'Bills', 'Entertainment', 'Others'];

function getRandomDate(year, month) {
    const date = new Date(year, month, 1);
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const randomDay = Math.floor(Math.random() * daysInMonth) + 1;
    date.setDate(randomDay);
    return date.toISOString().split('T')[0]; // YYYY-MM-DD
}

function getRandomAmount(min, max) {
    return parseFloat((Math.random() * (max - min) + min).toFixed(2));
}

async function seedData() {
    try {
        let connectionString = mongoUrl;
        if (!connectionString.includes(dbName) && !connectionString.includes('?')) {
            connectionString = connectionString.endsWith('/')
                ? `${connectionString}${dbName}`
                : `${connectionString}/${dbName}`;
        }

        await mongoose.connect(connectionString);
        console.log('Connected to MongoDB');

        const expenses = [];

        // Generate expenses for each month of 2025
        for (let month = 0; month < 12; month++) {
            // Generate 5-10 expenses per month
            const numExpenses = Math.floor(Math.random() * 6) + 5;

            for (let i = 0; i < numExpenses; i++) {
                const category = categories[Math.floor(Math.random() * categories.length)];
                let amountRange = [10, 100];

                // Adjust amount based on category
                if (category === 'Bills') amountRange = [50, 300];
                if (category === 'Shopping') amountRange = [20, 200];
                if (category === 'Food') amountRange = [10, 80];

                expenses.push({
                    id: uuidv4(),
                    userId: userId,
                    date: getRandomDate(2025, month),
                    amount: getRandomAmount(...amountRange),
                    category: category,
                    description: `Mock ${category} expense`,
                });
            }
        }

        await Expense.insertMany(expenses);
        console.log(`Successfully inserted ${expenses.length} mock expenses for 2025.`);

    } catch (error) {
        console.error('Error seeding data:', error);
    } finally {
        await mongoose.disconnect();
        console.log('Disconnected from MongoDB');
        process.exit(0);
    }
}

seedData();
