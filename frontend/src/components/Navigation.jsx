import { LayoutDashboard, PlusCircle, MessageSquare, Users, Receipt } from "lucide-react";

function Navigation({ activeTab, setActiveTab }) {
  const tabs = [
    { id: "dashboard", label: "Dashboard", icon: <LayoutDashboard size={18} /> },
    { id: "add-expense", label: "Add Expense", icon: <PlusCircle size={18} /> },
    { id: "bill-upload", label: "Bill Upload", icon: <Receipt size={18} /> },
    { id: "ai-chat", label: "AI Chat", icon: <MessageSquare size={18} /> },
    { id: "multi-agent", label: "Multi-Agent", icon: <Users size={18} /> }
  ];

  return (
    <nav className="nav-tabs" data-testid="nav-tabs">
      <div className="nav-container">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            className={`nav-tab ${activeTab === tab.id ? "active" : ""}`}
            onClick={() => setActiveTab(tab.id)}
            data-testid={`nav-${tab.id}`}
          >
            <span className="nav-icon">{tab.icon}</span>
            <span className="nav-label">{tab.label}</span>
            {activeTab === tab.id && <span className="nav-indicator"></span>}
          </button>
        ))}
      </div>
    </nav>
  );
}

export default Navigation;

