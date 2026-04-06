import mongoose from 'mongoose';
import dns from 'dns';
import dotenv from 'dotenv';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
dotenv.config({ path: join(__dirname, '..', '.env') });

const UserSchema = new mongoose.Schema({
    id: String,
    email: String,
    role: String
});
const User = mongoose.model('User', UserSchema);

async function fixUserRole() {
  const mongoUrl = process.env.MONGO_URL;
  const email = 'chaitanyakalra7@gmail.com';
  
  try {
    dns.setServers(['8.8.8.8', '1.1.1.1']);
    await mongoose.connect(mongoUrl);
    console.log('Connected to MongoDB');
    
    const user = await User.findOne({ email });
    if (!user) {
        console.log(`User ${email} not found`);
    } else {
        console.log(`Found user: ${user.email} with current role: ${user.role}`);
        user.role = 'admin'; // Elevate to admin to enable all features
        await user.save();
        console.log(`✅ Successfully updated role to 'admin' for ${email}`);
    }
    await mongoose.disconnect();
  } catch (err) {
    console.log('Error:', err.message);
  }
  process.exit();
}

fixUserRole();
