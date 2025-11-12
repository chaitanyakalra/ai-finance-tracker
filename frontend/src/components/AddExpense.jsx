import { useState } from "react";
import { apiService } from "../utils/api";

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

  return (
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
  );
}

export default AddExpense;

