import axios from "axios";

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:8000';
export const API = `${BACKEND_URL}/api`;

export const api = {
  getStats: () => axios.get(`${API}/expenses/stats`),
  getRecent: () => axios.get(`${API}/expenses/recent`),
  getInsight: () => axios.get(`${API}/ai/behavioral-insight`),
  addExpense: (expense) => axios.post(`${API}/expenses`, expense),
  chat: (question) => axios.post(`${API}/ai/chat`, { question }),
  multiAgent: (question) => axios.post(`${API}/ai/multi-agent`, { question }),
};

