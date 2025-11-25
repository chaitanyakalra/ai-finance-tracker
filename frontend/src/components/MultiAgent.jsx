import { useState, useRef, useEffect } from "react";
import { apiService } from "../utils/api";
import { Users, Send, Sparkles, Loader2, CheckCircle2, Brain } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";

function MultiAgent() {
  const [agentQuestion, setAgentQuestion] = useState("");
  const [agentResponses, setAgentResponses] = useState([]);
  const [agentSummary, setAgentSummary] = useState("");
  const [agentLoading, setAgentLoading] = useState(false);
  const [displayIndex, setDisplayIndex] = useState(0);
  const textareaRef = useRef(null);

  const handleMultiAgent = async () => {
    if (!agentQuestion.trim()) return;

    setAgentLoading(true);
    setAgentResponses([]);
    setAgentSummary("");
    setDisplayIndex(0);

    try {
      const response = await apiService.multiAgentAnalysis(agentQuestion);
      setAgentResponses(response.data.agents);
      setAgentSummary(response.data.summary);

      // Animate display
      response.data.agents.forEach((_, index) => {
        setTimeout(() => {
          setDisplayIndex(index + 1);
        }, (index + 1) * 1500);
      });
    } catch (error) {
      console.error("Error in multi-agent:", error);
      setAgentResponses([{ agent: "Error", emoji: "❌", response: "Failed to get agent responses" }]);
    } finally {
      setAgentLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleMultiAgent();
    }
  };

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'inherit';
      const scrollHeight = textareaRef.current.scrollHeight;
      textareaRef.current.style.height = `${Math.min(scrollHeight, 150)}px`;
    }
  }, [agentQuestion]);

  const agents = [
    { name: "Budget Analyst", emoji: "📊", color: "text-blue-500", bg: "bg-blue-500/10", border: "border-blue-500/20", role: "Spending patterns & budget" },
    { name: "Investment Advisor", emoji: "💰", color: "text-emerald-500", bg: "bg-emerald-500/10", border: "border-emerald-500/20", role: "Investment & planning" },
    { name: "Risk Assessor", emoji: "🛡️", color: "text-amber-500", bg: "bg-amber-500/10", border: "border-amber-500/20", role: "Financial risks" }
  ];

  const exampleQuestions = [
    "Should I buy a laptop for ₹50,000?",
    "Is it a good time to invest ₹1,00,000?",
    "How can I save ₹10,000 per month?"
  ];

  return (
    <div className="h-full flex flex-col space-y-6">
      <div className="flex items-center justify-between shrink-0">
        <div>
          <h2 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <Users className="h-8 w-8 text-primary" />
            Multi-Agent Analysis
          </h2>
          <p className="text-muted-foreground">Get comprehensive advice from 3 specialized AI agents</p>
        </div>
        <div className="flex items-center gap-2 rounded-full bg-primary/10 px-4 py-2 text-sm font-medium text-primary">
          <Sparkles size={16} />
          <span>Collaborative AI</span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 shrink-0">
        {agents.map((agent, idx) => (
          <motion.div
            key={idx}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3, delay: idx * 0.1 }}
            whileHover={{ scale: 1.02 }}
          >
            <Card className={`border ${agent.border} relative overflow-hidden`}>
              <CardContent className="p-4 flex items-center gap-4">
                <div className={`h-12 w-12 rounded-xl flex items-center justify-center text-2xl ${agent.bg}`}>
                  {agent.emoji}
                </div>
                <div>
                  <h4 className="font-semibold">{agent.name}</h4>
                  <p className="text-xs text-muted-foreground">{agent.role}</p>
                </div>
                {agentLoading && displayIndex > idx && (
                  <div className="absolute top-2 right-2">
                    <CheckCircle2 className={`h-5 w-5 ${agent.color}`} />
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-3 flex-1 min-h-0">
        <div className="lg:col-span-2 flex flex-col space-y-4 h-full min-h-0">
          <Card className="flex-1 flex flex-col overflow-hidden relative">
            <ScrollArea className="flex-1 p-4">
              <div className="space-y-6">
                <AnimatePresence mode="wait">
                  {agentResponses.length === 0 && !agentLoading ? (
                    <div className="flex h-full flex-col items-center justify-center text-center text-muted-foreground opacity-50 min-h-[300px]">
                      <Users className="mb-4 h-16 w-16" />
                      <p className="text-lg">Ask a question to start the multi-agent analysis</p>
                    </div>
                  ) : (
                    <>
                      {agentResponses.map((agent, index) => {
                        const agentConfig = agents.find(a => a.name === agent.agent) || { color: "text-primary", bg: "bg-primary/10" };
                        return (
                          <motion.div
                            key={index}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: index < displayIndex ? 1 : 0, x: index < displayIndex ? 0 : -20, display: index < displayIndex ? 'block' : 'none' }}
                            className="flex gap-4"
                          >
                            <div className={`h-10 w-10 shrink-0 rounded-full flex items-center justify-center text-lg ${agentConfig.bg} border border-border`}>
                              {agent.emoji}
                            </div>
                            <div className="space-y-1">
                              <div className="flex items-center gap-2">
                                <span className="font-semibold">{agent.agent}</span>
                                <CheckCircle2 className={`h-4 w-4 ${agentConfig.color}`} />
                              </div>
                              <div className="rounded-2xl rounded-tl-none bg-muted px-4 py-3 text-sm">
                                <MarkdownLite text={agent.response} />
                              </div>
                            </div>
                          </motion.div>
                        );
                      })}

                      {displayIndex >= agentResponses.length && agentSummary && (
                        <motion.div
                          initial={{ opacity: 0, scale: 0.95 }}
                          animate={{ opacity: 1, scale: 1 }}
                          className="mt-8 rounded-xl border-2 border-primary/20 bg-primary/5 p-6"
                        >
                          <div className="mb-4 flex items-center gap-2 text-primary">
                            <Sparkles className="h-5 w-5" />
                            <h3 className="font-bold">Final Recommendation</h3>
                          </div>
                          <MarkdownLite text={agentSummary} className="text-sm leading-relaxed" />
                        </motion.div>
                      )}
                    </>
                  )}
                </AnimatePresence>

                {agentLoading && (
                  <div className="flex items-center gap-2 text-muted-foreground animate-pulse">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>Consulting agents...</span>
                  </div>
                )}
              </div>

              {/* Bottom padding for fixed input */}
              <div className="h-32" />
            </ScrollArea>

            {/* FIXED STICKY INPUT BAR */}
            <div className="absolute bottom-0 left-0 right-0 p-4 border-t bg-background/95 backdrop-blur-lg supports-[backdrop-filter]:bg-background/60">
              <div className="flex items-end gap-2">
                <div className="relative flex-1">
                  <Users className="absolute left-3 top-3 h-5 w-5 text-muted-foreground z-10" />
                  <Textarea
                    ref={textareaRef}
                    value={agentQuestion}
                    onChange={(e) => setAgentQuestion(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="Ask a financial question..."
                    className="min-h-[50px] max-h-[150px] w-full resize-none rounded-xl border-muted bg-muted/50 pl-10 pr-4 py-3 text-sm focus-visible:ring-1 focus-visible:ring-primary"
                    rows={1}
                    disabled={agentLoading}
                  />
                </div>
                <Button
                  onClick={handleMultiAgent}
                  size="icon"
                  className="h-[50px] w-[50px] shrink-0 rounded-xl transition-all hover:scale-105"
                  disabled={agentLoading || !agentQuestion.trim()}
                >
                  {agentLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-5 w-5" />}
                  <span className="sr-only">Send</span>
                </Button>
              </div>
            </div>
          </Card>
        </div>

        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium">Example Questions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {exampleQuestions.map((question, idx) => (
                <Button
                  key={idx}
                  variant="secondary"
                  className="w-full justify-start h-auto py-3 text-left whitespace-normal text-xs"
                  onClick={() => setAgentQuestion(question)}
                  disabled={agentLoading}
                >
                  {question}
                </Button>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

export default MultiAgent;

function MarkdownLite({ text, className = "text-sm leading-relaxed" }) {
  const renderInline = (t) => {
    const parts = [];
    const regex = /\*\*([^*]+)\*\*/g;
    let last = 0;
    let m;
    while ((m = regex.exec(t)) !== null) {
      if (m.index > last) parts.push(t.slice(last, m.index));
      parts.push(<strong key={parts.length}>{m[1]}</strong>);
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