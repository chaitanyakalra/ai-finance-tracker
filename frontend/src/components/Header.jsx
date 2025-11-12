import { Sparkles, TrendingUp, Shield, Brain } from "lucide-react";

function Header() {
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
      </div>
    </header>
  );
}

export default Header;

