/**
 * API Service
 * Production-ready API service with centralized endpoints and error handling
 */
import axios from 'axios';
import { API_BASE_URL, API_ENDPOINTS, getEndpoint, API_CONFIG } from '../config/api.config';

// Create axios instance with default configuration
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: API_CONFIG.TIMEOUT,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor
apiClient.interceptors.request.use(
  (config) => {
    // Add auth token if available
    const token = localStorage.getItem('authToken');
    const refreshToken = localStorage.getItem('refreshToken');
    const userId = localStorage.getItem('userId');

    console.log('🌐 API Request Interceptor:', {
      url: config.url,
      method: config.method,
      hasAuthToken: !!token,
      hasRefreshToken: !!refreshToken,
      hasUserId: !!userId,
      tokenLength: token?.length,
      allLocalStorageKeys: Object.keys(localStorage)
    });

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
      console.log('✅ API Request: Authorization header added');
    } else {
      console.warn('⚠️ API Request: No authToken found in localStorage');
      console.warn('⚠️ Available localStorage keys:', Object.keys(localStorage));
    }
    return config;
  },
  (error) => {
    console.error('❌ API Request Interceptor Error:', error);
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
apiClient.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    // Handle common errors
    if (error.response) {
      // Server responded with error status
      const { status, data } = error.response;

      switch (status) {
        case 401:
          // Unauthorized - handle logout
          console.error('Unauthorized access - Redirecting to login');
          localStorage.removeItem('authToken');
          localStorage.removeItem('refreshToken');
          localStorage.removeItem('userId');
          window.location.href = '/';
          break;
        case 403:
          console.error('Forbidden access');
          break;
        case 404:
          console.error('Resource not found');
          break;
        case 500:
          console.error('Server error');
          break;
        default:
          console.error(`API Error: ${status}`, data);
      }
    } else if (error.request) {
      // Request made but no response received
      console.error('Network error - no response from server');
    } else {
      // Something else happened
      console.error('Error setting up request', error.message);
    }

    return Promise.reject(error);
  }
);

/**
 * API Service Methods
 * All API calls are centralized here using the endpoint constants
 */
export const apiService = {
  // ========== Expense Endpoints ==========

  /**
   * Get all expenses
   */
  getAllExpenses: () => {
    return apiClient.get(getEndpoint(API_ENDPOINTS.EXPENSES.LIST));
  },

  /**
   * Get recent expenses (last 10)
   */
  getRecentExpenses: () => {
    return apiClient.get(getEndpoint(API_ENDPOINTS.EXPENSES.RECENT));
  },

  /**
   * Get expense statistics
   */
  getExpenseStats: () => {
    return apiClient.get(getEndpoint(API_ENDPOINTS.EXPENSES.STATS));
  },

  /**
   * Get monthly expense
   */
  getMonthlyExpense: () => {
    return apiClient.get(getEndpoint(API_ENDPOINTS.EXPENSES.MONTHLY));
  },

  /**
   * Create new expense
   * @param {Object} expense - Expense data
   * @param {string} expense.date - Date in YYYY-MM-DD format
   * @param {number} expense.amount - Expense amount
   * @param {string} expense.category - Expense category
   * @param {string} expense.description - Expense description
   */
  createExpense: (expense) => {
    return apiClient.post(getEndpoint(API_ENDPOINTS.EXPENSES.CREATE), {
      ...expense,
      amount: parseFloat(expense.amount),
    });
  },

  // ========== AI Endpoints ==========

  /**
   * AI Chat - Get AI response to a question
   * @param {string} question - User's question
   */
  aiChat: (question) => {
    return apiClient.post(getEndpoint(API_ENDPOINTS.AI.CHAT), {
      question: question.trim(),
    });
  },

  /**
   * Multi-Agent Analysis - Get analysis from multiple AI agents
   * @param {string} question - User's financial question
   */
  multiAgentAnalysis: (question) => {
    return apiClient.post(getEndpoint(API_ENDPOINTS.AI.MULTI_AGENT), {
      question: question.trim(),
    });
  },

  /**
   * Get behavioral finance insights
   */
  getBehavioralInsight: () => {
    return apiClient.get(getEndpoint(API_ENDPOINTS.AI.BEHAVIORAL_INSIGHT));
  },

  // ========== Group Endpoints ==========

  /**
   * Create a new group
   * @param {string} name - Group name
   */
  createGroup: (name) => {
    return apiClient.post('/groups', { name });
  },

  /**
   * Get all groups for the authenticated user
   */
  getUserGroups: () => {
    return apiClient.get('/groups');
  },

  /**
   * Get group by ID
   * @param {string} groupId - Group ID
   */
  getGroupById: (groupId) => {
    return apiClient.get(`/groups/${groupId}`);
  },

  /**
   * Get group members with details
   * @param {string} groupId - Group ID
   */
  getGroupMembers: (groupId) => {
    return apiClient.get(`/groups/${groupId}/members`);
  },

  /**
   * Add member to group by email
   * @param {string} groupId - Group ID
   * @param {string} email - Member's email address
   */
  addMemberByEmail: (groupId, email) => {
    return apiClient.post(`/groups/${groupId}/members`, { email });
  },

  /**
   * Remove member from group
   * @param {string} groupId - Group ID
   * @param {string} memberId - Member's user ID
   */
  removeMember: (groupId, memberId) => {
    return apiClient.delete(`/groups/${groupId}/members/${memberId}`);
  },

  /**
   * Update group name
   * @param {string} groupId - Group ID
   * @param {string} name - New group name
   */
  updateGroupName: (groupId, name) => {
    return apiClient.put(`/groups/${groupId}/name`, { name });
  },

  /**
   * Delete a group
   * @param {string} groupId - Group ID
   */
  deleteGroup: (groupId) => {
    return apiClient.delete(`/groups/${groupId}`);
  },

  // ========== Shared Expense Endpoints ==========

  /**
   * Create a shared expense (split among group members)
   * @param {Object} expense - Shared expense data
   * @param {string} expense.groupId - Group ID
   * @param {string} expense.description - Expense description
   * @param {number} expense.amount - Total expense amount
   * @param {string} expense.category - Expense category
   * @param {string} expense.date - Date in YYYY-MM-DD format
   */
  createSharedExpense: (expense) => {
    return apiClient.post('/shared-expenses', {
      ...expense,
      amount: parseFloat(expense.amount),
    });
  },

  /**
   * Get all shared expenses for the authenticated user
   */
  getUserSharedExpenses: () => {
    return apiClient.get('/shared-expenses');
  },

  /**
   * Get all shared expenses for a specific group
   * @param {string} groupId - Group ID
   */
  getGroupExpenses: (groupId) => {
    return apiClient.get(`/shared-expenses/group/${groupId}`);
  },

  /**
   * Get group balance
   * @param {string} groupId - Group ID
   */
  getGroupBalance: (groupId) => {
    return apiClient.get(`/shared-expenses/group/${groupId}/balance`);
  },

  /**
   * Get total amount owed to user
   */
  getTotalAmountOwed: () => {
    return apiClient.get('/shared-expenses/amount-owed');
  },

  /**
   * Get breakdown of who owes money to the user
   * Returns array of { userId, name, email, amount }
   */
  getAmountOwedByPerson: () => {
    return apiClient.get('/shared-expenses/amount-owed-by-person');
  },

  /**
   * Get breakdown of who the user owes money to
   * Returns array of { userId, name, email, amount }
   */
  getAmountIOweByPerson: () => {
    return apiClient.get('/shared-expenses/amount-i-owe-by-person');
  },

  /**
   * Get shared expense by ID
   * @param {string} expenseId - Expense ID
   */
  getSharedExpenseById: (expenseId) => {
    return apiClient.get(`/shared-expenses/${expenseId}`);
  },

  /**
   * Delete a shared expense
   * @param {string} expenseId - Expense ID
   */
  deleteSharedExpense: (expenseId) => {
    return apiClient.delete(`/shared-expenses/${expenseId}`);
  },
};

// Legacy export for backward compatibility
export const api = {
  getStats: () => apiService.getExpenseStats(),
  getRecent: () => apiService.getRecentExpenses(),
  getMonthly: () => apiService.getMonthlyExpense(),
  getInsight: () => apiService.getBehavioralInsight(),
  addExpense: (expense) => apiService.createExpense(expense),
  chat: (question) => apiService.aiChat(question),
  multiAgent: (question) => apiService.multiAgentAnalysis(question),
};

// Export the axios instance for custom requests if needed
export { apiClient };

// Export configuration for debugging
export { API_CONFIG, API_ENDPOINTS, getEndpoint };
