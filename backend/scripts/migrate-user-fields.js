import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import User from '../models/User.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
dotenv.config({ path: join(__dirname, '..', '.env') });

async function migrateUserFields() {
    try {
        // Connect to MongoDB
        const mongoUri = process.env.MONGODB_URI;

        if (!mongoUri) {
            console.error('❌ MONGODB_URI not found in environment variables');
            process.exit(1);
        }

        console.log('🔌 Connecting to MongoDB...');
        await mongoose.connect(mongoUri);
        console.log('✅ Connected to MongoDB');

        // Update all existing users to have the new fields
        const result = await User.updateMany(
            {
                $or: [
                    { isTeacher: { $exists: false } },
                    { isStudent: { $exists: false } },
                    { hasAwardedGrant: { $exists: false } },
                    { hasReceivedGrant: { $exists: false } }
                ]
            },
            {
                $set: {
                    isTeacher: false,
                    isStudent: false,
                    hasAwardedGrant: false,
                    hasReceivedGrant: false
                }
            }
        );

        console.log(`✅ Migration completed!`);
        console.log(`   - Matched: ${result.matchedCount} users`);
        console.log(`   - Modified: ${result.modifiedCount} users`);

        // Display sample of updated users
        const sampleUsers = await User.find().limit(3).select('email isTeacher isStudent hasAwardedGrant hasReceivedGrant');
        console.log('\n📋 Sample users after migration:');
        sampleUsers.forEach(user => {
            console.log(`   - ${user.email}: isTeacher=${user.isTeacher}, isStudent=${user.isStudent}, hasAwardedGrant=${user.hasAwardedGrant}, hasReceivedGrant=${user.hasReceivedGrant}`);
        });

        // Close connection
        await mongoose.connection.close();
        console.log('\n✅ Database connection closed');
        process.exit(0);

    } catch (error) {
        console.error('❌ Migration failed:', error);
        await mongoose.connection.close();
        process.exit(1);
    }
}

// Run migration
migrateUserFields();
