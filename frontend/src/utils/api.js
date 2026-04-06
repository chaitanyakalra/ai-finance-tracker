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

  // ========== Bill Endpoints ==========

  /**
   * Upload bills for AI extraction and fraud detection
   * @param {FormData} formData - FormData containing bill images
   * @returns {Promise} Upload response with bill IDs
   */
  uploadBills: (formData) => {
    return apiClient.post(getEndpoint(API_ENDPOINTS.BILLS.UPLOAD), formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  },

  /**
   * Get bill analysis by ID
   * @param {string} billId - Bill ID
   * @returns {Promise} Bill analysis data
   */
  getBillAnalysis: (billId) => {
    const endpoint = API_ENDPOINTS.BILLS.GET_BILL.replace(':billId', billId);
    return apiClient.get(getEndpoint(endpoint));
  },

  /**
   * Get user's bills with pagination
   * @param {Object} params - Query parameters
   * @param {number} params.limit - Number of bills to fetch
   * @param {number} params.skip - Number of bills to skip
   * @param {string} params.status - Filter by status (optional)
   * @returns {Promise} List of bills
   */
  getUserBills: (params = {}) => {
    const queryParams = new URLSearchParams();
    if (params.limit) queryParams.append('limit', params.limit);
    if (params.skip) queryParams.append('skip', params.skip);
    if (params.status) queryParams.append('status', params.status);
    
    const endpoint = `${API_ENDPOINTS.BILLS.LIST}?${queryParams.toString()}`;
    return apiClient.get(getEndpoint(endpoint));
  },

  /**
   * Delete a bill
   * @param {string} billId - Bill ID to delete
   * @returns {Promise} Deletion confirmation
   */
  deleteBill: (billId) => {
    const endpoint = API_ENDPOINTS.BILLS.DELETE.replace(':billId', billId);
    return apiClient.delete(getEndpoint(endpoint));
  },

  /**
   * Approve a bill (faculty only)
   * @param {string} billId - Bill ID to approve
   * @returns {Promise} Approval confirmation
   */
  approveBill: (billId) => {
    return apiClient.patch(getEndpoint(`/bills/${billId}/approve`));
  },

  /**
   * Reject a bill (faculty only)
   * @param {string} billId - Bill ID to reject
   * @param {string} reason - Rejection reason
   * @returns {Promise} Rejection confirmation
   */
  rejectBill: (billId, reason) => {
    return apiClient.patch(getEndpoint(`/bills/${billId}/reject`), { reason });
  },

  // ========== Grant Endpoints ==========

  /**
   * Create a grant (faculty only)
   * @param {Object} grantData - Grant data
   * @param {string} grantData.studentEmail - Student's email
   * @param {number} grantData.amount - Grant amount
   * @returns {Promise} Created grant
   */
  createGrant: (grantData) => {
    return apiClient.post(getEndpoint('/grants/create'), grantData);
  },

  /**
   * Get user's grants (faculty or student)
   * @returns {Promise} List of grants
   */
  getMyGrants: () => {
    return apiClient.get(getEndpoint('/grants/my-grants'));
  },

  /**
   * Get grant details
   * @param {string} grantId - Grant ID
   * @returns {Promise} Grant details
   */
  getGrantDetails: (grantId) => {
    return apiClient.get(getEndpoint(`/grants/${grantId}`));
  },

  /**
   * Get student's active grant
   * @returns {Promise} Active grant
   */
  getActiveGrant: () => {
    return apiClient.get(getEndpoint('/grants/active'));
  },

  /**
   * Cancel a grant (faculty only)
   * @param {string} grantId - Grant ID
   * @returns {Promise} Cancellation confirmation
   */
  cancelGrant: (grantId) => {
    return apiClient.patch(getEndpoint(`/grants/${grantId}/cancel`));
  },

  // ========== Invitation Endpoints ==========

  /**
   * Accept grant invitation
   * @param {string} token - Invitation token
   * @returns {Promise} Accepted grant
   */
  acceptInvitation: (token) => {
    return apiClient.get(getEndpoint(`/invitations/accept?token=${token}`));
  },

  // ========== User Endpoints ==========

  /**
   * Set user role (faculty or student)
   * @param {string} role - 'faculty' or 'student'
   * @returns {Promise} Role confirmation
   */
  setUserRole: (role) => {
    return apiClient.post(getEndpoint('/users/set-role'), { role });
  },

  /**
   * Get bills for a specific grant (faculty only)
   * @param {string} grantId - Grant ID
   * @returns {Promise} List of bills for the grant
   */
  getGrantBills: (grantId) => {
    return apiClient.get(getEndpoint(`/bills/grant/${grantId}`));
  },

  // ========== RBAC User Endpoints ==========

  getCurrentUser: () => apiClient.get('/users/me'),
  getAllUsers: (params) => apiClient.get('/users', { params }),
  getUserById: (userId) => apiClient.get(`/users/${userId}`),
  updateUserRole: (userId, role) => apiClient.put(`/users/${userId}/role`, { role }),
  updateUserStatus: (userId, status) => apiClient.put(`/users/${userId}/status`, { status }),
  updateUserProfile: (userId, data) => apiClient.put(`/users/${userId}/profile`, data),

  // ========== Role Request Endpoints ==========

  requestRoleUpgrade: (data) => apiClient.post('/users/request-role', data),
  getUserRequests: () => apiClient.get('/users/my-requests'),
  getAdminRequests: (params) => apiClient.get('/admin/role-requests', { params }),
  getRequestById: (id) => apiClient.get(`/admin/role-requests/${id}`),
  approveRequest: (id, notes) => apiClient.post(`/admin/role-requests/${id}/approve`, { adminNotes: notes }),
  rejectRequest: (id, reason) => apiClient.post(`/admin/role-requests/${id}/reject`, { reason }),

  // ========== Dashboard Endpoints ==========

  getDashboardSummary: (params) => apiClient.get('/dashboard', { params }),
  getCategoryAnalytics: (params) => apiClient.get('/dashboard/categories', { params }),
  getMonthlyTrends: (params) => apiClient.get('/dashboard/trends', { params }),
  getTopCategories: (params) => apiClient.get('/dashboard/top-categories', { params }),
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
