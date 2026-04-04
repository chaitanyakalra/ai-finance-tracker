import { GoogleGenerativeAI } from '@google/generative-ai';
import dotenv from 'dotenv';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
dotenv.config({ path: join(__dirname, '..', '.env') });

async function testGenerate() {
  const apiKey = process.env.GEMINI_API_KEY;
  if(!apiKey) { console.error('No API Key'); return; }
  const genAI = new GoogleGenerativeAI(apiKey);
  
  const models = ['gemini-1.5-flash', 'gemini-1.5-pro', 'gemini-2.0-flash', 'gemini-2.5-flash'];
  
  for (const m of models) {
    console.log(`\n--- Testing ${m} ---`);
    try {
      const model = genAI.getGenerativeModel({ model: m });
      const result = await model.generateContent("Respond 'OK' and nothing else.");
      const response = await result.response;
      console.log(`✅ Success with ${m}:`, response.text());
      console.log(`Use this model name: ${m}`);
      process.exit(0);
    } catch (err) {
      console.error(`❌ Failed ${m}:`, err.message);
    }
  }
}

testGenerate();
