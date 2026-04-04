import { useEffect, useState } from "react";
import { LayoutDashboard, MessageSquare, Settings, Wallet, Receipt, ShieldCheck } from "lucide-react";
import { NavLink } from "react-router-dom";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "../context/AuthContext";
import { apiService } from "../utils/api";

function Navigation() {
  const { user } = useAuth();
  const [pendingCount, setPendingCount] = useState(0);

  useEffect(() => {
    if (user?.role !== "admin") return;
    let cancelled = false;

    const fetchPendingCount = () => {
      apiService
        .getAdminRequests({ status: "PENDING", limit: 1 })
        .then((res) => {
          if (!cancelled) setPendingCount(res.data.pagination?.total || 0);
        })
        .catch(() => {});
    };

    fetchPendingCount();
    const interval = setInterval(fetchPendingCount, 60_000);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [user]);

  const navItems = [
    { path: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { path: "/add-expense", label: "Expenses", icon: Wallet },
    { path: "/bill-upload", label: "Bill Upload", icon: Receipt },
    { path: "/chat", label: "AI Chat", icon: MessageSquare },
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

          {/* Admin link — shown only for admins */}
          {user?.role === "admin" && (
            <NavLink
              to="/admin/role-requests"
              className={({ isActive }) =>
                cn(
                  "flex flex-col items-center justify-center rounded-xl p-2 text-xs font-medium transition-all duration-200 md:flex-row md:justify-start md:px-4 md:py-3 md:text-sm",
                  isActive
                    ? "text-primary md:bg-primary/10 md:border-l-4 md:border-primary md:rounded-l-none md:rounded-r-xl"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                )
              }
            >
              <ShieldCheck className="mb-1 h-5 w-5 md:mb-0 md:mr-3" />
              <span className="flex-1">Role Requests</span>
              {pendingCount > 0 && (
                <Badge className="ml-auto bg-yellow-500 text-black text-xs h-5 min-w-[20px] flex items-center justify-center hidden md:flex">
                  {pendingCount}
                </Badge>
              )}
            </NavLink>
          )}
        </div>
      </div>
    </nav>
  );
}

export default Navigation;
