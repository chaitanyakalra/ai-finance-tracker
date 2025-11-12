import { useState } from "react";
import { apiService } from "../utils/api";
import { PlusCircle, Calendar, DollarSign, Tag, FileText, CheckCircle, Loader2, TrendingUp, Zap } from "lucide-react";
import { motion } from "framer-motion";

function AddExpense({ setActiveTab, setLoading, loading }) {
  const [newExpense, setNewExpense] = useState({
    date: new Date().toISOString().split('T')[0],
    amount: "",
    category: "Food",
    description: ""
  });

  const handleAddExpense = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await apiService.createExpense({
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

  const categories = [
    { value: "Food", emoji: "🍔", color: "#10b981" },
    { value: "Transport", emoji: "🚗", color: "#3b82f6" },
    { value: "Shopping", emoji: "🛍️", color: "#f59e0b" },
    { value: "Bills", emoji: "📄", color: "#ef4444" },
    { value: "Entertainment", emoji: "🎬", color: "#8b5cf6" },
    { value: "Others", emoji: "📦", color: "#6b7280" }
  ];

  return (
    <div className="add-expense" data-testid="add-expense-view">
      <motion.div 
        className="page-header"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div>
          <h2>
            <PlusCircle className="page-icon" />
            Add New Expense
          </h2>
          <p className="page-subtitle">Track your spending and let AI analyze your patterns</p>
        </div>
      </motion.div>

      <div className="form-container">
        <motion.form 
          onSubmit={handleAddExpense} 
          className="expense-form" 
          data-testid="expense-form"
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          <div className="form-grid">
            <div className="form-group">
              <label htmlFor="date">
                <Calendar size={18} />
                Date
              </label>
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
              <label htmlFor="amount">
                <DollarSign size={18} />
                Amount (₹)
              </label>
              <input
                id="amount"
                type="number"
                step="0.01"
                placeholder="0.00"
                value={newExpense.amount}
                onChange={(e) => setNewExpense({...newExpense, amount: e.target.value})}
                required
                data-testid="expense-amount-input"
              />
            </div>
          </div>
          
          <div className="form-group">
            <label htmlFor="category">
              <Tag size={18} />
              Category
            </label>
            <div className="category-selector">
              {categories.map((cat, idx) => (
                <motion.button
                  key={cat.value}
                  type="button"
                  className={`category-option ${newExpense.category === cat.value ? 'selected' : ''}`}
                  onClick={() => setNewExpense({...newExpense, category: cat.value})}
                  style={{
                    borderColor: newExpense.category === cat.value ? cat.color : 'transparent',
                    background: newExpense.category === cat.value ? `${cat.color}15` : 'transparent'
                  }}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.3, delay: idx * 0.05 }}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <span className="category-emoji">{cat.emoji}</span>
                  <span className="category-label">{cat.value}</span>
                  {newExpense.category === cat.value && <CheckCircle size={16} style={{ color: cat.color }} />}
                </motion.button>
              ))}
            </div>
          </div>
          
          <div className="form-group">
            <label htmlFor="description">
              <FileText size={18} />
              Description
            </label>
            <input
              id="description"
              type="text"
              placeholder="e.g., Groceries, Uber ride, Movie tickets"
              value={newExpense.description}
              onChange={(e) => setNewExpense({...newExpense, description: e.target.value})}
              required
              data-testid="expense-description-input"
            />
          </div>
          
          <button 
            type="submit" 
            className="submit-button"
            disabled={loading}
            data-testid="submit-expense-button"
          >
            {loading ? (
              <>
                <Loader2 className="button-icon spinning" />
                Adding Expense...
              </>
            ) : (
              <>
                <PlusCircle className="button-icon" />
                Add Expense
              </>
            )}
          </button>
        </motion.form>

        <motion.div 
          className="form-tips"
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <h4>💡 Quick Tips</h4>
          <ul>
            <li>Add expenses regularly for accurate AI insights</li>
            <li>Use descriptive names to track spending better</li>
            <li>Our AI analyzes patterns to help you save money</li>
          </ul>
        </motion.div>
      </div>
    </div>
  );
}

export default AddExpense;

