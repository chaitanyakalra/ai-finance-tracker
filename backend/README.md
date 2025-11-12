# Finance Tracker Backend (JavaScript/Node.js)

This is the JavaScript/Node.js version of the Finance Tracker backend API.

## Setup

1. Install dependencies:
```bash
npm install
```

2. Create a `.env` file in this directory with the following variables:
```
MONGO_URL=mongodb://localhost:27017
DB_NAME=finance_tracker
GEMINI_API_KEY=your_gemini_api_key_here
PORT=8000
CORS_ORIGINS=http://localhost:3000
```

3. Make sure MongoDB is running (locally or use MongoDB Atlas)

4. Start the server:
```bash
npm start
```

Or for development with auto-reload:
```bash
npm run dev
```

The server will run on `http://localhost:8000` by default.

## API Endpoints

All endpoints are prefixed with `/api`:

- `GET /api/` - Health check
- `POST /api/expenses` - Create a new expense
- `GET /api/expenses` - Get all expenses
- `GET /api/expenses/recent` - Get recent expenses (last 10)
- `GET /api/expenses/stats` - Get expense statistics
- `POST /api/ai/chat` - AI chat endpoint
- `POST /api/ai/multi-agent` - Multi-agent analysis
- `GET /api/ai/behavioral-insight` - Get behavioral finance insights

## Environment Variables

- `MONGO_URL` - MongoDB connection string
- `DB_NAME` - Database name (default: finance_tracker)
- `GEMINI_API_KEY` - Google Gemini API key for AI features
- `PORT` - Server port (default: 8000)
- `CORS_ORIGINS` - Comma-separated list of allowed CORS origins


