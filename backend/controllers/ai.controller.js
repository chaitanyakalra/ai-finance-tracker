import * as aiService from '../services/ai.service.js';
import { isDBConnected } from '../config/database.js';
import { isGeminiConfigured } from '../config/gemini.js';

function checkDB(res) {
  if (!isDBConnected()) {
    res.status(503).json({ 
      error: 'Database not available. Please configure MongoDB connection.' 
    });
    return false;
  }
  return true;
}

function checkGemini(res) {
  if (!isGeminiConfigured()) {
    res.status(500).json({ error: 'Gemini API key not configured' });
    return false;
  }
  return true;
}

export async function handleChat(req, res, next) {
  try {
    if (!checkGemini(res) || !checkDB(res)) return;
    
    const { question } = req.body;
    const result = await aiService.handleChatQuery(question);
    
    res.json(result);
    console.log("Chat Result:", result);
  } catch (error) {
    next(error);
  }
}

export async function handleMultiAgent(req, res, next) {
  try {
    if (!checkGemini(res) || !checkDB(res)) return;
    
    const { question } = req.body;
    const result = await aiService.handleMultiAgentQuery(question);
    
    res.json(result);
    console.log("Multi-Agent Result:", result);
  } catch (error) {
    next(error);
  }
}

export async function getBehavioralInsight(req, res, next) {
  try {
    if (!checkGemini(res) || !checkDB(res)) return;
    
    const result = await aiService.generateBehavioralInsight();
    res.json(result);
    console.log("Behavioral Insight:", result);
  } catch (error) {
    next(error);
  }
}