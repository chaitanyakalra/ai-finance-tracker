import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { v4 as uuidv4 } from 'uuid';
import Expense from '../models/Expense.js';
import User from '../models/User.js';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

import dns from 'dns';
dns.setServers(['8.8.8.8', '1.1.1.1']);

dotenv.config({ path: join(__dirname, '../.env') });
const MONGO_URL = process.env.MONGO_URL || process.env.MONGODB_URI;

async function testModel() {
    try {
        await mongoose.connect(MONGO_URL);
        console.log('Connected to DB');

        const analyst = await User.findOne({ email: 'analyst@test.com' });
        if (!analyst) throw new Error('Analyst user not found');

        const expenseData = {
            id: uuidv4(),
            userId: analyst.id,
            type: 'expense',
            category: 'Transport',
            amount: 50,
            date: new Date(),
            description: 'Direct Model Test'
        };

        const expense = new Expense(expenseData);
        await expense.save();
        console.log('✅ Expense saved successfully');
        
        await Expense.deleteOne({ id: expenseData.id });
        console.log('Cleaned up');
        
        process.exit(0);
    } catch (err) {
        console.error('❌ Model creation failed:');
        console.error(err);
        process.exit(1);
    }
}

testModel();
