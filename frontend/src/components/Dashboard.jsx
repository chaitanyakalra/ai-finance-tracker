import { useEffect, useState } from "react";
import { apiService } from "../utils/api";
import { Wallet, Receipt, TrendingUp, Calendar, Tag, DollarSign, Sparkles, Brain, Loader2, ArrowUpRight, ArrowDownRight, PieChart, BarChart3 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Chart as ChartJS, ArcElement, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend } from 'chart.js';
import { Doughnut, Bar } from 'react-chartjs-2';

ChartJS.register(ArcElement, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

function Dashboard({ loading, setLoading, stats, setStats, recentExpenses, setRecentExpenses, insight, setInsight }) {
  const [activeChart, setActiveChart] = useState('doughnut');
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

  const categoryIcons = {
    Food: "🍔",
    Transport: "🚗",
    Shopping: "🛍️",
    Bills: "📄",
    Entertainment: "🎬",
    Others: "📦"
  };

  const categoryColors = {
    Food: "#10b981",
    Transport: "#3b82f6",
    Shopping: "#f59e0b",
    Bills: "#ef4444",
    Entertainment: "#8b5cf6",
    Others: "#6b7280"
  };

  // Chart data
  const doughnutData = {
    labels: Object.keys(stats.by_category || {}),
    datasets: [{
      data: Object.values(stats.by_category || {}),
      backgroundColor: Object.keys(stats.by_category || {}).map(cat => categoryColors[cat] || "#6b7280"),
      borderColor: 'rgba(255, 255, 255, 0.1)',
      borderWidth: 2,
      hoverOffset: 20
    }]
  };

  const barData = {
    labels: Object.keys(stats.by_category || {}),
    datasets: [{
      label: 'Spending by Category',
      data: Object.values(stats.by_category || {}),
      backgroundColor: Object.keys(stats.by_category || {}).map(cat => categoryColors[cat] || "#6b7280"),
      borderRadius: 8,
      borderSkipped: false,
    }]
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false
      },
      tooltip: {
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        padding: 12,
        titleColor: '#fff',
        bodyColor: '#fff',
        borderColor: 'rgba(255, 255, 255, 0.1)',
        borderWidth: 1,
        displayColors: true,
        callbacks: {
          label: function(context) {
            return `₹${context.parsed.toFixed(2)}`;
          }
        }
      }
    }
  };

  const barOptions = {
    ...chartOptions,
    scales: {
      y: {
        beginAtZero: true,
        grid: {
          color: 'rgba(255, 255, 255, 0.05)',
        },
        ticks: {
          color: 'rgba(255, 255, 255, 0.6)',
          callback: function(value) {
            return '₹' + value;
          }
        }
      },
      x: {
        grid: {
          display: false
        },
        ticks: {
          color: 'rgba(255, 255, 255, 0.6)'
        }
      }
    }
  };

  return (
    <div className="dashboard" data-testid="dashboard-view">
      <motion.div 
        className="dashboard-header"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div>
          <h2>
            <TrendingUp className="page-icon" />
            Financial Overview
          </h2>
          <p className="page-subtitle">Track your spending and get AI-powered insights</p>
        </div>
      </motion.div>
      
      {loading ? (
        <div className="loading-container" data-testid="loading-text">
          <Loader2 className="loading-spinner" />
          <p>Loading your financial data...</p>
        </div>
      ) : (
        <>
          <div className="stats-grid">
            <motion.div 
              className="stat-card stat-card-primary" 
              data-testid="total-spending-card"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              whileHover={{ scale: 1.02, y: -5 }}
            >
              <div className="stat-icon-wrapper">
                <Wallet className="stat-icon" />
              </div>
              <div className="stat-content">
                <h3>Total Spending</h3>
                <p className="stat-value" data-testid="total-spending-value">₹{stats.total?.toFixed(2) || 0}</p>
                <div className="stat-footer">
                  <span className="stat-label">This period</span>
                  <span className="stat-trend positive">
                    <ArrowUpRight size={16} />
                    12.5%
                  </span>
                </div>
              </div>
            </motion.div>
            
            <motion.div 
              className="stat-card stat-card-secondary" 
              data-testid="expense-count-card"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              whileHover={{ scale: 1.02, y: -5 }}
            >
              <div className="stat-icon-wrapper">
                <Receipt className="stat-icon" />
              </div>
              <div className="stat-content">
                <h3>Total Transactions</h3>
                <p className="stat-value" data-testid="expense-count-value">{stats.count || 0}</p>
                <div className="stat-footer">
                  <span className="stat-label">Recorded expenses</span>
                  <span className="stat-trend positive">
                    <ArrowUpRight size={16} />
                    8.2%
                  </span>
                </div>
              </div>
            </motion.div>

            <motion.div 
              className="stat-card stat-card-accent"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5, delay: 0.3 }}
              whileHover={{ scale: 1.02, y: -5 }}
            >
              <div className="stat-icon-wrapper">
                <DollarSign className="stat-icon" />
              </div>
              <div className="stat-content">
                <h3>Average Expense</h3>
                <p className="stat-value">₹{stats.count ? (stats.total / stats.count).toFixed(2) : 0}</p>
                <div className="stat-footer">
                  <span className="stat-label">Per transaction</span>
                  <span className="stat-trend negative">
                    <ArrowDownRight size={16} />
                    3.1%
                  </span>
                </div>
              </div>
            </motion.div>
          </div>

          {/* Charts Section */}
          <motion.div 
            className="charts-section"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.4 }}
          >
            <div className="chart-card">
              <div className="chart-header">
                <h3>
                  <PieChart className="section-icon" />
                  Spending Distribution
                </h3>
                <div className="chart-toggle">
                  <button 
                    className={activeChart === 'doughnut' ? 'active' : ''}
                    onClick={() => setActiveChart('doughnut')}
                  >
                    <PieChart size={18} />
                  </button>
                  <button 
                    className={activeChart === 'bar' ? 'active' : ''}
                    onClick={() => setActiveChart('bar')}
                  >
                    <BarChart3 size={18} />
                  </button>
                </div>
              </div>
              <div className="chart-container">
                <AnimatePresence mode="wait">
                  {activeChart === 'doughnut' ? (
                    <motion.div
                      key="doughnut"
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.8 }}
                      transition={{ duration: 0.3 }}
                      style={{ height: '300px' }}
                    >
                      <Doughnut data={doughnutData} options={chartOptions} />
                    </motion.div>
                  ) : (
                    <motion.div
                      key="bar"
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.8 }}
                      transition={{ duration: 0.3 }}
                      style={{ height: '300px' }}
                    >
                      <Bar data={barData} options={barOptions} />
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
              <div className="chart-legend">
                {Object.entries(stats.by_category || {}).map(([category, amount]) => (
                  <div key={category} className="legend-item">
                    <span className="legend-color" style={{ background: categoryColors[category] }}></span>
                    <span className="legend-label">{categoryIcons[category]} {category}</span>
                    <span className="legend-value">₹{amount.toFixed(2)}</span>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>

          <motion.div 
            className="category-breakdown" 
            data-testid="category-breakdown"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.5 }}
          >
            <div className="section-header-inline">
              <h3>
                <Tag className="section-icon" />
                Spending by Category
              </h3>
            </div>
            <div className="category-list">
              {Object.entries(stats.by_category || {}).map(([category, amount]) => (
                <div key={category} className="category-item" data-testid={`category-${category.toLowerCase()}`}>
                  <div className="category-header">
                    <div className="category-info">
                      <span className="category-emoji">{categoryIcons[category] || "📦"}</span>
                      <span className="category-name">{category}</span>
                    </div>
                    <div className="category-stats">
                      <span className="category-percentage">
                        {((amount / stats.total) * 100).toFixed(1)}%
                      </span>
                      <span className="category-amount">₹{amount.toFixed(2)}</span>
                    </div>
                  </div>
                  <div className="category-bar">
                    <div 
                      className="category-bar-fill" 
                      style={{
                        width: `${(amount / stats.total) * 100}%`,
                        background: categoryColors[category] || "#6b7280"
                      }}
                    ></div>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>

          <motion.div 
            className="recent-transactions" 
            data-testid="recent-transactions"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.6 }}
          >
            <div className="section-header-inline">
              <h3>
                <Calendar className="section-icon" />
                Recent Transactions
              </h3>
              <span className="transaction-count">{recentExpenses.length} transactions</span>
            </div>
            <div className="transaction-list">
              {recentExpenses.map((exp, idx) => (
                <motion.div 
                  key={exp.id || idx} 
                  className="transaction-item" 
                  data-testid={`transaction-${idx}`}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.3, delay: idx * 0.05 }}
                  whileHover={{ x: 10, scale: 1.02 }}
                >
                  <div className="transaction-icon" style={{ background: `${categoryColors[exp.category] || "#6b7280"}20` }}>
                    <span>{categoryIcons[exp.category] || "📦"}</span>
                  </div>
                  <div className="transaction-info">
                    <span className="transaction-desc">{exp.description}</span>
                    <div className="transaction-meta">
                      <Calendar size={14} />
                      <span className="transaction-date">{exp.date}</span>
                      <span className="transaction-separator">•</span>
                      <Tag size={14} />
                      <span className="transaction-category">{exp.category}</span>
                    </div>
                  </div>
                  <div className="transaction-amount" style={{ color: categoryColors[exp.category] || "#6b7280" }}>
                    ₹{exp.amount}
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>

          {insight && (
            <motion.div 
              className="insight-card" 
              data-testid="insight-card"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5, delay: 0.7 }}
            >
              <div className="insight-header">
                <h3>
                  <Brain className="section-icon" />
                  AI Behavioral Insight
                </h3>
                <Sparkles className="insight-sparkle" />
              </div>
              <div className="insight-content" data-testid="insight-content">
                <MarkdownLite text={insight.insight} />
              </div>
            </motion.div>
          )}
        </>
      )}
    </div>
  );
}

export default Dashboard;

function MarkdownLite({ text, className = "response-content" }) {
  const renderInline = (t) => {
    const parts = [];
    const regex = /\*\*([^*]+)\*\*/g;
    let last = 0;
    let m;
    while ((m = regex.exec(t)) !== null) {
      if (m.index > last) parts.push(t.slice(last, m.index));
      parts.push(<strong key={parts.length}>{m[1]}</strong>);
      last = regex.lastIndex;
    }
    if (last < t.length) parts.push(t.slice(last));
    return parts;
  };
  const lines = String(text || "").split(/\r?\n/);
  const elements = [];
  let list = [];
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmed = line.trim();
    if (!trimmed) {
      if (list.length) {
        elements.push(
          <ul key={`ul-${elements.length}`}>
            {list.map((li, idx) => (
              <li key={`li-${idx}`}>{renderInline(li)}</li>
            ))}
          </ul>
        );
        list = [];
      }
      continue;
    }
    const bullet = trimmed.match(/^[-*]\s+(.*)$/);
    if (bullet) {
      list.push(bullet[1]);
      continue;
    }
    if (list.length) {
      elements.push(
        <ul key={`ul-${elements.length}`}>
          {list.map((li, idx) => (
            <li key={`li-${idx}`}>{renderInline(li)}</li>
          ))}
        </ul>
      );
      list = [];
    }
    elements.push(<p key={`p-${elements.length}`}>{renderInline(line)}</p>);
  }
  if (list.length) {
    elements.push(
      <ul key={`ul-${elements.length}`}>
        {list.map((li, idx) => (
          <li key={`li-${idx}`}>{renderInline(li)}</li>
        ))}
      </ul>
    );
  }
  return <div className={className}>{elements}</div>;
}
