import { useState, useEffect } from "react";
import { Sparkles, TrendingUp, Shield, Brain, ArrowRight, CheckCircle2, Zap, Users, BarChart3, MessageSquare } from "lucide-react";
import { API_CONFIG } from "../config/api.config";
import "../styles/LandingPage.css";

const LandingPage = ({ onGetStarted }) => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    setIsVisible(true);
  }, []);

  const features = [
    {
      icon: <Brain className="feature-icon" />,
      title: "AI-Powered Insights",
      description: "Get intelligent analysis of your spending patterns with Google Gemini AI"
    },
    {
      icon: <Users className="feature-icon" />,
      title: "Multi-Agent System",
      description: "3 specialized AI agents collaborate to give you comprehensive financial advice"
    },
    {
      icon: <BarChart3 className="feature-icon" />,
      title: "Smart Analytics",
      description: "Visual breakdowns and behavioral insights to understand your finances better"
    },
    {
      icon: <MessageSquare className="feature-icon" />,
      title: "Conversational AI",
      description: "Chat naturally about your expenses and get instant, personalized answers"
    }
  ];

  const agents = [
    {
      emoji: "📊",
      name: "Budget Analyst",
      role: "Analyzes spending patterns and budget implications",
      color: "#3b82f6"
    },
    {
      emoji: "💰",
      name: "Investment Advisor",
      role: "Provides investment and financial planning advice",
      color: "#10b981"
    },
    {
      emoji: "🛡️",
      name: "Risk Assessor",
      role: "Evaluates financial risks and provides warnings",
      color: "#f59e0b"
    }
  ];

  const stats = [
    { value: "3", label: "AI Agents", suffix: "" },
    { value: "100", label: "Accuracy", suffix: "%" },
    { value: "24/7", label: "Available", suffix: "" },
    { value: "∞", label: "Insights", suffix: "" }
  ];

  return (
    <div className={`landing-page ${isVisible ? 'visible' : ''}`}>
      {/* Hero Section */}
      <section className="hero-section">
        <div className="hero-background">
          <div className="gradient-orb orb-1"></div>
          <div className="gradient-orb orb-2"></div>
          <div className="gradient-orb orb-3"></div>
        </div>
        
        <div className="hero-content">
          <div className="hero-badge">
            <Sparkles size={16} />
            <span>Powered by Google Gemini AI</span>
          </div>
          
          <h1 className="hero-title">
            Your <span className="gradient-text">Intelligent</span>
            <br />
            Financial Guardian
          </h1>
          
          <p className="hero-subtitle">
            Experience the future of personal finance with multi-agent AI collaboration.
            Track expenses, get insights, and make smarter financial decisions.
          </p>
          
          <div className="hero-buttons">
            <button 
              className="btn-primary" 
              onClick={() => {
                // Redirect to Google OAuth using configured backend URL
                const backendUrl = API_CONFIG.BASE_URL;
                window.location.href = `${backendUrl}/api/auth/google`;
              }}
            >
              Get Started Free
              <ArrowRight size={20} />
            </button>
            <button className="btn-secondary" onClick={onGetStarted}>
              <Zap size={20} />
              See Demo
            </button>
          </div>

          <div className="hero-stats">
            {stats.map((stat, index) => (
              <div key={index} className="stat-item">
                <div className="stat-value">{stat.value}{stat.suffix}</div>
                <div className="stat-label">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="hero-visual">
          <div className="floating-card card-1">
            <div className="card-icon">💰</div>
            <div className="card-content">
              <div className="card-title">Total Spending</div>
              <div className="card-value">₹15,100</div>
            </div>
          </div>
          
          <div className="floating-card card-2">
            <div className="card-icon">📊</div>
            <div className="card-content">
              <div className="card-title">AI Insight</div>
              <div className="card-text">Food spending up 23%</div>
            </div>
          </div>
          
          <div className="floating-card card-3">
            <div className="card-icon">🎯</div>
            <div className="card-content">
              <div className="card-title">Recommendation</div>
              <div className="card-text">Save ₹2,000 this month</div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="features-section">
        <div className="section-header">
          <h2 className="section-title">Powerful Features</h2>
          <p className="section-subtitle">Everything you need to master your finances</p>
        </div>

        <div className="features-grid">
          {features.map((feature, index) => (
            <div key={index} className="feature-card" style={{ animationDelay: `${index * 0.1}s` }}>
              <div className="feature-icon-wrapper">
                {feature.icon}
              </div>
              <h3 className="feature-title">{feature.title}</h3>
              <p className="feature-description">{feature.description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Multi-Agent Section */}
      <section className="agents-section">
        <div className="section-header">
          <h2 className="section-title">Meet Your AI Team</h2>
          <p className="section-subtitle">Three specialized agents working together for your financial success</p>
        </div>

        <div className="agents-container">
          {agents.map((agent, index) => (
            <div key={index} className="agent-card" style={{ animationDelay: `${index * 0.15}s` }}>
              <div className="agent-emoji" style={{ background: `${agent.color}20`, color: agent.color }}>
                {agent.emoji}
              </div>
              <h3 className="agent-name">{agent.name}</h3>
              <p className="agent-role">{agent.role}</p>
              <div className="agent-status">
                <div className="status-dot"></div>
                <span>Active</span>
              </div>
            </div>
          ))}
        </div>

        <div className="collaboration-visual">
          <div className="collab-line line-1"></div>
          <div className="collab-line line-2"></div>
          <div className="collab-center">
            <Brain size={32} />
            <span>Collaborative Intelligence</span>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="how-it-works-section">
        <div className="section-header">
          <h2 className="section-title">How It Works</h2>
          <p className="section-subtitle">Get started in three simple steps</p>
        </div>

        <div className="steps-container">
          <div className="step-card">
            <div className="step-number">1</div>
            <div className="step-content">
              <h3>Track Expenses</h3>
              <p>Add your daily expenses across multiple categories</p>
            </div>
          </div>

          <div className="step-arrow">→</div>

          <div className="step-card">
            <div className="step-number">2</div>
            <div className="step-content">
              <h3>AI Analysis</h3>
              <p>Our multi-agent system analyzes your spending patterns</p>
            </div>
          </div>

          <div className="step-arrow">→</div>

          <div className="step-card">
            <div className="step-number">3</div>
            <div className="step-content">
              <h3>Get Insights</h3>
              <p>Receive personalized recommendations and insights</p>
            </div>
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="benefits-section">
        <div className="benefits-content">
          <div className="benefits-text">
            <h2 className="section-title">Why Choose FinanceGuard AI?</h2>
            <ul className="benefits-list">
              <li>
                <CheckCircle2 className="check-icon" />
                <span>Real-time AI-powered expense analysis</span>
              </li>
              <li>
                <CheckCircle2 className="check-icon" />
                <span>Multi-agent collaboration for comprehensive advice</span>
              </li>
              <li>
                <CheckCircle2 className="check-icon" />
                <span>Behavioral finance insights to improve spending habits</span>
              </li>
              <li>
                <CheckCircle2 className="check-icon" />
                <span>Natural language chat interface</span>
              </li>
              <li>
                <CheckCircle2 className="check-icon" />
                <span>Secure and private - your data stays yours</span>
              </li>
              <li>
                <CheckCircle2 className="check-icon" />
                <span>Free to use with unlimited insights</span>
              </li>
            </ul>
          </div>

          <div className="benefits-visual">
            <div className="benefit-card">
              <TrendingUp size={48} className="benefit-icon" />
              <h3>Smart Tracking</h3>
              <p>Monitor every rupee with intelligent categorization</p>
            </div>
            <div className="benefit-card">
              <Shield size={48} className="benefit-icon" />
              <h3>Risk Assessment</h3>
              <p>Get warnings about potential financial risks</p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="cta-section">
        <div className="cta-content">
          <h2 className="cta-title">Ready to Transform Your Finances?</h2>
          <p className="cta-subtitle">Join the future of personal finance management today</p>
          <button 
            className="btn-cta" 
            onClick={() => {
              // Redirect to Google OAuth
              const backendUrl = import.meta.env.VITE_API_BASE_URL || import.meta.env.VITE_BACKEND_URL || 'http://localhost:8000';
              window.location.href = `${backendUrl}/api/auth/google`;
            }}
          >
            Start Your Journey
            <ArrowRight size={24} />
          </button>
          <p className="cta-note">No credit card required • Free forever • Setup in 2 minutes</p>
        </div>
      </section>

      {/* Footer */}
      <footer className="landing-footer">
        <div className="footer-content">
          <div className="footer-brand">
            <h3>FinanceGuard AI</h3>
            <p>Your intelligent financial companion</p>
          </div>
          <div className="footer-info">
            <p>B.Tech Final Year Project</p>
            <p>Powered by Google Gemini AI & MongoDB</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
