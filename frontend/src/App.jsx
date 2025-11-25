import { useState } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import "@/App.css";
import Layout from "./components/Layout";
import Dashboard from "./components/Dashboard";
import AddExpense from "./components/AddExpense";
import AIChat from "./components/AIChat";
import MultiAgent from "./components/MultiAgent";
import LandingPage from "./components/LandingPage";
import AuthCallback from "./components/AuthCallback";
import Budgets from "./components/Budgets";
import Settings from "./components/Settings";
import Login from "./components/Login";
import ProtectedRoute from "./components/ProtectedRoute";

function App() {
  const [stats, setStats] = useState({ total: 0, by_category: {}, count: 0 });
  const [recentExpenses, setRecentExpenses] = useState([]);
  const [insight, setInsight] = useState(null);
  const [loading, setLoading] = useState(false);
  const [monthlyExpenses, setMonthlyExpenses] = useState({});

  return (
    <Router>
      <Routes>
        {/* Public Routes */}
        <Route path="/" element={<Login />} />
        <Route path="/landing" element={<LandingPage />} />
        <Route path="/auth/callback" element={<AuthCallback />} />

        {/* Protected Routes */}
        <Route element={<ProtectedRoute />}>
          <Route element={<Layout />}>
            <Route
              path="/dashboard"
              element={
                <Dashboard
                  loading={loading}
                  setLoading={setLoading}
                  stats={stats}
                  setStats={setStats}
                  recentExpenses={recentExpenses}
                  setRecentExpenses={setRecentExpenses}
                  monthlyExpenses={monthlyExpenses}
                  setMonthlyExpenses={setMonthlyExpenses}
                  insight={insight}
                  setInsight={setInsight}
                />
              }
            />
            <Route
              path="/add-expense"
              element={<AddExpense setLoading={setLoading} loading={loading} />}
            />
            <Route path="/chat" element={<AIChat />} />
            <Route path="/multi-agent" element={<MultiAgent />} />
            <Route path="/budgets" element={<Budgets />} />
            <Route path="/settings" element={<Settings />} />
          </Route>
        </Route>

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}

export default App;

