import { useState, useEffect } from "react";
import { BrowserRouter as Router, Routes, Route, useLocation, useNavigate } from "react-router-dom";
import "@/App.css";
import Header from "./components/Header";
import Navigation from "./components/Navigation";
import Dashboard from "./components/Dashboard";
import AddExpense from "./components/AddExpense";
import AIChat from "./components/AIChat";
import MultiAgent from "./components/MultiAgent";
import LandingPage from "./components/LandingPage";
import AuthCallback from "./components/AuthCallback";

// Main App Content Component (needs to be inside Router)
function AppContent() {
  const location = useLocation();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("dashboard");
  const [stats, setStats] = useState({ total: 0, by_category: {}, count: 0 });
  const [recentExpenses, setRecentExpenses] = useState([]);
  const [insight, setInsight] = useState(null);
  const [loading, setLoading] = useState(false);

  // Check if user is on landing page
  const isLandingPage = location.pathname === '/';

  const handleGetStarted = () => {
    // This is for demo mode - redirect to dashboard
    navigate('/dashboard');
  };

  // If on landing page, show landing page
  if (isLandingPage) {
    return <LandingPage onGetStarted={handleGetStarted} />;
  }

  // If on auth callback, show callback handler
  if (location.pathname === '/auth/callback') {
    return <AuthCallback />;
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

// import { useState } from "react";
// import { BrowserRouter as Router, Routes, Route, Link } from "react-router-dom";
// import "@/App.css";

// import Header from "./components/Header";
// import LandingPage from "./components/LandingPage";
// import Dashboard from "./components/Dashboard";
// import AddExpense from "./components/AddExpense";
// import AIChat from "./components/AIChat";
// import MultiAgent from "./components/MultiAgent";

// function App() {
//   const [stats, setStats] = useState({ total: 0, by_category: {}, count: 0 });
//   const [recentExpenses, setRecentExpenses] = useState([]);
//   const [insight, setInsight] = useState(null);
//   const [loading, setLoading] = useState(false);

//   return (
//     <Router>
//       <div className="App">
//         <Header />

//         {/* Navigation bar */}
//         <nav className="navigation">
//           <ul>
//             <li>
//               <Link to="/">Landing</Link>
//             </li>
//             <li>
//               <Link to="/dashboard">Dashboard</Link>
//             </li>
//             <li>
//               <Link to="/add-expense">Add Expense</Link>
//             </li>
//             <li>
//               <Link to="/ai-chat">AI Chat</Link>
//             </li>
//             <li>
//               <Link to="/multi-agent">Multi-Agent</Link>
//             </li>
//           </ul>
//         </nav>

//         <main className="main-content">
//           <Routes>
//             {/* Landing page */}
//             <Route path="/" element={<LandingPage />} />

//             {/* Dashboard */}
//             <Route
//               path="/dashboard"
//               element={
//                 <Dashboard
//                   loading={loading}
//                   setLoading={setLoading}
//                   stats={stats}
//                   setStats={setStats}
//                   recentExpenses={recentExpenses}
//                   setRecentExpenses={setRecentExpenses}
//                   insight={insight}
//                   setInsight={setInsight}
//                 />
//               }
//             />

//             {/* Add Expense */}
//             <Route
//               path="/add-expense"
//               element={<AddExpense loading={loading} setLoading={setLoading} />}
//             />

//             {/* AI Chat */}
//             <Route path="/ai-chat" element={<AIChat />} />

//             {/* Multi-Agent */}
//             <Route path="/multi-agent" element={<MultiAgent />} />

//             {/* Fallback */}
//             <Route path="*" element={<LandingPage />} />
//           </Routes>
//         </main>
//       </div>
//     </Router>
//   );
// }

// export default App;

