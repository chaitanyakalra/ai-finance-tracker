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
export const API_CONFIG = {
  BASE_URL: import.meta.env.VITE_API_BASE_URL || import.meta.env.VITE_BACKEND_URL || 'http://13.200.222.100',
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
  },
  
  // AI endpoints
  AI: {
    BASE: '/ai',
    CHAT: '/ai/chat',
    MULTI_AGENT: '/ai/multi-agent',
    BEHAVIORAL_INSIGHT: '/ai/behavioral-insight',
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

