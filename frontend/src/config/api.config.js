/**
 * API Configuration
 * Production-ready API configuration with environment-based settings
 */

// Environment configuration
const ENV = {
  development: import.meta.env.DEV,
  production: import.meta.env.PROD,
  mode: import.meta.env.MODE,
};

// Backend URL configuration
// Supports both VITE_ (Vite) and REACT_APP_ (Create React App) prefixes for flexibility
const getBaseUrl = () => {
  // Check for environment variables (Vite uses VITE_ prefix, CRA uses REACT_APP_ prefix)
  const backendUrl = 
    import.meta.env.VITE_BACKEND_URL || 
    import.meta.env.REACT_APP_BACKEND_URL ||
    import.meta.env.VITE_API_BASE_URL || 
    import.meta.env.REACT_APP_API_BASE_URL;
  
  if (backendUrl) {
    console.log('🌐 Using backend URL from environment:', backendUrl);
    return backendUrl;
  }
  
  // No environment variable set - throw error in production, warn in development
  if (import.meta.env.PROD) {
    console.error('❌ VITE_BACKEND_URL or REACT_APP_BACKEND_URL environment variable is required in production!');
    throw new Error('Backend URL not configured. Please set VITE_BACKEND_URL or REACT_APP_BACKEND_URL environment variable.');
  }
  
  // Development fallback with warning
  console.warn('⚠️ No backend URL environment variable found. Using default localhost:8000 for development.');
  console.warn('⚠️ Set VITE_BACKEND_URL or REACT_APP_BACKEND_URL in your .env file');
  return 'http://localhost:8000';
};

export const API_CONFIG = {
  BASE_URL: getBaseUrl(),
  API_PREFIX: '/api',
  TIMEOUT: 30000, // 30 seconds
};

// Full API base URL
export const API_BASE_URL = `${API_CONFIG.BASE_URL}${API_CONFIG.API_PREFIX}`;

/**
 * API Endpoints
 * Centralized endpoint definitions for maintainability
 */
export const API_ENDPOINTS = {
  // Expense endpoints
  EXPENSES: {
    BASE: '/expenses',
    LIST: '/expenses',
    CREATE: '/expenses',
    RECENT: '/expenses/recent',
    STATS: '/expenses/stats',
    MONTHLY: '/expenses/monthly',
  },
  
  // AI endpoints
  AI: {
    BASE: '/ai',
    CHAT: '/ai/chat',
    MULTI_AGENT: '/ai/multi-agent',
    BEHAVIORAL_INSIGHT: '/ai/behavioral-insight',
  },
  
  // Bill endpoints
  BILLS: {
    BASE: '/bills',
    UPLOAD: '/bills/upload',
    GET_BILL: '/bills/analysis/:billId',
    LIST: '/bills/list', // Updated to match backend /list route
    DELETE: '/bills/:billId',
  },
  
  // Auth endpoints
  AUTH: {
    BASE: '/auth',
    GOOGLE: '/auth/google',
    GOOGLE_CALLBACK: '/auth/google/callback',
  },
};

/**
 * Build full endpoint URL
 * @param {string} endpoint - Endpoint path
 * @returns {string} Full URL
 */
export const getEndpoint = (endpoint) => {
  return `${API_BASE_URL}${endpoint}`;
};

/**
 * Environment info (for debugging)
 */
export const getApiInfo = () => {
  return {
    baseUrl: API_CONFIG.BASE_URL,
    apiBaseUrl: API_BASE_URL,
    environment: ENV.mode,
    isDevelopment: ENV.development,
    isProduction: ENV.production,
  };
};

