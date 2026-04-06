# Finance Tracker Backend (JavaScript/Node.js)

This is the JavaScript/Node.js version of the Finance Tracker backend API.

## Setup

1. Install dependencies:
```bash
npm install
```

2. Create a `.env` file in this directory with the following variables:
```env
# Server
PORT=8000
NODE_ENV=development

# MongoDB
MONGO_URL=mongodb://localhost:27017
DB_NAME=finance_tracker

# JWT
JWT_SECRET=your-super-secret-jwt-key-min-32-chars
JWT_REFRESH_SECRET=your-refresh-secret-key-min-32-chars
ACCESS_TOKEN_EXPIRY=15m
REFRESH_TOKEN_EXPIRY=7d

# Google OAuth
GOOGLE_CLIENT_ID=your-google-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-google-client-secret
# BACKEND_URL is used to construct the OAuth callback URL
BACKEND_URL=http://localhost:8000

# Frontend URL (for CORS + post-OAuth redirect)
FRONTEND_URL=http://localhost:5173

# CORS (comma-separated; localhost is always allowed in development)
CORS_ORIGINS=http://localhost:5173

# Gemini AI
GEMINI_API_KEY=your-gemini-api-key

# AWS Lambda (optional — for bill image parsing)
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=your-access-key
AWS_SECRET_ACCESS_KEY=your-secret-key
LAMBDA_FUNCTION_NAME=bill-extractor
USE_LAMBDA=false

# Email / SMTP (optional — notifications fall back to console.log if missing)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=your-app-password
EMAIL_FROM=FinanceGuard AI <your-email@gmail.com>

# Supabase (optional)
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key
```

3. Make sure MongoDB is running (locally or use MongoDB Atlas)

4. Start the server:
```bash
npm start
```

Or for development with auto-reload (requires Node.js >= 18):
```bash
npm run dev
```

The server will run on `http://localhost:8000` by default.

## API Endpoints

All endpoints are prefixed with `/api`. Protected routes require:
```
Authorization: Bearer <access_token>
```

- `GET /api/auth/google` — Redirect to Google OAuth consent
- `GET /api/auth/google/callback` — OAuth callback; issues JWT tokens
- `POST /api/auth/refresh` — Exchange refresh token for new access token
- `POST /api/auth/logout` — Revoke refresh token
- `POST /api/expenses` — Create a new expense (analyst, admin)
- `GET /api/expenses` — Get all expenses with filters (viewer, analyst, admin)
- `GET /api/expenses/recent` — Get recent expenses (viewer, analyst, admin)
- `GET /api/expenses/stats` — Get expense statistics (viewer, analyst, admin)
- `GET /api/expenses/monthly` — Monthly aggregation (viewer, analyst, admin)
- `PUT /api/expenses/:id` — Update expense (analyst own / admin any)
- `DELETE /api/expenses/:id` — Delete expense (admin only)
- `GET /api/dashboard` — Full dashboard summary (all authenticated)
- `POST /api/ai/chat` — AI chat endpoint (all authenticated)
- `POST /api/ai/multi-agent` — Multi-agent analysis (all authenticated)
- `GET /api/ai/behavioral-insight` — Behavioral finance insights (all authenticated)
- `POST /api/bills/upload` — Upload bill image for parsing (all authenticated)
- `GET /api/users/me` — Current user profile + permissions
- `POST /api/users/request-role` — Submit role upgrade request
- `GET /api/users/my-requests` — Own role request history
- `GET /api/admin/role-requests` — List pending role requests (admin)
- `POST /api/admin/role-requests/:id/approve` — Approve role request (admin)
- `POST /api/admin/role-requests/:id/reject` — Reject role request (admin)

## Environment Variables

| Variable | Required | Description |
|---|---|---|
| `MONGO_URL` | Yes | MongoDB connection string |
| `DB_NAME` | No | Database name (default: `finance_tracker`) |
| `PORT` | No | Server port (default: `8000`) |
| `NODE_ENV` | No | Environment (`development`/`production`) |
| `JWT_SECRET` | Yes | JWT signing key (min 32 chars) |
| `JWT_REFRESH_SECRET` | Yes | Refresh token signing key |
| `ACCESS_TOKEN_EXPIRY` | No | Access token TTL (default: `15m`) |
| `REFRESH_TOKEN_EXPIRY` | No | Refresh token TTL (default: `7d`) |
| `GOOGLE_CLIENT_ID` | Yes | Google OAuth client ID |
| `GOOGLE_CLIENT_SECRET` | Yes | Google OAuth client secret |
| `BACKEND_URL` | Yes | Backend public URL (used for OAuth callback) |
| `FRONTEND_URL` | Yes | Frontend URL (CORS + OAuth redirect) |
| `CORS_ORIGINS` | No | Comma-separated allowed origins |
| `GEMINI_API_KEY` | Yes | Google Gemini API key |
| `AWS_REGION` | No | AWS region for Lambda |
| `AWS_ACCESS_KEY_ID` | No | AWS credentials |
| `AWS_SECRET_ACCESS_KEY` | No | AWS credentials |
| `LAMBDA_FUNCTION_NAME` | No | Lambda function name for bill parsing |
| `USE_LAMBDA` | No | Set to `true` to enable Lambda bill parsing |
| `EMAIL_HOST` | No | SMTP server host |
| `EMAIL_PORT` | No | SMTP port |
| `EMAIL_USER` | No | SMTP username |
| `EMAIL_PASSWORD` | No | SMTP password |
| `EMAIL_FROM` | No | From address for emails |
| `SUPABASE_URL` | No | Supabase project URL |
| `SUPABASE_ANON_KEY` | No | Supabase anonymous key |
