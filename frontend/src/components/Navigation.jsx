import { LayoutDashboard, MessageSquare, PieChart, Settings, LogOut, Wallet } from "lucide-react";
import { NavLink } from "react-router-dom";
import { cn } from "@/lib/utils";

function Navigation() {
  const navItems = [
    { path: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { path: "/add-expense", label: "Expenses", icon: Wallet },
    { path: "/chat", label: "AI Chat", icon: MessageSquare },
    { path: "/budgets", label: "Budgets", icon: PieChart },
    { path: "/settings", label: "Settings", icon: Settings },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-border bg-card/80 backdrop-blur-lg md:static md:block md:w-64 md:border-r md:border-t-0 md:h-screen md:flex-shrink-0">
      <div className="flex h-full flex-col">
        {/* Logo Area - Hidden on mobile, visible on desktop */}
        <div className="hidden md:flex h-16 items-center px-6 border-b border-border/50">
          <div className="flex items-center gap-2 font-bold text-xl tracking-tight">
            <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-primary-foreground">
              <Wallet className="h-5 w-5" />
            </div>
            <span className="bg-gradient-to-r from-white to-white/60 bg-clip-text text-transparent">
              FinanceAI
            </span>
          </div>
        </div>

        {/* Navigation Items */}
        <div className="flex flex-1 flex-row justify-around p-2 md:flex-col md:justify-start md:space-y-1 md:p-4">
          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                cn(
                  "flex flex-col items-center justify-center rounded-xl p-2 text-xs font-medium transition-all duration-200 md:flex-row md:justify-start md:px-4 md:py-3 md:text-sm",
                  isActive
                    ? "text-primary md:bg-primary/10 md:border-l-4 md:border-primary md:rounded-l-none md:rounded-r-xl"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                )
              }
            >
              <item.icon className={cn("mb-1 h-5 w-5 md:mb-0 md:mr-3", ({ isActive }) => isActive && "text-primary")} />
              <span>{item.label}</span>
            </NavLink>
          ))}
        </div>

        {/* User Profile / Bottom Section - Desktop only */}
        {/* <div className="hidden md:block p-4 mt-auto">
          <div className="rounded-xl bg-gradient-to-br from-primary/20 to-secondary/20 p-4 border border-white/5">
            <h4 className="font-semibold text-sm mb-1">Pro Plan</h4>
            <p className="text-xs text-muted-foreground mb-3">Get advanced AI insights</p>
            <button className="w-full rounded-lg bg-primary px-3 py-2 text-xs font-bold text-primary-foreground hover:opacity-90 transition-opacity">
              Upgrade Now
            </button>
          </div>
        </div> */}
      </div>
    </nav>
  );
}

export default Navigation;
