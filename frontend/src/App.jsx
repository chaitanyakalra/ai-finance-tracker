import { useState } from "react";
import "@/App.css";
import Header from "./components/Header";
import Navigation from "./components/Navigation";
import Dashboard from "./components/Dashboard";
import AddExpense from "./components/AddExpense";
import AIChat from "./components/AIChat";
import MultiAgent from "./components/MultiAgent";
import LandingPage from "./components/LandingPage";

function App() {
  const [showLanding, setShowLanding] = useState(true);
  const [activeTab, setActiveTab] = useState("dashboard");
  const [stats, setStats] = useState({ total: 0, by_category: {}, count: 0 });
  const [recentExpenses, setRecentExpenses] = useState([]);
  const [insight, setInsight] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleGetStarted = () => {
    setShowLanding(false);
  };

  if (showLanding) {
    return <LandingPage onGetStarted={handleGetStarted} />;
  }

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

        {activeTab === "ai-chat" && <AIChat />}

        {activeTab === "multi-agent" && <MultiAgent />}
      </main>
    </div>
  );
}

export default App;
