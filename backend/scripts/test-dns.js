import dns from 'dns';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
dotenv.config({ path: join(__dirname, '..', '.env') });

async function testConnection() {
  const mongoUrl = process.env.MONGO_URL;
  console.log('Testing connection to:', mongoUrl);
  
  // Try default DNS first
  console.log('--- Phase 1: Default DNS ---');
  try {
    await mongoose.connect(mongoUrl, { serverSelectionTimeoutMS: 5000 });
    console.log('✅ Connected with default DNS!');
    await mongoose.disconnect();
  } catch (err) {
    console.log('❌ Default DNS failed:', err.message);
    
    // Phase 2: Force Google DNS
    console.log('\n--- Phase 2: Forcing Google DNS (8.8.8.8) ---');
    try {
      dns.setServers(['8.8.8.8', '8.8.4.4']);
      console.log('DNS servers changed to 8.8.8.8');
      
      // We need to re-import or use a fresh connect?
      // Mongoose/Mongodb uses the global dns module resolution.
      await mongoose.connect(mongoUrl, { serverSelectionTimeoutMS: 5000 });
      console.log('✅ Connected with Google DNS!');
      await mongoose.disconnect();
    } catch (err2) {
      console.log('❌ Google DNS also failed:', err2.message);
    }
  }
  process.exit();
}

testConnection();
