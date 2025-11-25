import { useState, useEffect } from "react";
import { apiService } from "../utils/api";
import { PlusCircle, Calendar, DollarSign, Tag, FileText, CheckCircle, Loader2, TrendingUp, Zap, Users, UserCheck } from "lucide-react";
import { motion } from "framer-motion";

function AddExpense({ setActiveTab, setLoading, loading }) {
  const [newExpense, setNewExpense] = useState({
    date: new Date().toISOString().split('T')[0],
    amount: "",
    category: "Food",
    description: ""
  });

  const [splitExpense, setSplitExpense] = useState(false);
  const [groups, setGroups] = useState([]);
  const [selectedGroup, setSelectedGroup] = useState("");
  const [loadingGroups, setLoadingGroups] = useState(false);

  // Split options: 'equal' or 'select'
  const [splitType, setSplitType] = useState('equal');
  const [selectedMembers, setSelectedMembers] = useState([]);
  const [groupMembers, setGroupMembers] = useState([]);
  const [loadingMembers, setLoadingMembers] = useState(false);

  // Fetch groups when split expense is enabled
  useEffect(() => {
    if (splitExpense) {
      fetchGroups();
    } else {
      // Reset when unchecked
      setSelectedGroup("");
      setSplitType('equal');
      setSelectedMembers([]);
      setGroupMembers([]);
    }
  }, [splitExpense]);

  // Fetch group members when group is selected
  useEffect(() => {
    if (selectedGroup) {
      fetchGroupMembers();
    }
  }, [selectedGroup]);

  const fetchGroups = async () => {
    setLoadingGroups(true);
    try {
      const response = await apiService.getUserGroups();
      setGroups(response.data);
      if (response.data.length > 0) {
        setSelectedGroup(response.data[0].id);
      }
    } catch (error) {
      console.error("Error fetching groups:", error);
      alert("Failed to load groups");
    } finally {
      setLoadingGroups(false);
    }
  };


  const fetchGroupMembers = async () => {
    setLoadingMembers(true);
    try {
      const response = await apiService.getGroupMembers(selectedGroup);
      const currentUserId = localStorage.getItem('userId');

      // Filter out the current user - they can't owe themselves money!
      const otherMembers = (response.data.members || []).filter(
        member => member.userId !== currentUserId
      );

      setGroupMembers(otherMembers);

      // Pre-select all OTHER members for equal split (excluding yourself)
      if (splitType === 'equal') {
        setSelectedMembers(otherMembers.map(m => m.userId));
      }
    } catch (error) {
      console.error("Error fetching group members:", error);
    } finally {
      setLoadingMembers(false);
    }
  };

  const toggleMemberSelection = (userId) => {
    setSelectedMembers(prev => {
      if (prev.includes(userId)) {
        return prev.filter(id => id !== userId);
      } else {
        return [...prev, userId];
      }
    });
  };

  const handleSplitTypeChange = (type) => {
    setSplitType(type);
    if (type === 'equal') {
      // Select all members
      setSelectedMembers(groupMembers.map(m => m.userId));
    } else if (type === 'full') {
      // Clear selection - user will select ONE person
      setSelectedMembers([]);
    } else {
      // Clear selection for manual selection
      setSelectedMembers([]);
    }
  };

  const handleAddExpense = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (splitExpense && selectedGroup) {
        // Validate member selection for custom split
        if (splitType === 'select' && selectedMembers.length === 0) {
          alert("Please select at least one member to split with");
          setLoading(false);
          return;
        }

        // Validate member selection for full amount
        if (splitType === 'full' && selectedMembers.length !== 1) {
          alert("Please select exactly one person who owes the full amount");
          setLoading(false);
          return;
        }

        // Create shared expense
        await apiService.createSharedExpense({
          groupId: selectedGroup,
          ...newExpense,
          amount: parseFloat(newExpense.amount),
          splitType,
          selectedMembers: (splitType === 'select' || splitType === 'full') ? selectedMembers : []
        });

        const memberText = splitType === 'equal'
          ? 'all group members'
          : splitType === 'full'
            ? '1 person (full amount)'
            : `${selectedMembers.length} selected member(s)`;
        alert(`Shared expense created and split among ${memberText}!`);
      } else {
        // Create regular expense
        await apiService.createExpense({
          ...newExpense,
          amount: parseFloat(newExpense.amount)
        });
        alert("Expense added successfully!");
      }

      setNewExpense({
        date: new Date().toISOString().split('T')[0],
        amount: "",
        category: "Food",
        description: ""
      });
      setSplitExpense(false);
      setSelectedGroup("");

      setActiveTab("dashboard");
    } catch (error) {
      console.error("Error adding expense:", error);
      const errorMessage = error.response?.data?.error || "Failed to add expense";
      alert(errorMessage);
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
                onChange={(e) => setNewExpense({ ...newExpense, date: e.target.value })}
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
                onChange={(e) => setNewExpense({ ...newExpense, amount: e.target.value })}
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
                  onClick={() => setNewExpense({ ...newExpense, category: cat.value })}
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
              onChange={(e) => setNewExpense({ ...newExpense, description: e.target.value })}
              required
              data-testid="expense-description-input"
            />
          </div>

          {/* Split Expense Option */}
          <motion.div
            className="form-group split-option"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.3 }}
          >
            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={splitExpense}
                onChange={(e) => setSplitExpense(e.target.checked)}
                className="checkbox-input"
              />
              <span className="checkbox-custom"></span>
              <span className="checkbox-text">
                <Users size={18} />
                Split this expense with a group
              </span>
            </label>
          </motion.div>

          {/* Group Selection */}
          {splitExpense && (
            <motion.div
              className="form-group group-selection"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3 }}
            >
              <label htmlFor="group">
                <Users size={18} />
                Select Group
              </label>
              {loadingGroups ? (
                <div className="loading-groups">
                  <Loader2 className="spinning" size={20} />
                  <span>Loading your groups...</span>
                </div>
              ) : groups.length > 0 ? (
                <select
                  id="group"
                  value={selectedGroup}
                  onChange={(e) => setSelectedGroup(e.target.value)}
                  className="group-select"
                  required={splitExpense}
                >
                  {groups.map((group) => (
                    <option key={group.id} value={group.id}>
                      {group.name} ({group.members.length} members)
                    </option>
                  ))}
                </select>
              ) : (
                <div className="no-groups-message">
                  <Users size={24} />
                  <p>You don't have any groups yet.</p>
                  <p className="help-text">Create a group first to split expenses.</p>
                </div>
              )}

              {/* Split Type Selection */}
              {selectedGroup && groups.length > 0 && (
                <motion.div
                  className="split-type-selection"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3 }}
                >
                  <label htmlFor="splitMethod" className="split-type-label">
                    <Users size={18} />
                    Split Method:
                  </label>
                  <select
                    id="splitMethod"
                    value={splitType}
                    onChange={(e) => handleSplitTypeChange(e.target.value)}
                    className="split-type-select"
                  >
                    <option value="equal">Split Equally - All group members</option>
                    <option value="select">Select Members - Choose who owes you</option>
                    <option value="full">Full Amount - One person owes everything</option>
                  </select>
                </motion.div>
              )}

              {/* Member Selection */}
              {selectedGroup && (splitType === 'select' || splitType === 'full') && groupMembers.length > 0 && (
                <motion.div
                  className="member-selection"
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  transition={{ duration: 0.3 }}
                >
                  <label className="member-selection-label">
                    <UserCheck size={18} />
                    {splitType === 'full'
                      ? `Select who owes the full amount (${selectedMembers.length}/1 selected)`
                      : `Select who owes you (${selectedMembers.length} selected)`
                    }
                  </label>
                  {loadingMembers ? (
                    <div className="loading-groups">
                      <Loader2 className="spinning" size={20} />
                      <span>Loading members...</span>
                    </div>
                  ) : (
                    <div className="member-list">
                      {groupMembers.map((member) => (
                        <div
                          key={member.userId}
                          className={`member-checkbox-item ${selectedMembers.includes(member.userId) ? 'selected' : ''}`}
                          onClick={() => toggleMemberSelection(member.userId)}
                        >
                          <input
                            type="checkbox"
                            checked={selectedMembers.includes(member.userId)}
                            onChange={() => toggleMemberSelection(member.userId)}
                            className="member-checkbox-input"
                          />
                          <span className="member-checkbox-custom"></span>
                          <div className="member-checkbox-info">
                            <div className="member-checkbox-avatar">
                              {member.name?.charAt(0) || member.email.charAt(0)}
                            </div>
                            <div className="member-checkbox-details">
                              <span className="member-checkbox-name">
                                {member.name || 'User'}
                                {member.isAdmin && <span className="admin-badge">Admin</span>}
                              </span>
                              <span className="member-checkbox-email">{member.email}</span>
                            </div>
                          </div>
                          {selectedMembers.includes(member.userId) && (
                            <CheckCircle size={20} className="member-check-icon" />
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </motion.div>
              )}
            </motion.div>
          )}

          <button
            type="submit"
            className="submit-button"
            disabled={loading || (splitExpense && groups.length === 0)}
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
                {splitExpense ? "Add & Split Expense" : "Add Expense"}
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
            {splitExpense && <li>✨ Split expenses equally among group members</li>}
          </ul>
        </motion.div>
      </div>
    </div>
  );
}

export default AddExpense;

