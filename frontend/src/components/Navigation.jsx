function Navigation({ activeTab, setActiveTab }) {
  return (
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
  );
}

export default Navigation;

