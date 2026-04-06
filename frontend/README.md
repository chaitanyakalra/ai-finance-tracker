# FinanceGuard AI — Frontend

React 18 + Vite SPA for the FinanceGuard AI finance tracker.

## Setup

1. Install dependencies:
```bash
npm install
```

2. Create a `.env` file in this directory:
```env
# Backend API base URL — points to the Express server (no /api suffix)
VITE_BACKEND_URL=http://localhost:8000
```

> The `/api` prefix is added automatically. See `src/config/api.config.js` for details.

3. Start the development server:
```bash
npm run dev
```

The app runs on `http://localhost:5173` by default (Vite default port).

## Available Scripts

### `npm run dev`

Runs the app in development mode with Vite HMR.  
Open [http://localhost:5173](http://localhost:5173) in your browser.

### `npm run build`

Builds the app for production into the `dist/` folder.

### `npm run preview`

Serves the production build locally for testing before deployment.

## Environment Variables

| Variable | Required | Description |
|---|---|---|
| `VITE_BACKEND_URL` | Yes (production) | Backend API base URL (e.g. `https://your-backend.onrender.com`) |

In development, if `VITE_BACKEND_URL` is not set the frontend defaults to `http://localhost:8000`.  
In production builds the variable is **required** — the app will throw an error if missing.

## API Base URL Configuration

The frontend resolves the backend URL through `src/config/api.config.js`.  
It reads `VITE_BACKEND_URL` and appends `/api` to form the full API base URL.

## Deployment (Vercel)

1. Connect the `frontend/` directory in Vercel
2. Framework preset: **Vite**
3. Add the environment variable `VITE_BACKEND_URL` (your Render backend URL)
4. Ensure `vercel.json` contains the SPA catch-all rewrite:
   ```json
   { "rewrites": [{ "source": "/(.*)", "destination": "/index.html" }] }
   ```

## Tech Stack

- **React 18** — UI framework
- **Vite 5** — Build tool with HMR
- **React Router v7** — Client-side routing
- **Tailwind CSS + shadcn/ui** — Styling and component library
- **Axios** — HTTP client with request/response interceptors
- **Framer Motion** — Animations
- **Chart.js** — Charts and data visualisation
