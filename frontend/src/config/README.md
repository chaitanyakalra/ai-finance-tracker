# API Configuration

This directory contains production-ready API configuration for the FinanceGuard AI frontend.

## Structure

- `api.config.js` - Centralized API configuration and endpoint definitions
- `../utils/api.js` - API service with axios instance and request/response interceptors

## Environment Variables

Create a `.env` file in the `frontend` directory with:

```env
# Production API URL
VITE_API_BASE_URL=https://api.yourdomain.com

# Or use the legacy variable name
VITE_BACKEND_URL=https://api.yourdomain.com
```

If no environment variable is set, it defaults to `http://localhost:8000` for development.

## Usage

### Import the API Service

```javascript
import { apiService } from '../utils/api';
```

### Available Methods

#### Expense Endpoints
- `apiService.getAllExpenses()` - Get all expenses
- `apiService.getRecentExpenses()` - Get last 10 transactions
- `apiService.getExpenseStats()` - Get spending statistics
- `apiService.createExpense(expense)` - Create new expense

#### AI Endpoints
- `apiService.aiChat(question)` - Get AI response
- `apiService.multiAgentAnalysis(question)` - Multi-agent analysis
- `apiService.getBehavioralInsight()` - Get behavioral insights

### Example

```javascript
import { apiService } from '../utils/api';

// Get expense stats
const stats = await apiService.getExpenseStats();

// Create expense
await apiService.createExpense({
  date: '2024-01-15',
  amount: 500.00,
  category: 'Food',
  description: 'Lunch'
});
```

## Production Deployment

1. Set `VITE_API_BASE_URL` to your production API URL
2. The API service automatically handles:
   - Request/response interceptors
   - Error handling
   - Authentication tokens (if implemented)
   - Timeout configuration

## Endpoint Constants

All endpoints are defined in `api.config.js` under `API_ENDPOINTS` for easy maintenance and updates.

