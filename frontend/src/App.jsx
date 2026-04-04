import { useState } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import "@/App.css";
import Layout from "./components/Layout";
import Dashboard from "./components/Dashboard";
import AddExpense from "./components/AddExpense";
import BillUpload from "./components/BillUpload";
import AIChat from "./components/AIChat";
import MultiAgent from "./components/MultiAgent";
import LandingPage from "./components/LandingPage";
import AuthCallback from "./components/AuthCallback";
import AcceptGrant from "./components/AcceptGrant";
import GroupModal from "./components/GroupModal";
import Budgets from "./components/Budgets";
import Settings from "./components/Settings";
import Login from "./components/Login";
import ProtectedRoute from "./components/ProtectedRoute";
import AdminRoleRequestsPage from "./pages/AdminRoleRequestsPage";

function App() {
  const [stats, setStats] = useState({ total: 0, by_category: {}, count: 0 });
  const [recentExpenses, setRecentExpenses] = useState([]);
  const [insight, setInsight] = useState(null);
  const [loading, setLoading] = useState(false);
  const [showGroupModal, setShowGroupModal] = useState(false);
  const [monthlyExpenses, setMonthlyExpenses] = useState({});

  return (
    <Router>
      <Routes>
        {/* Public Routes */}
        <Route path="/" element={<LandingPage />} />
        {/* <Route path="/login" element={<Login />} /> */}
        <Route path="/auth/callback" element={<AuthCallback />} />
        <Route path="/accept-grant" element={<AcceptGrant />} />

        {/* Protected Routes */}
        <Route element={<ProtectedRoute />}>
          <Route element={<Layout setShowGroupModal={setShowGroupModal} />}>
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
            <Route path="/bill-upload" element={<BillUpload />} />
            <Route path="/chat" element={<AIChat />} />
            <Route path="/multi-agent" element={<MultiAgent />} />
            {/* <Route path="/budgets" element={<Budgets />} /> */}
            <Route path="/settings" element={<Settings />} />
          </Route>
        </Route>

        {/* Admin-only Routes */}
        <Route element={<ProtectedRoute adminOnly />}>
          <Route element={<Layout setShowGroupModal={setShowGroupModal} />}>
            <Route path="/admin/role-requests" element={<AdminRoleRequestsPage />} />
          </Route>
        </Route>

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>

      {/* Group Modal */}
      <GroupModal isOpen={showGroupModal} onClose={() => setShowGroupModal(false)} />
    </Router>
  );
}

export default App;

