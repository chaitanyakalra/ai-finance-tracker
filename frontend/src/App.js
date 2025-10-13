import { useState, useEffect } from "react";
import "@/App.css";
import axios from "axios";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

function App() {
  const [activeTab, setActiveTab] = useState("dashboard");
  const [expenses, setExpenses] = useState([]);
  const [stats, setStats] = useState({ total: 0, by_category: {}, count: 0 });
  const [recentExpenses, setRecentExpenses] = useState([]);
  const [insight, setInsight] = useState(null);
  const [loading, setLoading] = useState(false);
  
  // Add Expense form
  const [newExpense, setNewExpense] = useState({
    date: new Date().toISOString().split('T')[0],
    amount: "",
    category: "Food",
    description: ""
  });
  
  // AI Chat
  const [chatQuestion, setChatQuestion] = useState("");
  const [chatResponse, setChatResponse] = useState("");
  const [chatLoading, setChatLoading] = useState(false);
  
  // Multi-Agent
  const [agentQuestion, setAgentQuestion] = useState("");
  const [agentResponses, setAgentResponses] = useState([]);
  const [agentSummary, setAgentSummary] = useState("");
  const [agentLoading, setAgentLoading] = useState(false);
  const [displayIndex, setDisplayIndex] = useState(0);

  useEffect(() => {
    if (activeTab === "dashboard") {
      loadDashboardData();
    }
  }, [activeTab]);

  const loadDashboardData = async () => {
    setLoading(true);
    try {
      const [statsRes, recentRes, insightRes] = await Promise.all([
        axios.get(`${API}/expenses/stats`),
        axios.get(`${API}/expenses/recent`),
        axios.get(`${API}/ai/behavioral-insight`)
      ]);
      
      setStats(statsRes.data);
      setRecentExpenses(recentRes.data);
      setInsight(insightRes.data);
    } catch (error) {
      console.error("Error loading dashboard:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddExpense = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await axios.post(`${API}/expenses`, {
        ...newExpense,
        amount: parseFloat(newExpense.amount)
      });
      
      setNewExpense({
        date: new Date().toISOString().split('T')[0],
        amount: "",
        category: "Food",
        description: ""
      });
      
      alert("Expense added successfully!");
      setActiveTab("dashboard");
    } catch (error) {
      console.error("Error adding expense:", error);
      alert("Failed to add expense");
    } finally {
      setLoading(false);
    }
  };

  const handleAIChat = async (e) => {
    e.preventDefault();
    if (!chatQuestion.trim()) return;
    
    setChatLoading(true);
    setChatResponse("");
    
    try {
      const response = await axios.post(`${API}/ai/chat`, {
        question: chatQuestion
      });
      
      setChatResponse(response.data.response);
    } catch (error) {
      console.error("Error in AI chat:", error);
      setChatResponse("Error: Failed to get AI response");
    } finally {
      setChatLoading(false);
    }
  };

  const handleMultiAgent = async (e) => {
    e.preventDefault();
    if (!agentQuestion.trim()) return;
    
    setAgentLoading(true);
    setAgentResponses([]);
    setAgentSummary("");
    setDisplayIndex(0);
    
    try {
      const response = await axios.post(`${API}/ai/multi-agent`, {
        question: agentQuestion
      });
      
      setAgentResponses(response.data.agents);
      setAgentSummary(response.data.summary);
      
      // Animate display
      response.data.agents.forEach((_, index) => {
        setTimeout(() => {
          setDisplayIndex(index + 1);
        }, (index + 1) * 1500);
      });
    } catch (error) {
      console.error("Error in multi-agent:", error);
      setAgentResponses([{agent: "Error", emoji: "❌", response: "Failed to get agent responses"}]);
    } finally {
      setAgentLoading(false);
    }
  };

  return (
    <div className="App">
      <header className="app-header" data-testid="app-header">
        <h1 data-testid="app-title">FinanceGuard AI</h1>
        <p className="subtitle">Multi-Agent Intelligent Financial Assistant</p>
      </header>

      <nav className="nav-tabs" data-testid="nav-tabs">
        <button 
          className={activeTab === "dashboard" ? "active" : ""}
          onClick={() => setActiveTab("dashboard")}
          data-testid="nav-dashboard"
        >
          Dashboard
        </button>
        <button 
          className={activeTab === "add-expense" ? "active" : ""}
          onClick={() => setActiveTab("add-expense")}
          data-testid="nav-add-expense"
        >
          Add Expense
        </button>
        <button 
          className={activeTab === "ai-chat" ? "active" : ""}
          onClick={() => setActiveTab("ai-chat")}
          data-testid="nav-ai-chat"
        >
          AI Chat
        </button>
        <button 
          className={activeTab === "multi-agent" ? "active" : ""}
          onClick={() => setActiveTab("multi-agent")}
          data-testid="nav-multi-agent"
        >
          Multi-Agent Demo
        </button>
      </nav>

      <main className="main-content">
        {activeTab === "dashboard" && (
          <div className="dashboard" data-testid="dashboard-view">
            <h2>Dashboard</h2>
            
            {loading ? (
              <p data-testid="loading-text">Loading dashboard data...</p>
            ) : (
              <>
                <div className="stats-grid">
                  <div className="stat-card" data-testid="total-spending-card">
                    <h3>Total Spending</h3>
                    <p className="stat-value" data-testid="total-spending-value">₹{stats.total?.toFixed(2) || 0}</p>
                  </div>
                  
                  <div className="stat-card" data-testid="expense-count-card">
                    <h3>Total Transactions</h3>
                    <p className="stat-value" data-testid="expense-count-value">{stats.count || 0}</p>
                  </div>
                </div>

                <div className="category-breakdown" data-testid="category-breakdown">
                  <h3>Spending by Category</h3>
                  <div className="category-list">
                    {Object.entries(stats.by_category || {}).map(([category, amount]) => (
                      <div key={category} className="category-item" data-testid={`category-${category.toLowerCase()}`}>
                        <span className="category-name">{category}</span>
                        <span className="category-amount">₹{amount.toFixed(2)}</span>
                        <div className="category-bar">
                          <div 
                            className="category-bar-fill" 
                            style={{width: `${(amount / stats.total) * 100}%`}}
                          ></div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="recent-transactions" data-testid="recent-transactions">
                  <h3>Recent Transactions</h3>
                  <div className="transaction-list">
                    {recentExpenses.map((exp, idx) => (
                      <div key={exp.id || idx} className="transaction-item" data-testid={`transaction-${idx}`}>
                        <div className="transaction-info">
                          <span className="transaction-date">{exp.date}</span>
                          <span className="transaction-desc">{exp.description}</span>
                        </div>
                        <div className="transaction-details">
                          <span className="transaction-category">{exp.category}</span>
                          <span className="transaction-amount">₹{exp.amount}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {insight && (
                  <div className="insight-card" data-testid="insight-card">
                    <h3>🧠 Behavioral Finance Insight</h3>
                    <div className="insight-content" data-testid="insight-content">
                      <pre style={{whiteSpace: 'pre-wrap', fontFamily: 'inherit'}}>{insight.insight}</pre>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        )}

        {activeTab === "add-expense" && (
          <div className="add-expense" data-testid="add-expense-view">
            <h2>Add New Expense</h2>
            <form onSubmit={handleAddExpense} className="expense-form" data-testid="expense-form">
              <div className="form-group">
                <label htmlFor="date">Date</label>
                <input
                  id="date"
                  type="date"
                  value={newExpense.date}
                  onChange={(e) => setNewExpense({...newExpense, date: e.target.value})}
                  required
                  data-testid="expense-date-input"
                />
              </div>
              
              <div className="form-group">
                <label htmlFor="amount">Amount (₹)</label>
                <input
                  id="amount"
                  type="number"
                  step="0.01"
                  value={newExpense.amount}
                  onChange={(e) => setNewExpense({...newExpense, amount: e.target.value})}
                  required
                  data-testid="expense-amount-input"
                />
              </div>
              
              <div className="form-group">
                <label htmlFor="category">Category</label>
                <select
                  id="category"
                  value={newExpense.category}
                  onChange={(e) => setNewExpense({...newExpense, category: e.target.value})}
                  required
                  data-testid="expense-category-select"
                >
                  <option value="Food">Food</option>
                  <option value="Transport">Transport</option>
                  <option value="Shopping">Shopping</option>
                  <option value="Bills">Bills</option>
                  <option value="Entertainment">Entertainment</option>
                  <option value="Others">Others</option>
                </select>
              </div>
              
              <div className="form-group">
                <label htmlFor="description">Description</label>
                <input
                  id="description"
                  type="text"
                  value={newExpense.description}
                  onChange={(e) => setNewExpense({...newExpense, description: e.target.value})}
                  required
                  data-testid="expense-description-input"
                />
              </div>
              
              <button 
                type="submit" 
                disabled={loading}
                data-testid="submit-expense-button"
              >
                {loading ? "Adding..." : "Add Expense"}
              </button>
            </form>
          </div>
        )}

        {activeTab === "ai-chat" && (
          <div className="ai-chat" data-testid="ai-chat-view">
            <h2>AI Financial Insights</h2>
            <p className="help-text">Ask questions about your expenses and get AI-powered insights.</p>
            
            <form onSubmit={handleAIChat} className="chat-form" data-testid="chat-form">
              <textarea
                value={chatQuestion}
                onChange={(e) => setChatQuestion(e.target.value)}
                placeholder="E.g., How much did I spend on food? What are my spending patterns?"
                rows="3"
                data-testid="chat-question-input"
              />
              <button 
                type="submit" 
                disabled={chatLoading}
                data-testid="chat-submit-button"
              >
                {chatLoading ? "Analyzing..." : "Ask AI"}
              </button>
            </form>
            
            {chatResponse && (
              <div className="chat-response" data-testid="chat-response">
                <h3>AI Response:</h3>
                <p>{chatResponse}</p>
              </div>
            )}
          </div>
        )}

        {activeTab === "multi-agent" && (
          <div className="multi-agent" data-testid="multi-agent-view">
            <h2>Multi-Agent Financial Analysis</h2>
            <p className="help-text">Get comprehensive financial advice from multiple AI specialists.</p>
            
            <form onSubmit={handleMultiAgent} className="agent-form" data-testid="agent-form">
              <input
                type="text"
                value={agentQuestion}
                onChange={(e) => setAgentQuestion(e.target.value)}
                placeholder="E.g., Should I buy a laptop for ₹50,000?"
                data-testid="agent-question-input"
              />
              <button 
                type="submit" 
                disabled={agentLoading}
                data-testid="agent-submit-button"
              >
                {agentLoading ? "Consulting Agents..." : "Get Multi-Agent Analysis"}
              </button>
            </form>
            
            {agentResponses.length > 0 && (
              <div className="agent-responses" data-testid="agent-responses">
                {agentResponses.map((agent, index) => (
                  <div 
                    key={index} 
                    className={`agent-response ${index < displayIndex ? 'visible' : 'hidden'}`}
                    data-testid={`agent-response-${index}`}
                  >
                    <h3>
                      <span className="agent-emoji">{agent.emoji}</span>
                      {agent.agent}
                    </h3>
                    <p className="agent-text">{agent.response}</p>
                  </div>
                ))}
                
                {displayIndex >= agentResponses.length && agentSummary && (
                  <div className="agent-summary" data-testid="agent-summary">
                    <h3>📋 Final Recommendation</h3>
                    <p>{agentSummary}</p>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}

export default App;