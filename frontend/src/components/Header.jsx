import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Sparkles, TrendingUp, Shield, Brain, LogOut } from "lucide-react";

function Header() {
  const navigate = useNavigate();
  const location = useLocation();
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    // Check if user is authenticated
    const authToken = localStorage.getItem('authToken');
    setIsAuthenticated(!!authToken);
  }, [location.pathname]); // Re-check when route changes

  const handleLogout = () => {
    // Remove all tokens from localStorage
    localStorage.removeItem('authToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('userId');
    
    // Update authentication state
    setIsAuthenticated(false);
    
    // Redirect to main dashboard (landing page)
    navigate('/');
  };

  return (
    <header className="app-header" data-testid="app-header">
      <div className="header-background">
        <div className="header-orb orb-1"></div>
        <div className="header-orb orb-2"></div>
      </div>
      <div className="header-content">
        <div className="header-logo">
          <Shield className="logo-icon" />
          <div className="header-text">
            <h1 data-testid="app-title">FinanceGuard AI</h1>
            <p className="subtitle">
              <Sparkles size={14} />
              Multi-Agent Intelligent Financial Assistant
            </p>
          </div>
        </div>
        <div className="header-right">
          <div className="header-badges">
            <div className="header-badge">
              <Brain size={16} />
              <span>AI Powered</span>
            </div>
            <div className="header-badge">
              <TrendingUp size={16} />
              <span>Real-time Insights</span>
            </div>
          </div>
          {isAuthenticated && (
            <button 
              className="logout-button" 
              onClick={handleLogout}
              title="Logout"
            >
              <LogOut size={18} />
              <span>Logout</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
}

export default Header;

