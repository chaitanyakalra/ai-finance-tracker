import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import mongoose from 'mongoose';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
dotenv.config({ path: join(__dirname, '..', '.env') });

async function main() {
  await mongoose.connect(process.env.MONGO_URL, { dbName: process.env.DB_NAME || 'test' });
  const users = await mongoose.connection.db.collection('users').find(
    {},
    { projection: { name: 1, email: 1, role: 1, status: 1, _id: 0 } }
  ).toArray();
  console.log('\n=== ALL USERS AND THEIR ROLES ===');
  users.forEach(u => {
    console.log(`  ${u.name || '(no name)'} | ${u.email} | role: ${u.role || 'UNDEFINED (legacy)'} | status: ${u.status || 'N/A'}`);
  });
  console.log(`\nTotal users: ${users.length}`);
  process.exit(0);
}

main().catch(err => { console.error(err); process.exit(1); });
