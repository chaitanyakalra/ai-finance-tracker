import { useEffect, useState } from "react";
import { apiService } from "../utils/api";
import { Wallet, Receipt, TrendingUp, DollarSign, Sparkles, Brain, Loader2, ArrowUpRight, ArrowDownRight, PieChart, BarChart3, ScanLine, Users } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Chart as ChartJS, ArcElement, CategoryScale, LinearScale, BarElement, PointElement, LineElement, Title, Tooltip, Legend } from 'chart.js';
import { Doughnut, Bar, Line } from 'react-chartjs-2';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";

ChartJS.register(ArcElement, CategoryScale, LinearScale, BarElement, PointElement, LineElement, Title, Tooltip, Legend);

function Dashboard({ loading, setLoading, stats, setStats, recentExpenses, setRecentExpenses, monthlyExpenses, setMonthlyExpenses, insight, setInsight }) {
  const [activeChart, setActiveChart] = useState('doughnut');
  const [insightLoading, setInsightLoading] = useState(false);
  const [scanning, setScanning] = useState(false);

  const [amountOwed, setAmountOwed] = useState({ totalOwed: 0, expenseCount: 0 });
  const [owedByPerson, setOwedByPerson] = useState([]);
  const [amountIOweByPerson, setAmountIOweByPerson] = useState([]);

  const loadDashboardData = async () => {
    setLoading(true);
    try {
      const [statsRes, recentRes, monthlyRes, owedRes, owedByPersonRes, iOweRes] = await Promise.all([
        apiService.getExpenseStats(),
        apiService.getRecentExpenses(),
        apiService.getMonthlyExpense(),
        apiService.getTotalAmountOwed(),
        apiService.getAmountOwedByPerson(),
        apiService.getAmountIOweByPerson()
      ]);

      setStats(statsRes.data);
      setRecentExpenses(recentRes.data);
      setMonthlyExpenses(monthlyRes.data);
      setAmountOwed(owedRes.data);
      setOwedByPerson(owedByPersonRes.data);
      setAmountIOweByPerson(iOweRes.data);
    } catch (error) {
      console.error("Error loading dashboard:", error);
      toast.error("Failed to load dashboard data");
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
    Food: "#00E5FF", // Cyan
    Transport: "#00FF94", // Green
    Shopping: "#D946EF", // Purple
    Bills: "#F59E0B", // Yellow
    Entertainment: "#F97316", // Orange
    Others: "#94A3B8" // Slate
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
      const date = new Date(parseInt(year), parseInt(month));
      return date.toLocaleString('default', { month: 'short', year: '2-digit' });
    }),
    datasets: [{
      label: 'Monthly Spending',
      data: sortedMonths.map(m => monthlyExpenses[m]),
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
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-foreground">Dashboard</h2>
          <p className="text-muted-foreground">Track your spending and get AI-powered insights</p>
        </div>
        {/* <div className="flex items-center gap-3">
          <Button
            onClick={handleScanReceipt}
            disabled={scanning}
            className="bg-gradient-to-r from-primary to-secondary text-primary-foreground hover:opacity-90 transition-opacity"
          >
            {scanning ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <ScanLine className="mr-2 h-4 w-4" />}
            Scan Receipt
          </Button>
          <Button onClick={loadDashboardData} variant="outline" size="icon">
            <ArrowUpRight className="h-4 w-4 rotate-45" />
          </Button>
        </div> */}
      </div>

      {loading ? (
        <div className="flex h-[400px] flex-col items-center justify-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-muted-foreground">Loading your financial data...</p>
        </div>
      ) : (
        <>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card className="bg-card border-border/50 shadow-lg">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Total Spending</CardTitle>
                <Wallet className="h-4 w-4 text-primary" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold font-mono text-foreground">₹{stats.total?.toFixed(2) || 0}</div>
                <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                  <ArrowUpRight className="h-3 w-3 text-emerald-500" />
                  <span className="text-emerald-500 font-medium">+12.5%</span> from last month
                </p>
              </CardContent>
            </Card>

            <Card className="bg-card border-border/50 shadow-lg">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Transactions</CardTitle>
                <Receipt className="h-4 w-4 text-secondary" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold font-mono text-foreground">{stats.count || 0}</div>
                <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                  <ArrowUpRight className="h-3 w-3 text-emerald-500" />
                  <span className="text-emerald-500 font-medium">+8.2%</span> from last month
                </p>
              </CardContent>
            </Card>

            <Card className="bg-card border-border/50 shadow-lg">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Avg. Transaction</CardTitle>
                <DollarSign className="h-4 w-4 text-purple-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold font-mono text-foreground">₹{stats.count ? (stats.total / stats.count).toFixed(2) : 0}</div>
                <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                  <ArrowDownRight className="h-3 w-3 text-rose-500" />
                  <span className="text-rose-500 font-medium">-3.1%</span> from last month
                </p>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-primary/20 to-secondary/20 border-primary/20">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-foreground">Budget Status</CardTitle>
                <TrendingUp className="h-4 w-4 text-primary" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-foreground">On Track</div>
                <p className="text-xs text-muted-foreground mt-1">
                  You've spent 45% of your budget
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Group Balances Section */}
          {(amountOwed.totalOwed > 0 || owedByPerson.length > 0 || amountIOweByPerson.length > 0) && (
            <div className="grid gap-4 md:grid-cols-2">
              {/* Amount People Owe You */}
              <Card className="bg-gradient-to-br from-emerald-500/10 to-green-500/10 border-emerald-500/20">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-foreground">People Owe You</CardTitle>
                  <Users className="h-4 w-4 text-emerald-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold font-mono text-emerald-500">
                    ₹{amountOwed.totalOwed?.toFixed(2) || 0}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {amountOwed.expenseCount || 0} shared expense{amountOwed.expenseCount !== 1 ? 's' : ''}
                  </p>
                  {owedByPerson.length > 0 && (
                    <div className="mt-3 space-y-2">
                      {owedByPerson.slice(0, 3).map((person, idx) => (
                        <div key={idx} className="flex items-center justify-between text-xs">
                          <span className="text-muted-foreground truncate">
                            {person.name || person.email}
                          </span>
                          <span className="font-mono font-semibold text-emerald-500">
                            ₹{person.amount.toFixed(2)}
                          </span>
                        </div>
                      ))}
                      {owedByPerson.length > 3 && (
                        <p className="text-xs text-muted-foreground italic">
                          +{owedByPerson.length - 3} more
                        </p>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Amount You Owe Others */}
              <Card className="bg-gradient-to-br from-rose-500/10 to-red-500/10 border-rose-500/20">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-foreground">You Owe Others</CardTitle>
                  <Users className="h-4 w-4 text-rose-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold font-mono text-rose-500">
                    ₹{amountIOweByPerson.reduce((sum, p) => sum + p.amount, 0).toFixed(2)}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {amountIOweByPerson.length} person{amountIOweByPerson.length !== 1 ? 's' : ''}
                  </p>
                  {amountIOweByPerson.length > 0 && (
                    <div className="mt-3 space-y-2">
                      {amountIOweByPerson.slice(0, 3).map((person, idx) => (
                        <div key={idx} className="flex items-center justify-between text-xs">
                          <span className="text-muted-foreground truncate">
                            {person.name || person.email}
                          </span>
                          <span className="font-mono font-semibold text-rose-500">
                            ₹{person.amount.toFixed(2)}
                          </span>
                        </div>
                      ))}
                      {amountIOweByPerson.length > 3 && (
                        <p className="text-xs text-muted-foreground italic">
                          +{amountIOweByPerson.length - 3} more
                        </p>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          )}

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
            <Card className="col-span-4 bg-card border-border/50">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-foreground">Spending Overview</CardTitle>
                  <Tabs defaultValue="doughnut" onValueChange={setActiveChart} className="w-[200px]">
                    <TabsList className="grid w-full grid-cols-2 bg-muted/50">
                      <TabsTrigger value="doughnut"><PieChart className="h-4 w-4" /></TabsTrigger>
                      <TabsTrigger value="bar"><BarChart3 className="h-4 w-4" /></TabsTrigger>
                    </TabsList>
                  </Tabs>
                </div>
              </CardHeader>
              <CardContent className="pl-2">
                <div className="h-[300px] w-full">
                  {activeChart === 'doughnut' ? (
                    <Doughnut data={doughnutData} options={chartOptions} />
                  ) : (
                    <Bar data={barData} options={barOptions} />
                  )}
                </div>
              </CardContent>
            </Card>

            <Card className="col-span-3 bg-card border-border/50">
              <CardHeader>
                <CardTitle className="text-foreground">Recent Transactions</CardTitle>
                <CardDescription className="text-muted-foreground">
                  You made {recentExpenses.length} transactions this month.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6 h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                  {recentExpenses.map((exp, idx) => (
                    <div key={exp.id || idx} className="flex items-center group cursor-pointer hover:bg-muted/30 p-2 rounded-lg transition-colors">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full border border-border bg-muted/50 group-hover:border-primary/50 transition-colors">
                        <span className="text-lg">{categoryIcons[exp.category] || "📦"}</span>
                      </div>
                      <div className="ml-4 space-y-1">
                        <p className="text-sm font-medium leading-none text-foreground">{exp.description}</p>
                        <p className="text-xs text-muted-foreground">{exp.category} • {exp.date}</p>
                      </div>
                      <div className="ml-auto font-medium font-mono text-foreground">
                        -₹{exp.amount}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="">
            <Card className="col-span-3 bg-card border-border/50">
              <CardHeader>
                <CardTitle className="text-foreground">Monthly Trends</CardTitle>
                <CardDescription className="text-muted-foreground">
                  Your spending over time.
                </CardDescription>
              </CardHeader>
              <CardContent className="pl-2">
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
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <Card className="col-span-2 border-primary/20 bg-primary/5">
              <CardHeader className="flex flex-row items-center justify-between">
                <div className="space-y-1">
                  <CardTitle className="flex items-center gap-2 text-foreground">
                    <Brain className="h-5 w-5 text-primary" />
                    AI Behavioral Insight
                  </CardTitle>
                  <CardDescription className="text-muted-foreground">
                    Get personalized financial advice based on your spending habits.
                  </CardDescription>
                </div>
                <Button onClick={handleGenerateInsight} disabled={insightLoading} variant="outline" className="border-primary/20 hover:bg-primary/10">
                  {insightLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <Sparkles className="mr-2 h-4 w-4 text-primary" />
                      Generate Insight
                    </>
                  )}
                </Button>
              </CardHeader>
              {insight && (
                <CardContent>
                  <div className="rounded-lg bg-background/50 p-4 border border-border">
                    <MarkdownLite text={insight.insight} />
                  </div>
                </CardContent>
              )}
            </Card>
          </div>
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
