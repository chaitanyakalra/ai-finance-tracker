import { useState, useEffect } from "react";
import { BrowserRouter as Router, Routes, Route, useLocation, useNavigate } from "react-router-dom";
import "@/App.css";
import Header from "./components/Header";
import Navigation from "./components/Navigation";
import Dashboard from "./components/Dashboard";
import AddExpense from "./components/AddExpense";
import BillUpload from "./components/BillUpload";
import AIChat from "./components/AIChat";
import MultiAgent from "./components/MultiAgent";
import LandingPage from "./components/LandingPage";
import AuthCallback from "./components/AuthCallback";
import AcceptGrant from "./components/AcceptGrant";

// Main App Content Component (needs to be inside Router)
function AppContent() {
  const location = useLocation();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("dashboard");
  const [stats, setStats] = useState({ total: 0, by_category: {}, count: 0 });
  const [recentExpenses, setRecentExpenses] = useState([]);
  const [insight, setInsight] = useState(null);
  const [loading, setLoading] = useState(false);

  // Check if user is on landing page or special routes
  const isLandingPage = location.pathname === '/';
  const isAuthCallback = location.pathname === '/auth/callback';
  const isAcceptGrant = location.pathname === '/accept-grant';

  const handleGetStarted = () => {
    // This is for demo mode - redirect to dashboard
    navigate('/dashboard');
  };

  // Show landing page
  if (isLandingPage) {
    return <LandingPage onGetStarted={handleGetStarted} />;
  }

  // Show auth callback
  if (isAuthCallback) {
    return <AuthCallback />;
  }

  // Show accept grant page
  if (isAcceptGrant) {
    return <AcceptGrant />;
  }

  // Otherwise show main app
  return (
    <div className="App">
      <Header />
      <Navigation activeTab={activeTab} setActiveTab={setActiveTab} />

      <main className="main-content">
        {activeTab === "dashboard" && (
          <Dashboard
            loading={loading}
            setLoading={setLoading}
            stats={stats}
            setStats={setStats}
            recentExpenses={recentExpenses}
            setRecentExpenses={setRecentExpenses}
            insight={insight}
            setInsight={setInsight}
          />
        )}

        {activeTab === "add-expense" && (
          <AddExpense setActiveTab={setActiveTab} setLoading={setLoading} loading={loading} />
        )}

        {activeTab === "bill-upload" && <BillUpload />}

        {activeTab === "ai-chat" && <AIChat />}

        {activeTab === "multi-agent" && <MultiAgent />}
      </main>
    </div>
  );
}

// Root App Component with Router
function App() {
  return (
    <Router>
      <AppContent />
    </Router>
  );
}

export default App;
