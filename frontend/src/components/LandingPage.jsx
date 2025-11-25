import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Sparkles, TrendingUp, Shield, Brain, ArrowRight, CheckCircle2, Zap, Users, BarChart3, MessageSquare } from "lucide-react";
import { API_CONFIG } from "../config/api.config";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import Aurora from './Aurora';

const LandingPage = ({ onGetStarted }) => {
  const [isVisible, setIsVisible] = useState(false);
  const navigate = useNavigate();
  const isAuthenticated = !!localStorage.getItem('authToken');

  useEffect(() => {
    setIsVisible(true);
  }, []);

  const handleGetStarted = () => {
    if (isAuthenticated) {
      navigate('/dashboard');
    } else {
      const backendUrl = API_CONFIG.BASE_URL;
      window.location.href = `${backendUrl}/api/auth/google`;
    }
  };

  const features = [
    {
      icon: <Brain className="h-8 w-8 text-primary" />,
      title: "AI-Powered Insights",
      description: "Get intelligent analysis of your spending patterns with Google Gemini AI"
    },
    {
      icon: <Users className="h-8 w-8 text-primary" />,
      title: "Multi-Agent System",
      description: "3 specialized AI agents collaborate to give you comprehensive financial advice"
    },
    {
      icon: <BarChart3 className="h-8 w-8 text-primary" />,
      title: "Smart Analytics",
      description: "Visual breakdowns and behavioral insights to understand your finances better"
    },
    {
      icon: <MessageSquare className="h-8 w-8 text-primary" />,
      title: "Conversational AI",
      description: "Chat naturally about your expenses and get instant, personalized answers"
    }
  ];

  const agents = [
    {
      emoji: "📊",
      name: "Budget Analyst",
      role: "Analyzes spending patterns and budget implications",
      color: "text-blue-500",
      bg: "bg-blue-500/10"
    },
    {
      emoji: "💰",
      name: "Investment Advisor",
      role: "Provides investment and financial planning advice",
      color: "text-emerald-500",
      bg: "bg-emerald-500/10"
    },
    {
      emoji: "🛡️",
      name: "Risk Assessor",
      role: "Evaluates financial risks and provides warnings",
      color: "text-amber-500",
      bg: "bg-amber-500/10"
    }
  ];

  const stats = [
    { value: "3", label: "AI Agents", suffix: "" },
    { value: "100", label: "Accuracy", suffix: "%" },
    { value: "24/7", label: "Available", suffix: "" },
    { value: "∞", label: "Insights", suffix: "" }
  ];

  return (
    <div className={`min-h-screen bg-background text-foreground overflow-x-hidden transition-opacity duration-700 ${isVisible ? 'opacity-100' : 'opacity-0'}`}>

      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center justify-center pt-20 pb-32 px-6 overflow-hidden">
        {/* Background Effects */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <Aurora
            colorStops={["#0A2E6E", "#3A0CA3", "#FF4D6D"]}
            blend={0.5}
            amplitude={1.0}
            speed={1.2}
          />
        </div>

        <div className="container mx-auto grid lg:grid-cols-2 gap-12 items-center relative z-10">
          <div className="space-y-8 text-center lg:text-left">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-muted/50 border border-border backdrop-blur-sm animate-fade-in-up">
              <Sparkles className="h-4 w-4 text-primary" />
              <span className="text-sm font-medium">Powered by Google Gemini AI</span>
            </div>

            <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold tracking-tight leading-tight animate-fade-in-up delay-100">
              Your <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-secondary">Intelligent</span>
              <br />
              Financial Guardian
            </h1>

            <p className="text-xl text-muted-foreground max-w-2xl mx-auto lg:mx-0 animate-fade-in-up delay-200">
              Experience the future of personal finance with multi-agent AI collaboration.
              Track expenses, get insights, and make smarter financial decisions.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start animate-fade-in-up delay-300">
              <Button
                size="lg"
                className="text-lg px-8 py-6 rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 shadow-lg shadow-primary/25 transition-all hover:-translate-y-1"
                onClick={handleGetStarted}
              >
                {isAuthenticated ? 'Go to Dashboard' : 'Get Started Free'}
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
              <Button
                variant="outline"
                size="lg"
                className="text-lg px-8 py-6 rounded-xl border-border hover:bg-muted/50 transition-all hover:-translate-y-1"
                onClick={onGetStarted}
              >
                <Zap className="mr-2 h-5 w-5" />
                See Demo
              </Button>
            </div>

            <div className="flex gap-8 justify-center lg:justify-start pt-8 animate-fade-in-up delay-400">
              {stats.map((stat, index) => (
                <div key={index} className="text-center lg:text-left">
                  <div className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-primary to-secondary">
                    {stat.value}{stat.suffix}
                  </div>
                  <div className="text-sm text-muted-foreground mt-1">{stat.label}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="relative hidden lg:block animate-fade-in-right">
            <div className="relative w-full aspect-square max-w-[600px] mx-auto">
              {/* Floating Cards */}
              <Card className="absolute top-[10%] left-0 w-64 bg-card/50 backdrop-blur-xl border-border shadow-2xl animate-float">
                <CardContent className="p-4 flex items-center gap-4">
                  <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center text-2xl">💰</div>
                  <div>
                    <div className="text-xs text-muted-foreground">Total Spending</div>
                    <div className="text-xl font-bold text-primary">₹15,100</div>
                  </div>
                </CardContent>
              </Card>

              <Card className="absolute top-[45%] right-0 w-64 bg-card/50 backdrop-blur-xl border-border shadow-2xl animate-float delay-1000">
                <CardContent className="p-4 flex items-center gap-4">
                  <div className="h-12 w-12 rounded-full bg-secondary/10 flex items-center justify-center text-2xl">📊</div>
                  <div>
                    <div className="text-xs text-muted-foreground">AI Insight</div>
                    <div className="text-sm font-medium">Food spending up 23%</div>
                  </div>
                </CardContent>
              </Card>

              <Card className="absolute bottom-[10%] left-[10%] w-64 bg-card/50 backdrop-blur-xl border-border shadow-2xl animate-float delay-2000">
                <CardContent className="p-4 flex items-center gap-4">
                  <div className="h-12 w-12 rounded-full bg-accent/10 flex items-center justify-center text-2xl">🎯</div>
                  <div>
                    <div className="text-xs text-muted-foreground">Recommendation</div>
                    <div className="text-sm font-medium">Save ₹2,000 this month</div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-24 px-6 bg-muted/30">
        <div className="container mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Powerful Features</h2>
            <p className="text-muted-foreground text-lg">Everything you need to master your finances</p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => (
              <Card key={index} className="bg-card/50 border-border hover:border-primary/50 transition-all hover:-translate-y-2 duration-300">
                <CardContent className="p-6">
                  <div className="h-14 w-14 rounded-2xl bg-primary/10 flex items-center justify-center mb-6">
                    {feature.icon}
                  </div>
                  <h3 className="text-xl font-semibold mb-3">{feature.title}</h3>
                  <p className="text-muted-foreground leading-relaxed">{feature.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Agents Section */}
      <section className="py-24 px-6">
        <div className="container mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Meet Your AI Team</h2>
            <p className="text-muted-foreground text-lg">Three specialized agents working together for your financial success</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto mb-16">
            {agents.map((agent, index) => (
              <Card key={index} className="bg-card/50 border-border hover:border-primary/50 transition-all hover:-translate-y-2 duration-300 text-center">
                <CardContent className="p-8">
                  <div className={`h-20 w-20 rounded-full ${agent.bg} flex items-center justify-center text-4xl mx-auto mb-6`}>
                    {agent.emoji}
                  </div>
                  <h3 className="text-xl font-semibold mb-2">{agent.name}</h3>
                  <p className="text-sm text-muted-foreground mb-4">{agent.role}</p>
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-secondary/10 text-secondary text-xs font-medium">
                    <span className="relative flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-secondary opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-secondary"></span>
                    </span>
                    Active
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="flex items-center justify-center gap-4 text-muted-foreground">
            <div className="h-px w-24 bg-gradient-to-r from-transparent to-primary/50"></div>
            <div className="flex flex-col items-center gap-2">
              <Brain className="h-8 w-8 text-primary" />
              <span className="text-sm font-medium">Collaborative Intelligence</span>
            </div>
            <div className="h-px w-24 bg-gradient-to-l from-transparent to-primary/50"></div>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-24 px-6 bg-muted/30">
        <div className="container mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">How It Works</h2>
            <p className="text-muted-foreground text-lg">Get started in three simple steps</p>
          </div>

          <div className="flex flex-col md:flex-row items-center justify-center gap-8 max-w-5xl mx-auto">
            {[
              { title: "Track Expenses", desc: "Add your daily expenses across multiple categories" },
              { title: "AI Analysis", desc: "Our multi-agent system analyzes your spending patterns" },
              { title: "Get Insights", desc: "Receive personalized recommendations and insights" }
            ].map((step, index) => (
              <div key={index} className="flex-1 w-full">
                <Card className="bg-card/50 border-border h-full hover:border-primary/50 transition-all duration-300">
                  <CardContent className="p-8 text-center">
                    <div className="h-16 w-16 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-2xl font-bold text-background mx-auto mb-6">
                      {index + 1}
                    </div>
                    <h3 className="text-xl font-semibold mb-3">{step.title}</h3>
                    <p className="text-muted-foreground">{step.desc}</p>
                  </CardContent>
                </Card>
                {index < 2 && (
                  <div className="hidden md:block absolute top-1/2 -right-4 transform -translate-y-1/2 text-primary text-2xl">→</div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-24 px-6">
        <div className="container mx-auto max-w-6xl">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div>
              <h2 className="text-3xl md:text-4xl font-bold mb-8">Why Choose FinanceGuard AI?</h2>
              <ul className="space-y-6">
                {[
                  "Real-time AI-powered expense analysis",
                  "Multi-agent collaboration for comprehensive advice",
                  "Behavioral finance insights to improve spending habits",
                  "Natural language chat interface",
                  "Secure and private - your data stays yours",
                  "Free to use with unlimited insights"
                ].map((benefit, index) => (
                  <li key={index} className="flex items-start gap-4">
                    <CheckCircle2 className="h-6 w-6 text-secondary shrink-0 mt-0.5" />
                    <span className="text-lg text-muted-foreground">{benefit}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="space-y-6">
              <Card className="bg-card/50 border-border hover:translate-x-2 transition-transform duration-300">
                <CardContent className="p-8">
                  <TrendingUp className="h-12 w-12 text-primary mb-4" />
                  <h3 className="text-xl font-semibold mb-2">Smart Tracking</h3>
                  <p className="text-muted-foreground">Monitor every rupee with intelligent categorization</p>
                </CardContent>
              </Card>
              <Card className="bg-card/50 border-border hover:translate-x-2 transition-transform duration-300">
                <CardContent className="p-8">
                  <Shield className="h-12 w-12 text-primary mb-4" />
                  <h3 className="text-xl font-semibold mb-2">Risk Assessment</h3>
                  <p className="text-muted-foreground">Get warnings about potential financial risks</p>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 px-6 bg-gradient-to-br from-primary/20 to-secondary/20">
        <div className="container mx-auto text-center max-w-3xl">
          <h2 className="text-3xl md:text-4xl font-bold mb-6">Ready to Transform Your Finances?</h2>
          <p className="text-xl text-muted-foreground mb-10">Join the future of personal finance management today</p>
          <Button
            size="lg"
            className="text-lg px-10 py-8 rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 shadow-xl shadow-primary/25 transition-all hover:-translate-y-1"
            onClick={handleGetStarted}
          >
            {isAuthenticated ? 'Go to Dashboard' : 'Start Your Journey'}
            <ArrowRight className="ml-2 h-6 w-6" />
          </Button>
          <p className="mt-6 text-sm text-muted-foreground">No credit card required • Free forever • Setup in 2 minutes</p>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-6 border-t border-border bg-muted/20">
        <div className="container mx-auto flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="text-center md:text-left">
            <h3 className="text-xl font-bold mb-2">FinanceGuard AI</h3>
            <p className="text-muted-foreground">Your intelligent financial companion</p>
          </div>
          <div className="text-center md:text-right text-sm text-muted-foreground">
            <p>B.Tech Final Year Project</p>
            <p>Powered by Google Gemini AI & MongoDB</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
