# FinanceGuard AI - Multi-Agent Intelligent Financial Assistant

## B.Tech Final Year Project MVP

A web application showcasing AI-powered personal finance management with multi-agent collaboration.

## Features

### 1. Smart Expense Tracker with AI Insights
- Add and track expenses across categories (Food, Transport, Shopping, Bills, Entertainment, Others)
- View last 10 transactions
- See total spending and category-wise breakdown with visual bars
- AI-powered chat to answer questions about spending patterns
- Pre-loaded with 8 sample transactions for instant demo

### 2. Multi-Agent Conversation Demo
- Get comprehensive financial advice from 3 AI specialists:
  - **Budget Analyst** (📊): Analyzes spending patterns and budget implications
  - **Investment Advisor** (💰): Provides investment and financial planning advice
  - **Risk Assessor** (🛡️): Evaluates financial risks and provides warnings
- Sequential agent responses with typing animation
- Final consolidated recommendation

### 3. Behavioral Finance Insight Card
- AI analyzes expense patterns automatically
- Identifies spending behaviors (weekend vs weekday patterns)
- Provides actionable recommendations
- Auto-generated insights on dashboard

## Tech Stack

**Backend:**
- Node.js with Express.js (JavaScript)
- MongoDB for data storage
- Google Gemini API for AI capabilities

**Frontend:**
- React with Hooks
- Vanilla CSS (minimal styling for MVP)
- Axios for API calls

**Note:** The original Python/FastAPI backend has been replaced with a JavaScript/Node.js implementation in the `backend-js/` folder.

## API Endpoints

- `POST /api/expenses` - Add new expense
- `GET /api/expenses` - Get all expenses
- `GET /api/expenses/recent` - Get last 10 transactions
- `GET /api/expenses/stats` - Get spending statistics
- `POST /api/ai/chat` - AI chat for expense insights
- `POST /api/ai/multi-agent` - Multi-agent financial analysis
- `GET /api/ai/behavioral-insight` - Get behavioral finance insights

## Demo Data

The app comes pre-loaded with 8 sample transactions totaling ₹15,100:
- Food: ₹3,500
- Transport: ₹1,100
- Shopping: ₹3,500
- Bills: ₹5,000
- Entertainment: ₹2,000

## Usage

1. **Dashboard**: View total spending, category breakdown, recent transactions, and AI insights
2. **Add Expense**: Simple form to add new expenses
3. **AI Chat**: Ask questions like "How much did I spend on food?" or "What are my spending patterns?"
4. **Multi-Agent Demo**: Get comprehensive advice on financial decisions (e.g., "Should I buy a laptop for ₹50,000?")

## Architecture Highlights

- Backend handles all AI logic and data processing
- Frontend is minimal and functional (focus on backend intelligence)
- Multi-agent system simulates collaboration between specialized AI agents
- Real-time AI analysis of financial data

## Environment Variables

Backend (in `backend-js/.env`):
```
MONGO_URL=mongodb://localhost:27017
DB_NAME=finance_tracker
GEMINI_API_KEY=<your-gemini-api-key>
PORT=8000
CORS_ORIGINS=http://localhost:3000
```

Frontend `.env` (optional):
```
REACT_APP_BACKEND_URL=http://localhost:8000
```
(Defaults to `http://localhost:8000` if not set)

## Project Purpose

This MVP demonstrates the core concept of AI-powered financial assistance using multi-agent collaboration for B.Tech final year project evaluation. The focus is on showcasing backend AI intelligence rather than complex UI.
