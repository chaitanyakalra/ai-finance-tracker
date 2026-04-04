import { GoogleGenerativeAI } from '@google/generative-ai';

const geminiApiKey = process.env.GEMINI_API_KEY;
let genAI;

if (geminiApiKey) {
  genAI = new GoogleGenerativeAI(geminiApiKey);
  console.log('✅ Gemini AI configured');
} else {
  console.warn('⚠️  Gemini API key not configured');
}

export function getGeminiModel(modelName = 'gemini-2.5-flash') {
  if (!genAI) {
    throw new Error('Gemini API key not configured');
  }
  return genAI.getGenerativeModel({ model: modelName });
}

export function isGeminiConfigured() {
  return !!genAI;
}