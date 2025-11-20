import { useState } from "react";
import { apiService } from "../utils/api";
import { MessageSquare, Send, Sparkles, Brain, Loader2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

function AIChat() {
  const [chatQuestion, setChatQuestion] = useState("");
  const [chatResponse, setChatResponse] = useState("");
  const [chatLoading, setChatLoading] = useState(false);

  const handleAIChat = async (e) => {
    e.preventDefault();
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

  const suggestedQuestions = [
    "How much did I spend on food this month?",
    "What are my top spending categories?",
    "Show me my spending patterns",
    "How can I reduce my expenses?",
    "What's my average daily spending?"
  ];

  return (
    <div className="ai-chat" data-testid="ai-chat-view">
      <motion.div 
        className="page-header"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div>
          <h2>
            <MessageSquare className="page-icon" />
            AI Financial Assistant
          </h2>
          <p className="page-subtitle">Ask questions about your expenses and get intelligent insights</p>
        </div>
        <div className="ai-badge">
          <Sparkles size={16} />
          <span>Powered by Gemini AI</span>
        </div>
      </motion.div>

      <div className="chat-container">
        <motion.div 
          className="chat-suggestions"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          <h4>💬 Try asking:</h4>
          <div className="suggestion-chips">
            {suggestedQuestions.map((question, idx) => (
              <button
                key={idx}
                className="suggestion-chip"
                onClick={() => setChatQuestion(question)}
                disabled={chatLoading}
              >
                {question}
              </button>
            ))}
          </div>
        </motion.div>

        <motion.form 
          onSubmit={handleAIChat} 
          className="chat-form" 
          data-testid="chat-form"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <div className="chat-input-wrapper">
            <Brain className="input-icon" />
            <textarea
              value={chatQuestion}
              onChange={(e) => setChatQuestion(e.target.value)}
              placeholder="Ask me anything about your finances..."
              rows="3"
              data-testid="chat-question-input"
              disabled={chatLoading}
            />
          </div>
          <button 
            type="submit" 
            className="chat-submit-button"
            disabled={chatLoading || !chatQuestion.trim()}
            data-testid="chat-submit-button"
          >
            {chatLoading ? (
              <>
                <Loader2 className="button-icon spinning" />
                Analyzing...
              </>
            ) : (
              <>
                <Send className="button-icon" />
                Ask AI
              </>
            )}
          </button>
        </motion.form>
        
        <AnimatePresence>
          {chatResponse && (
            <motion.div 
              className="chat-response" 
              data-testid="chat-response"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.3 }}
            >
            <div className="response-header">
              <Sparkles className="response-icon" />
              <h3>AI Response</h3>
            </div>
            <MarkdownLite text={chatResponse} />
          </motion.div>
        )}
        </AnimatePresence>

        <AnimatePresence>
          {chatLoading && (
            <motion.div 
              className="chat-loading"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
            <div className="loading-dots">
              <span></span>
              <span></span>
              <span></span>
            </div>
            <p>AI is analyzing your financial data...</p>
          </motion.div>
        )}
        </AnimatePresence>
      </div>
    </div>
  );
}

export default AIChat;

function MarkdownLite({ text }) {
  const currency = (v) => v;
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
          <ul key={`ul-${elements.length}`}>
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
        <ul key={`ul-${elements.length}`}>
          {list.map((li, idx) => (
            <li key={`li-${idx}`}>{renderInline(li)}</li>
          ))}
        </ul>
      );
      list = [];
    }
    elements.push(<p key={`p-${elements.length}`}>{renderInline(line)}</p>);
  }
  if (list.length) {
    elements.push(
      <ul key={`ul-${elements.length}`}>
        {list.map((li, idx) => (
          <li key={`li-${idx}`}>{renderInline(li)}</li>
        ))}
      </ul>
    );
  }
  return <div className="response-content">{elements}</div>;
}

