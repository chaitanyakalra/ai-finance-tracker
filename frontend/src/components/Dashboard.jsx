import { useEffect } from "react";
import { apiService } from "../utils/api";

function Dashboard({ loading, setLoading, stats, setStats, recentExpenses, setRecentExpenses, insight, setInsight }) {
  const loadDashboardData = async () => {
    setLoading(true);
    try {
      const [statsRes, recentRes, insightRes] = await Promise.all([
        apiService.getExpenseStats(),
        apiService.getRecentExpenses(),
        apiService.getBehavioralInsight()
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

  useEffect(() => {
    loadDashboardData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
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
  );
}

export default Dashboard;

