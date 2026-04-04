import { useEffect, useState } from "react";
import { apiService } from "../utils/api";
import { Wallet, Receipt, TrendingUp, DollarSign, Sparkles, Brain, Loader2, ArrowUpRight, ArrowDownRight, PieChart, BarChart3, ScanLine, Users, ShieldCheck, Eye, X, ShieldAlert, Lock, ArrowRight, Info } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Chart as ChartJS, ArcElement, CategoryScale, LinearScale, BarElement, PointElement, LineElement, Title, Tooltip, Legend } from 'chart.js';
import { Doughnut, Bar, Line } from 'react-chartjs-2';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { useAuth } from "../context/AuthContext";
import MyRequestStatus from "./MyRequestStatus";
import RoleRequestModal from "./RoleRequestModal";

ChartJS.register(ArcElement, CategoryScale, LinearScale, BarElement, PointElement, LineElement, Title, Tooltip, Legend);

function Dashboard({ loading, setLoading, stats, setStats, recentExpenses, setRecentExpenses, monthlyExpenses, setMonthlyExpenses, insight, setInsight }) {
  const { user, isViewer, isAnalyst, isAdmin, loading: authLoading } = useAuth();
  const [showRoleModal, setShowRoleModal] = useState(false);
  const [requestedRoleForModal, setRequestedRoleForModal] = useState('analyst');
  const [dismissAnalystBanner, setDismissAnalystBanner] = useState(false);
  
  const [activeChart, setActiveChart] = useState('doughnut');
  const [insightLoading, setInsightLoading] = useState(false);
  const [scanning, setScanning] = useState(false);

  const [amountOwed, setAmountOwed] = useState({ totalOwed: 0, expenseCount: 0 });
  const [owedByPerson, setOwedByPerson] = useState([]);
  const [amountIOweByPerson, setAmountIOweByPerson] = useState([]);

  const loadDashboardData = async () => {
    if (isViewer) {
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      // Branch API calls based on role permissions
      const calls = [
        apiService.getExpenseStats(),
        apiService.getRecentExpenses(),
        apiService.getMonthlyExpense(),
      ];

      // Only add debt/group calls if not restricted (Analyst + Admin usually have access, 
      // but let's keep it safe and only suppress 403s on them if they fail)
      const debtCalls = [
        apiService.getTotalAmountOwed(),
        apiService.getAmountOwedByPerson(),
        apiService.getAmountIOweByPerson()
      ];

      const results = await Promise.allSettled([...calls, ...debtCalls]);
      
      const [statsRes, recentRes, monthlyRes, owedRes, owedByPersonRes, iOweRes] = results;

      if (statsRes.status === 'fulfilled') setStats(statsRes.value.data);
      if (recentRes.status === 'fulfilled') setRecentExpenses(recentRes.value.data);
      if (monthlyRes.status === 'fulfilled') setMonthlyExpenses(monthlyRes.value.data);
      if (owedRes.status === 'fulfilled') setAmountOwed(owedRes.value.data);
      if (owedByPersonRes.status === 'fulfilled') setOwedByPerson(owedByPersonRes.value.data);
      if (iOweRes.status === 'fulfilled') setAmountIOweByPerson(iOweRes.value.data);

      // Check if critical calls failed with anything OTHER than 403
      const criticalFailures = [statsRes, recentRes, monthlyRes].filter(
        r => r.status === 'rejected' && r.reason?.response?.status !== 403
      );

      if (criticalFailures.length > 0) {
        toast.error("Failed to load some dashboard data");
      }
    } catch (error) {
      console.error("Error loading dashboard:", error);
      if (error.response?.status !== 403) {
        toast.error("Failed to load dashboard data");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateInsight = async () => {
    try {
      setInsightLoading(true);
      const insightRes = await apiService.getBehavioralInsight();
      setInsight(insightRes.data);
      toast.success("New AI insight generated!");
    } catch (error) {
      console.error("Error loading behavioral insight:", error);
      toast.error("Failed to generate insight");
    } finally {
      setInsightLoading(false);
    }
  };

  const handleScanReceipt = () => {
    setScanning(true);
    const promise = new Promise((resolve) => setTimeout(resolve, 3000));

    toast.promise(promise, {
      loading: 'Scanning receipt with AI...',
      success: () => {
        setScanning(false);
        return 'Receipt scanned successfully! Data extracted.';
      },
      error: 'Failed to scan receipt',
    });
  };

  // Wait until AuthContext has finished loading the user before deciding what to fetch.
  // Include isViewer in deps so that when the role resolves, the correct branch runs.
  useEffect(() => {
    if (authLoading) return; // Auth still resolving — do nothing yet
    loadDashboardData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authLoading, isViewer]);


  const categoryIcons = {
    Food: "🍔",
    Groceries: "🛒",
    Transport: "🚗",
    Shopping: "🛍️",
    Bills: "📄",
    Entertainment: "🎬",
    Health: "🏥",
    Education: "🎓",
    Travel: "✈️",
    Investment: "📈",
    Others: "📦"
  };

  const categoryColors = {
    Food: "#00E5FF",       // Cyan
    Groceries: "#10B981",   // Emerald
    Transport: "#00FF94",   // Green
    Shopping: "#D946EF",    // Purple
    Bills: "#F59E0B",       // Yellow
    Entertainment: "#F97316", // Orange
    Health: "#F43F5E",      // Rose
    Education: "#8B5CF6",   // Violet
    Travel: "#3B82F6",      // Blue
    Investment: "#EC4899",  // Pink
    Others: "#94A3B8"       // Slate
  };

  const formatRelativeDate = (dateStr) => {
    try {
      const date = new Date(dateStr);
      const now = new Date();
      const diffMs = now - date;
      const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

      if (diffDays === 0) return "Today";
      if (diffDays === 1) return "Yesterday";
      if (diffDays < 7) return `${diffDays} days ago`;
      
      return date.toLocaleDateString('en-IN', { 
        day: 'numeric', 
        month: 'short' 
      });
    } catch (e) {
      return dateStr;
    }
  };

  // Chart data
  const doughnutData = {
    labels: Object.keys(stats.by_category || {}),
    datasets: [{
      data: Object.values(stats.by_category || {}),
      backgroundColor: Object.keys(stats.by_category || {}).map(cat => categoryColors[cat] || "#94A3B8"),
      borderColor: 'transparent',
      borderWidth: 0,
      hoverOffset: 20
    }]
  };

  const barData = {
    labels: Object.keys(stats.by_category || {}),
    datasets: [{
      label: 'Spending by Category',
      data: Object.values(stats.by_category || {}),
      backgroundColor: Object.keys(stats.by_category || {}).map(cat => categoryColors[cat] || "#94A3B8"),
      borderRadius: 8,
      borderSkipped: false,
    }]
  };

  // Generate colors for people who owe money
  const personColors = [
    '#667eea', '#764ba2', '#f093fb', '#4facfe',
    '#43e97b', '#fa709a', '#fee140', '#30cfd0',
    '#a8edea', '#fed6e3', '#c471f5', '#12c2e9'
  ];

  // Chart data for who owes you money
  const owedByPersonData = {
    labels: owedByPerson.map(person => person.name || person.email),
    datasets: [{
      data: owedByPerson.map(person => person.amount),
      backgroundColor: owedByPerson.map((_, idx) => personColors[idx % personColors.length]),
      borderColor: 'rgba(255, 255, 255, 0.1)',
      borderWidth: 2,
      hoverOffset: 20
    }]
  };

  // Chart data for who YOU owe money to
  const amountIOweByPersonData = {
    labels: amountIOweByPerson.map(person => person.name || person.email),
    datasets: [{
      data: amountIOweByPerson.map(person => person.amount),
      backgroundColor: amountIOweByPerson.map((_, idx) => personColors[(idx + 5) % personColors.length]), // Offset colors
      borderColor: 'rgba(255, 255, 255, 0.1)',
      borderWidth: 2,
      hoverOffset: 20
    }]
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: '#1e293b',
        padding: 12,
        titleColor: '#fff',
        bodyColor: '#fff',
        displayColors: true,
        borderColor: '#334155',
        borderWidth: 1,
        callbacks: {
          label: function (context) {
            return `₹${context.raw.toFixed(2)}`;
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
        grid: { color: 'rgba(255, 255, 255, 0.05)' },
        ticks: {
          color: '#94a3b8',
          callback: function (value) { return '₹' + value; }
        }
      },
      x: {
        grid: { display: false },
        ticks: { color: '#94a3b8' }
      }
    }
  };

  // Monthly Chart Data
  const sortedMonths = Object.keys(monthlyExpenses || {}).sort();
  const monthlyChartData = {
    labels: sortedMonths.map(m => {
      const [year, month] = m.split('-');
      const date = new Date(parseInt(year), parseInt(month) - 1);
      return date.toLocaleString('default', { month: 'short', year: '2-digit' });
    }),
    datasets: [{
      label: 'Monthly Spending',
      data: sortedMonths.map(m => {
        const val = monthlyExpenses[m];
        // Backend returns { income, expenses, net, count } or a raw number
        return typeof val === 'object' ? (val.expenses || 0) : (val || 0);
      }),
      borderColor: '#00E5FF', // Cyan
      backgroundColor: 'rgba(0, 229, 255, 0.1)', // Cyan with opacity
      tension: 0.4,
      fill: true,
      pointBackgroundColor: '#00E5FF',
      pointBorderColor: '#00E5FF',
      pointRadius: 4,
      pointHoverRadius: 6
    }]
  };

  return (
    <div className="space-y-8">
      {/* Role Request Modal (Globally accessible to all roles in Dashboard) */}
      <RoleRequestModal
        open={showRoleModal}
        onOpenChange={setShowRoleModal}
        onSuccess={() => setShowRoleModal(false)}
        initialRole={requestedRoleForModal}
      />

      {/* Wait for auth to resolve before rendering role-specific UI */}
      {authLoading ? (
        <div className="flex h-[60vh] flex-col items-center justify-center gap-6 animate-in fade-in duration-500">
          <div className="relative">
            <Loader2 className="h-12 w-12 animate-spin text-primary" />
            <div className="absolute inset-0 blur-xl bg-primary/20 rounded-full"></div>
          </div>
          <p className="text-lg font-medium text-muted-foreground">Loading your profile...</p>
        </div>
      ) : isViewer ? (
        <div className="flex flex-col items-center justify-center min-h-[70vh] text-center space-y-8 animate-in fade-in zoom-in duration-500">
          <div className="relative">
            <div className="p-8 rounded-full bg-slate-500/10 text-slate-400">
              <Eye className="h-20 w-20" />
            </div>
            <div className="absolute -top-2 -right-2 p-2 rounded-full bg-background border border-border shadow-md">
              <ShieldCheck className="h-6 w-6 text-slate-500" />
            </div>
          </div>

          <div className="max-w-2xl space-y-3">
            <h2 className="text-4xl font-extrabold tracking-tight text-foreground">Restricted Access</h2>
            <p className="text-lg text-muted-foreground">
              You are signed in as a <span className="text-slate-400 font-bold bg-slate-500/10 px-2 py-0.5 rounded uppercase tracking-wider">Viewer</span>.
            </p>
            <p className="text-muted-foreground max-w-md mx-auto">
              Your role allows you to view analytics and interact with AI, but financial record-keeping is currently disabled for your account.
            </p>
          </div>
          
          <Card className="w-full max-w-2xl bg-card border-border/50 text-left overflow-hidden shadow-2xl">
            <div className="p-8 space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-4">
                  <h4 className="text-xs font-black text-foreground uppercase tracking-[0.2em] flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-lg shadow-emerald-500/50"></span>
                    Permitted Actions
                  </h4>
                  <ul className="text-sm text-muted-foreground space-y-3">
                    <li className="flex items-start gap-2">
                      <span className="text-emerald-500 font-bold mt-0.5">✓</span>
                      View dashboard summaries
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-emerald-500 font-bold mt-0.5">✓</span>
                      Use AI Assistant for advice
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-emerald-500 font-bold mt-0.5">✓</span>
                      Browse public group balances
                    </li>
                  </ul>
                </div>
                <div className="space-y-4">
                  <h4 className="text-xs font-black text-foreground uppercase tracking-[0.2em] flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-rose-500 shadow-lg shadow-rose-500/50"></span>
                    Restricted Actions
                  </h4>
                  <ul className="text-sm text-muted-foreground space-y-3">
                    <li className="flex items-start gap-2">
                      <span className="text-rose-400 font-bold mt-0.5">✕</span>
                      Create new expense entries
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-rose-400 font-bold mt-0.5">✕</span>
                      Edit or remove records
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-rose-400 font-bold mt-0.5">✕</span>
                      Manage user permissions
                    </li>
                  </ul>
                </div>
              </div>

              <div className="pt-6 border-t border-border/50 flex flex-col sm:flex-row items-center justify-between gap-6">
                <div className="space-y-1 text-center sm:text-left">
                  <p className="text-base font-bold text-foreground">Unlock Full Features</p>
                  <p className="text-sm text-muted-foreground">Request an Analyst or Admin upgrade to manage finances.</p>
                </div>
                <Button 
                  size="lg"
                  className="bg-indigo-600 hover:bg-indigo-500 text-white shadow-xl shadow-indigo-600/30 px-10 h-14 rounded-xl font-bold transition-all hover:-translate-y-1"
                  onClick={() => {
                    setRequestedRoleForModal('analyst');
                    setShowRoleModal(true);
                  }}
                >
                  Request Role Upgrade
                </Button>
              </div>

              <div className="pt-2 bg-muted/30 -mx-8 -mb-8 p-4 border-t border-border/50">
                 <MyRequestStatus />
              </div>
            </div>
          </Card>
        </div>
      ) : (
        <>
          {isAnalyst && !dismissAnalystBanner && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
            >
              <Card className="border border-indigo-500/30 bg-indigo-500/5 overflow-hidden relative mb-6">
                <button 
                  onClick={() => setDismissAnalystBanner(true)}
                  className="absolute top-2 right-2 text-muted-foreground hover:text-foreground p-1 z-10"
                  aria-label="Dismiss banner"
                >
                  <X size={16} />
                </button>
                <div className="flex flex-col md:flex-row items-center justify-between gap-4 p-5 pr-12">
                  <div className="flex items-center gap-4">
                    <div className="p-3 rounded-xl bg-indigo-500/10 text-indigo-400 shadow-inner">
                      <ShieldCheck className="h-6 w-6" />
                    </div>
                    <div>
                      <p className="text-base font-bold text-foreground">Analyst Profile Active</p>
                      <p className="text-sm text-muted-foreground">You can manage expenses but cannot delete existing group entries.</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <MyRequestStatus />
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="border-indigo-500/50 text-indigo-400 hover:bg-indigo-500/10 h-10 px-4 rounded-lg font-semibold"
                      onClick={() => {
                        setRequestedRoleForModal('admin');
                        setShowRoleModal(true);
                      }}
                    >
                      Request Admin Access
                    </Button>
                  </div>
                </div>
              </Card>
            </motion.div>
          )}

          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h2 className="text-3xl font-bold tracking-tight text-foreground">Finance Overview</h2>
              <p className="text-muted-foreground">Comprehensive tracking for {user?.name || 'your'} financial ecosystem</p>
            </div>
          </div>

          {loading ? (
            <div className="flex h-[50vh] flex-col items-center justify-center gap-6 animate-in fade-in duration-500">
              <div className="relative">
                <Loader2 className="h-12 w-12 animate-spin text-primary" />
                <div className="absolute inset-0 blur-xl bg-primary/20 rounded-full"></div>
              </div>
              <p className="text-lg font-medium text-muted-foreground">Decrypting financial data...</p>
            </div>
          ) : (
            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
              {/* Stats Grid */}
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card className="bg-card border-border/50 shadow-lg hover:border-primary/50 transition-colors">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">Total Spending</CardTitle>
                    <Wallet className="h-4 w-4 text-primary" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold font-mono text-foreground">₹{(stats.total || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
                    <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                      {stats.totalChange >= 0 ? (
                        <ArrowUpRight className="h-3 w-3 text-emerald-500" />
                      ) : (
                        <ArrowDownRight className="h-3 w-3 text-rose-500" />
                      )}
                      <span className={`font-medium ${stats.totalChange >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
                        {stats.totalChange >= 0 ? '+' : ''}{stats.totalChange || 0}%
                      </span> from last month
                    </p>
                  </CardContent>
                </Card>

                <Card className="bg-card border-border/50 shadow-lg hover:border-secondary/50 transition-colors">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">Transactions</CardTitle>
                    <Receipt className="h-4 w-4 text-secondary" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold font-mono text-foreground">{stats.count || 0}</div>
                    <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                      {stats.countChange >= 0 ? (
                        <ArrowUpRight className="h-3 w-3 text-emerald-500" />
                      ) : (
                        <ArrowDownRight className="h-3 w-3 text-rose-500" />
                      )}
                      <span className={`font-medium ${stats.countChange >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
                        {stats.countChange >= 0 ? '+' : ''}{stats.countChange || 0}%
                      </span> from last month
                    </p>
                  </CardContent>
                </Card>

                <Card className="bg-card border-border/50 shadow-lg hover:border-purple-500/50 transition-colors">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">Avg. Transaction</CardTitle>
                    <DollarSign className="h-4 w-4 text-purple-500" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold font-mono text-foreground">₹{stats.count ? (stats.total / stats.count).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '0.00'}</div>
                    <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                      {stats.avgChange >= 0 ? (
                        <ArrowUpRight className="h-3 w-3 text-emerald-500" />
                      ) : (
                        <ArrowDownRight className="h-3 w-3 text-rose-500" />
                      )}
                      <span className={`font-medium ${stats.avgChange >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
                        {stats.avgChange >= 0 ? '+' : ''}{stats.avgChange || 0}%
                      </span> from last month
                    </p>
                  </CardContent>
                </Card>

                {(() => {
                  const ratio = stats.budgetRatio || 0;
                  let healthLabel, healthColor, healthDesc;
                  if (stats.count === 0 && stats.total === 0) {
                    healthLabel = 'NO DATA';
                    healthColor = 'text-muted-foreground';
                    healthDesc = 'No expenses recorded yet';
                  } else if (ratio <= 60) {
                    healthLabel = 'EXCELLENT';
                    healthColor = 'text-emerald-400';
                    healthDesc = `Spending at ${ratio}% of last month`;
                  } else if (ratio <= 85) {
                    healthLabel = 'WARNING';
                    healthColor = 'text-amber-400';
                    healthDesc = `Spending at ${ratio}% of last month`;
                  } else {
                    healthLabel = 'CRITICAL';
                    healthColor = 'text-rose-400';
                    healthDesc = `Spending at ${ratio}% of last month`;
                  }
                  return (
                    <Card className="bg-gradient-to-br from-primary/20 to-secondary/20 border-primary/20 shadow-xl shadow-primary/10">
                      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-foreground uppercase tracking-wider font-bold">Budget Health</CardTitle>
                        <TrendingUp className="h-4 w-4 text-primary" />
                      </CardHeader>
                      <CardContent>
                        <motion.div 
                          animate={{ opacity: [0.8, 1, 0.8] }}
                          transition={{ repeat: Infinity, duration: 3, ease: "easeInOut" }}
                        >
                          <div className={`text-2xl font-black ${healthColor}`}>{healthLabel}</div>
                          <p className="text-xs text-muted-foreground mt-1">
                            {healthDesc}
                          </p>
                        </motion.div>
                      </CardContent>
                    </Card>
                  );
                })()}
              </div>

              {/* Group Balances */}
              {(amountOwed.totalOwed > 0 || owedByPerson.length > 0 || amountIOweByPerson.length > 0) && (
                <div className="grid gap-6 md:grid-cols-2">
                  <Card className="bg-gradient-to-br from-emerald-500/10 to-green-500/10 border-emerald-500/20 shadow-lg">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-bold text-foreground">Receivables</CardTitle>
                      <Users className="h-4 w-4 text-emerald-500" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-3xl font-black font-mono text-emerald-500">
                        ₹{amountOwed.totalOwed?.toFixed(2) || 0}
                      </div>
                      <p className="text-xs text-muted-foreground mt-1 uppercase tracking-widest font-bold">
                        Across {amountOwed.expenseCount || 0} group expense{amountOwed.expenseCount !== 1 ? 's' : ''}
                      </p>
                      {owedByPerson.length > 0 && (
                        <div className="mt-6 space-y-3">
                          {owedByPerson.slice(0, 3).map((person, idx) => (
                            <div key={idx} className="flex items-center justify-between text-sm bg-background/40 p-2 rounded-lg border border-emerald-500/10">
                              <span className="text-foreground font-medium truncate">
                                {person.name || person.email}
                              </span>
                              <span className="font-mono font-black text-emerald-500 bg-emerald-500/10 px-2 py-0.5 rounded">
                                ₹{person.amount.toFixed(2)}
                              </span>
                            </div>
                          ))}
                          {owedByPerson.length > 3 && (
                            <p className="text-xs text-center text-muted-foreground font-bold pt-1">
                              +{owedByPerson.length - 3} OTHER DEBTORS
                            </p>
                          )}
                        </div>
                      )}
                    </CardContent>
                  </Card>

                  <Card className="bg-gradient-to-br from-rose-500/10 to-red-500/10 border-rose-500/20 shadow-lg">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-bold text-foreground">Payables</CardTitle>
                      <Users className="h-4 w-4 text-rose-500" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-3xl font-black font-mono text-rose-500">
                        ₹{amountIOweByPerson.reduce((sum, p) => sum + p.amount, 0).toFixed(2)}
                      </div>
                      <p className="text-xs text-muted-foreground mt-1 uppercase tracking-widest font-bold">
                        Pending to {amountIOweByPerson.length} individual{amountIOweByPerson.length !== 1 ? 's' : ''}
                      </p>
                      {amountIOweByPerson.length > 0 && (
                        <div className="mt-6 space-y-3">
                          {amountIOweByPerson.slice(0, 3).map((person, idx) => (
                            <div key={idx} className="flex items-center justify-between text-sm bg-background/40 p-2 rounded-lg border border-rose-500/10">
                              <span className="text-foreground font-medium truncate">
                                {person.name || person.email}
                              </span>
                              <span className="font-mono font-black text-rose-500 bg-rose-500/10 px-2 py-0.5 rounded">
                                ₹{person.amount.toFixed(2)}
                              </span>
                            </div>
                          ))}
                          {amountIOweByPerson.length > 3 && (
                            <p className="text-xs text-center text-muted-foreground font-bold pt-1">
                              +{amountIOweByPerson.length - 3} PENDING DEBTS
                            </p>
                          )}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </div>
              )}

              {/* Charts & Transactions Grid */}
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-7">
                <Card className="col-span-4 bg-card border-border/50 shadow-xl">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle className="text-foreground">Allocation Analytics</CardTitle>
                        <CardDescription>Visual summary of your categorized spending</CardDescription>
                      </div>
                      <Tabs defaultValue="doughnut" onValueChange={setActiveChart} className="w-[120px]">
                        <TabsList className="grid w-full grid-cols-2 bg-muted/50 border border-border/50">
                          <TabsTrigger value="doughnut"><PieChart className="h-4 w-4" /></TabsTrigger>
                          <TabsTrigger value="bar"><BarChart3 className="h-4 w-4" /></TabsTrigger>
                        </TabsList>
                      </Tabs>
                    </div>
                  </CardHeader>
                  <CardContent className="pb-8">
                    <div className="h-[350px] w-full pt-4">
                      {Object.keys(stats.by_category || {}).length > 0 ? (
                        activeChart === 'doughnut' ? (
                          <Doughnut data={doughnutData} options={chartOptions} />
                        ) : (
                          <Bar data={barData} options={barOptions} />
                        )
                      ) : (
                        <div className="h-full flex flex-col items-center justify-center text-center p-8 opacity-40">
                          <PieChart className="h-12 w-12 mb-4" />
                          <p className="text-sm font-bold">NO SPENDING DATA</p>
                          <p className="text-xs text-muted-foreground mt-1">Add expenses to see your category breakdown</p>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>

                <Card className="col-span-3 bg-card border-border/50 shadow-xl flex flex-col">
                  <CardHeader>
                    <CardTitle className="text-foreground">Recent Activity</CardTitle>
                    <CardDescription className="text-muted-foreground">
                      Live stream of your wallet actions
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="flex-1 overflow-hidden">
                    <div className="space-y-4 h-[350px] overflow-y-auto pr-2 custom-scrollbar">
                      {recentExpenses.length > 0 ? (
                          <motion.div 
                            key={exp.id || idx}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: idx * 0.05 }}
                            className="flex items-center group p-3 rounded-xl hover:bg-muted/50 border border-transparent hover:border-border transition-all duration-300"
                          >
                            <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl border border-border bg-muted/30 group-hover:bg-background group-hover:scale-110 shadow-sm transition-all">
                              <span className="text-xl">{categoryIcons[exp.category] || "📦"}</span>
                            </div>
                            <div className="ml-4 flex-1 min-w-0">
                              <p className="text-sm font-bold leading-tight text-foreground truncate">{exp.description}</p>
                              <div className="flex items-center gap-2 mt-1">
                                <span className="text-[10px] font-black uppercase tracking-tighter bg-muted px-1.5 py-0.5 rounded text-muted-foreground">{exp.category}</span>
                                <span className="text-[10px] text-muted-foreground font-medium">{formatRelativeDate(exp.date)}</span>
                              </div>
                            </div>
                            <div className="ml-auto flex flex-col items-end">
                              <p className="text-sm font-black font-mono text-foreground">-₹{exp.amount}</p>
                              <div className="h-1 w-8 bg-muted rounded-full mt-1.5 overflow-hidden">
                                <div className="h-full bg-primary" style={{ width: `${Math.min(100, (exp.amount / 5000) * 100)}%` }}></div>
                              </div>
                            </div>
                          </motion.div>
                        ))
                      ) : (
                        <div className="h-full flex flex-col items-center justify-center text-center p-8 opacity-40">
                          <Receipt className="h-12 w-12 mb-4" />
                          <p className="text-sm font-bold">NO TRANSACTIONS FOUND</p>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Monthly Trends */}
              <Card className="bg-card border-border/50 shadow-xl overflow-hidden">
                <CardHeader className="bg-muted/10 border-b border-border/30">
                  <div>
                    <CardTitle className="text-foreground">Timeline Analytics</CardTitle>
                    <CardDescription>Your cumulative spending velocity</CardDescription>
                  </div>
                </CardHeader>
                <CardContent className="p-8">
                  <div className="h-[300px] w-full">
                    <Line
                      data={monthlyChartData}
                      options={{
                        ...barOptions,
                        plugins: {
                          ...barOptions.plugins,
                          legend: { display: false }
                        }
                      }}
                    />
                  </div>
                </CardContent>
              </Card>

              {/* AI Insight Section */}
              <div className="grid gap-6">
                <Card className="border-primary/20 bg-gradient-to-r from-primary/5 to-secondary/5 shadow-2xl relative overflow-hidden group">
                  <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity">
                    <Brain className="h-40 w-40" />
                  </div>
                  <CardHeader className="flex flex-col md:flex-row items-center justify-between gap-6 relative z-10">
                    <div className="space-y-2 text-center md:text-left">
                      <CardTitle className="flex items-center gap-3 text-2xl font-black text-foreground">
                        <div className="p-2 rounded-lg bg-primary/20">
                          <Brain className="h-6 w-6 text-primary" />
                        </div>
                        AI Core Insights
                      </CardTitle>
                      <CardDescription className="text-base text-muted-foreground max-w-xl">
                        Synthesizing your behavioral patterns using Gemini AI to find performance improvements in your spending habits.
                      </CardDescription>
                    </div>
                    <Button 
                      onClick={handleGenerateInsight} 
                      disabled={insightLoading} 
                      className="bg-primary hover:bg-primary/80 text-primary-foreground font-black px-8 h-14 rounded-xl shadow-xl shadow-primary/30 active:scale-95 transition-all"
                    >
                      {insightLoading ? (
                        <>
                          <Loader2 className="mr-3 h-5 w-5 animate-spin" />
                          ANALYZING...
                        </>
                      ) : (
                        <>
                          <Sparkles className="mr-3 h-5 w-5" />
                          GENERATE INSIGHT
                        </>
                      )}
                    </Button>
                  </CardHeader>
                  <AnimatePresence>
                    {insight && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                      >
                        <CardContent className="relative z-10 pb-8">
                          <div className="rounded-2xl bg-background/80 backdrop-blur-md p-8 border border-primary/20 shadow-inner">
                            <MarkdownLite text={insight.insight} className="text-base leading-relaxed text-foreground" />
                          </div>
                        </CardContent>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </Card>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

export default Dashboard;

function MarkdownLite({ text, className = "text-sm leading-relaxed text-muted-foreground" }) {
  const renderInline = (t) => {
    const parts = [];
    const regex = /\*\*([^*]+)\*\*/g;
    let last = 0;
    let m;
    while ((m = regex.exec(t)) !== null) {
      if (m.index > last) parts.push(t.slice(last, m.index));
      parts.push(<strong key={parts.length} className="text-foreground font-semibold">{m[1]}</strong>);
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
          <ul key={`ul-${elements.length}`} className="list-disc pl-5 my-2 space-y-1">
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
        <ul key={`ul-${elements.length}`} className="list-disc pl-5 my-2 space-y-1">
          {list.map((li, idx) => (
            <li key={`li-${idx}`}>{renderInline(li)}</li>
          ))}
        </ul>
      );
      list = [];
    }
    elements.push(<p key={`p-${elements.length}`} className="my-1">{renderInline(line)}</p>);
  }
  if (list.length) {
    elements.push(
      <ul key={`ul-${elements.length}`} className="list-disc pl-5 my-2 space-y-1">
        {list.map((li, idx) => (
          <li key={`li-${idx}`}>{renderInline(li)}</li>
        ))}
      </ul>
    );
  }
  return <div className={className}>{elements}</div>;
}
