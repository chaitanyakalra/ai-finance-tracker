import { GoogleGenerativeAI } from '@google/generative-ai';
import dotenv from 'dotenv';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
dotenv.config({ path: join(__dirname, '..', '.env') });

async function testGenerate() {
  const apiKey = process.env.GEMINI_API_KEY;
  const genAI = new GoogleGenerativeAI(apiKey);
  // Test with gemini-2.0-flash
  const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });
  
  console.log('Testing generation with gemini-2.0-flash...');
  try {
    console.log('\nTesting generation with gemini-1.5-flash...');
    try {
      const model2 = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
      const result2 = await model2.generateContent("Hello.");
      const resp2 = await result2.response;
      console.log('✅ Success with 1.5-flash:', resp2.text());
    } catch (e) {
      console.error('❌ Failed 1.5-flash:', e.message);
    }
  }
}

testGenerate();
