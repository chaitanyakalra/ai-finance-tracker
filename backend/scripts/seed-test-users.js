import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { v4 as uuidv4 } from 'uuid';
import User from '../models/User.js';
import { signAccessToken } from '../utils/jwt.js';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import fs from 'fs';
import dns from 'dns';

// Set DNS servers to resolve MongoDB SRV records reliably
dns.setServers(['8.8.8.8', '1.1.1.1']);

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: join(__dirname, '../.env') });

const MONGO_URL = process.env.MONGO_URL || process.env.MONGODB_URI;

const users = [
    {
        email: 'admin@test.com',
        name: 'Admin User',
        role: 'admin',
        status: 'active'
    },
    {
        email: 'analyst@test.com',
        name: 'Analyst User',
        role: 'analyst',
        status: 'active'
    },
    {
        email: 'viewer@test.com',
        name: 'Viewer User',
        role: 'viewer',
        status: 'active'
    }
];

async function seed() {
    try {
        await mongoose.connect(MONGO_URL);
        console.log('Connected to MongoDB');

        const results = {};

        for (const userData of users) {
            // Find or create user
            let user = await User.findOne({ email: userData.email });
            
            if (user) {
                user.role = userData.role;
                user.status = userData.status;
                user.name = userData.name;
                await user.save();
                console.log(`Updated user: ${userData.email}`);
            } else {
                user = new User({
                    id: uuidv4(),
                    ...userData
                });
                await user.save();
                console.log(`Created user: ${userData.email}`);
            }

            const token = signAccessToken(user.id);
            results[userData.role] = {
                email: user.email,
                id: user.id,
                token
            };
        }

        console.log('\n--- TEST TOKENS ---');
        console.log(JSON.stringify(results, null, 2));
        console.log('--- END TOKENS ---\n');

        // Save tokens to a temporary file for the test runner to pick up
        fs.writeFileSync(join(__dirname, 'test-tokens.json'), JSON.stringify(results, null, 2));
        console.log('Tokens saved to backend/scripts/test-tokens.json');

        process.exit(0);
    } catch (err) {
        console.error('Seeding error:', err);
        process.exit(1);
    }
}

seed();
