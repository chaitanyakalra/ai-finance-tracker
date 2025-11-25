import { useState, useRef, useEffect } from "react";
import { apiService } from "../utils/api";
import { MessageSquare, Send, Sparkles, Brain, Loader2, User } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import MultiAgent from "./MultiAgent";

function AIChat() {
  const [chatQuestion, setChatQuestion] = useState("");
  const [chatResponse, setChatResponse] = useState("");
  const [chatLoading, setChatLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("general");
  const textareaRef = useRef(null);

  const handleAIChat = async () => {
    if (!chatQuestion.trim()) return;

    setChatLoading(true);
    setChatResponse("");

    try {
      const response = await apiService.aiChat(chatQuestion);
      setChatResponse(response.data.response);
    } catch (error) {
      console.error("Error in AI chat:", error);
      setChatResponse("Error: Failed to get AI response");
    } finally {
      setChatLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleAIChat();
    }
  };

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'inherit';
      const scrollHeight = textareaRef.current.scrollHeight;
      textareaRef.current.style.height = `${Math.min(scrollHeight, 150)}px`;
    }
  }, [chatQuestion]);

  const suggestedQuestions = [
    "How much did I spend on food this month?",
    "What are my top spending categories?",
    "Show me my spending patterns",
    "How can I reduce my expenses?",
    "What's my average daily spending?"
  ];

  return (
    <div className="h-full flex flex-col space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between shrink-0">
        <div>
          <h2 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <MessageSquare className="h-8 w-8 text-primary" />
            AI Financial Assistant
          </h2>
          <p className="text-muted-foreground">Ask questions about your expenses and get intelligent insights</p>
        </div>
        <div className="flex items-center gap-2 rounded-full bg-primary/10 px-4 py-2 text-sm font-medium text-primary">
          <Sparkles size={16} />
          <span>Powered by Gemini AI</span>
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full flex-1 flex flex-col min-h-0">
        <TabsList className="grid w-full grid-cols-2 max-w-[400px] shrink-0">
          <TabsTrigger value="general">General Assistant</TabsTrigger>
          <TabsTrigger value="multi-agent">Expert Panel</TabsTrigger>
        </TabsList>

        {/* General Assistant Tab */}
        <TabsContent value="general" className="flex-1 mt-6 min-h-0 data-[state=active]:flex">
          <Card className="lg:col-span-2 flex flex-col w-full h-full min-h-0 border-0 shadow-none lg:border lg:shadow-sm overflow-hidden relative">

            {/* Scrollable Chat Area */}
            <ScrollArea className="flex-1 p-4">
              <AnimatePresence mode="wait">
                {!chatResponse && !chatLoading ? (
                  <div className="flex h-full flex-col items-center justify-center text-center text-muted-foreground opacity-50 min-h-[300px]">
                    <Brain className="mb-4 h-16 w-16" />
                    <p className="text-lg mb-6">Ask me anything about your finances</p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-w-2xl">
                      {suggestedQuestions.map((q, idx) => (
                        <button
                          key={idx}
                          onClick={() => setChatQuestion(q)}
                          className="text-left text-sm p-3 rounded-lg border border-muted hover:border-primary hover:bg-muted/50 transition-colors opacity-100"
                        >
                          {q}
                        </button>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="space-y-6 pb-6">
                    {/* User Message */}
                    {chatQuestion && (
                      <div className="flex justify-end">
                        <div className="flex gap-3 max-w-[80%] flex-row-reverse">
                          <div className="h-8 w-8 shrink-0 rounded-full bg-primary flex items-center justify-center text-primary-foreground">
                            <User size={16} />
                          </div>
                          <div className="rounded-2xl rounded-tr-none bg-primary px-4 py-3 text-primary-foreground">
                            <p className="text-sm">{chatQuestion}</p>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Loading State */}
                    {chatLoading && (
                      <div className="flex justify-start">
                        <div className="flex gap-3 max-w-[80%]">
                          <div className="h-8 w-8 shrink-0 rounded-full bg-muted flex items-center justify-center">
                            <Brain size={16} className="text-primary" />
                          </div>
                          <div className="flex items-center gap-2 rounded-2xl rounded-tl-none bg-muted px-4 py-3">
                            <Loader2 className="h-4 w-4 animate-spin" />
                            <span className="text-sm">Analyzing your finances...</span>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* AI Response */}
                    {chatResponse && (
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="flex justify-start"
                      >
                        <div className="flex gap-3 max-w-[90%]">
                          <div className="h-8 w-8 shrink-0 rounded-full bg-muted flex items-center justify-center">
                            <Brain size={16} className="text-primary" />
                          </div>
                          <div className="rounded-2xl rounded-tl-none bg-muted px-4 py-3">
                            <MarkdownLite text={chatResponse} />
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </div>
                )}
              </AnimatePresence>

              {/* Bottom padding for fixed input */}
              <div className="h-32" />
            </ScrollArea>

            {/* FIXED STICKY INPUT BAR */}
            <div className="absolute bottom-0 left-0 right-0 p-4 border-t bg-background/95 backdrop-blur-lg supports-[backdrop-filter]:bg-background/60">
              <div className="flex items-end gap-2">
                <Textarea
                  ref={textareaRef}
                  value={chatQuestion}
                  onChange={(e) => setChatQuestion(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Ask anything..."
                  className="min-h-[50px] max-h-[150px] w-full resize-none rounded-xl border-muted bg-muted/50 px-4 py-3 text-sm focus-visible:ring-1 focus-visible:ring-primary"
                  rows={1}
                />
                <Button
                  onClick={handleAIChat}
                  size="icon"
                  className="h-[50px] w-[50px] shrink-0 rounded-xl transition-all hover:scale-105"
                  disabled={chatLoading || !chatQuestion.trim()}
                >
                  <Send className="h-5 w-5" />
                  <span className="sr-only">Send</span>
                </Button>
              </div>
            </div>
          </Card>
        </TabsContent>

        {/* Multi-Agent Tab */}
        <TabsContent value="multi-agent" className="flex-1 mt-6 min-h-0">
          <MultiAgent />
        </TabsContent>
      </Tabs>
    </div>
  );
}

export default AIChat;

function MarkdownLite({ text }) {
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
    elements.push(<p key={`p-${elements.length}`} className="my-1 text-sm leading-relaxed">{renderInline(line)}</p>);
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
  return <div className="text-foreground">{elements}</div>;
}