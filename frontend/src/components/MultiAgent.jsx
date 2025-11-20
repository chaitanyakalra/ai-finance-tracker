import { useState } from "react";
import { apiService } from "../utils/api";
import { Users, Send, Sparkles, Loader2, CheckCircle2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

function MultiAgent() {
  const [agentQuestion, setAgentQuestion] = useState("");
  const [agentResponses, setAgentResponses] = useState([]);
  const [agentSummary, setAgentSummary] = useState("");
  const [agentLoading, setAgentLoading] = useState(false);
  const [displayIndex, setDisplayIndex] = useState(0);

  const handleMultiAgent = async (e) => {
    e.preventDefault();
    if (!agentQuestion.trim()) return;
    
    setAgentLoading(true);
    setAgentResponses([]);
    setAgentSummary("");
    setDisplayIndex(0);
    
    try {
      const response = await apiService.multiAgentAnalysis(agentQuestion);
      console.log( "handleMultiAgent", response);
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
      setAgentResponses([{agent: "Error", emoji: "❌", response: "Failed to get agent responses"}]);
    } finally {
      setAgentLoading(false);
    }
  };

  const agents = [
    { name: "Budget Analyst", emoji: "📊", color: "#3b82f6", role: "Spending patterns & budget" },
    { name: "Investment Advisor", emoji: "💰", color: "#10b981", role: "Investment & planning" },
    { name: "Risk Assessor", emoji: "🛡️", color: "#f59e0b", role: "Financial risks" }
  ];

  const exampleQuestions = [
    "Should I buy a laptop for ₹50,000?",
    "Is it a good time to invest ₹1,00,000?",
    "How can I save ₹10,000 per month?"
  ];

  return (
    <div className="multi-agent" data-testid="multi-agent-view">
      <motion.div 
        className="page-header"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div>
          <h2>
            <Users className="page-icon" />
            Multi-Agent Analysis
          </h2>
          <p className="page-subtitle">Get comprehensive advice from 3 specialized AI agents</p>
        </div>
        <div className="ai-badge">
          <Sparkles size={16} />
          <span>Collaborative AI</span>
        </div>
      </motion.div>

      <div className="agents-showcase">
        {agents.map((agent, idx) => (
          <motion.div 
            key={idx} 
            className="agent-preview" 
            style={{ borderColor: agent.color }}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3, delay: idx * 0.1 }}
            whileHover={{ scale: 1.05, y: -5 }}
          >
            <div className="agent-preview-emoji" style={{ background: `${agent.color}20` }}>
              {agent.emoji}
            </div>
            <div className="agent-preview-info">
              <h4>{agent.name}</h4>
              <p>{agent.role}</p>
            </div>
            {agentLoading && displayIndex > idx && (
              <CheckCircle2 size={20} style={{ color: agent.color }} />
            )}
          </motion.div>
        ))}
      </div>

      <div className="multi-agent-container">
        <motion.div 
          className="example-questions"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
        >
          <h4>💡 Example questions:</h4>
          <div className="example-chips">
            {exampleQuestions.map((question, idx) => (
              <button
                key={idx}
                className="example-chip"
                onClick={() => setAgentQuestion(question)}
                disabled={agentLoading}
              >
                {question}
              </button>
            ))}
          </div>
        </motion.div>

        <motion.form 
          onSubmit={handleMultiAgent} 
          className="agent-form" 
          data-testid="agent-form"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
        >
          <div className="agent-input-wrapper">
            <Users className="input-icon" />
            <input
              type="text"
              value={agentQuestion}
              onChange={(e) => setAgentQuestion(e.target.value)}
              placeholder="Ask a financial question to get multi-agent analysis..."
              data-testid="agent-question-input"
              disabled={agentLoading}
            />
          </div>
          <button 
            type="submit" 
            className="agent-submit-button"
            disabled={agentLoading || !agentQuestion.trim()}
            data-testid="agent-submit-button"
          >
            {agentLoading ? (
              <>
                <Loader2 className="button-icon spinning" />
                Consulting Agents...
              </>
            ) : (
              <>
                <Send className="button-icon" />
                Get Analysis
              </>
            )}
          </button>
        </motion.form>
        
        <AnimatePresence>
          {agentResponses.length > 0 && (
            <div className="agent-responses" data-testid="agent-responses">
            {agentResponses.map((agent, index) => {
              const agentColor = agents.find(a => a.name === agent.agent)?.color || "#667eea";
              return (
                <div 
                  key={index} 
                  className={`agent-response ${index < displayIndex ? 'visible' : 'hidden'}`}
                  data-testid={`agent-response-${index}`}
                  style={{ borderLeftColor: agentColor }}
                >
                  <div className="agent-response-header">
                    <div className="agent-response-title">
                      <span className="agent-emoji" style={{ background: `${agentColor}20` }}>
                        {agent.emoji}
                      </span>
                      <h3>{agent.agent}</h3>
                    </div>
                    {index < displayIndex && (
                      <CheckCircle2 size={20} style={{ color: agentColor }} />
                    )}
                  </div>
                  <MarkdownLite text={agent.response} className="agent-text response-content" />
                </div>
              );
            })}
            
            {displayIndex >= agentResponses.length && agentSummary && (
              <motion.div 
                className="agent-summary" 
                data-testid="agent-summary"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5 }}
              >
                <div className="summary-header">
                  <Sparkles className="summary-icon" />
                  <h3>Final Recommendation</h3>
                </div>
                <MarkdownLite text={agentSummary} className="response-content" />
              </motion.div>
            )}
          </div>
        )}
        </AnimatePresence>

        <AnimatePresence>
          {agentLoading && (
            <motion.div 
              className="agents-loading"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
            <div className="loading-animation">
              <div className="agent-loading-item">
                <div className="loading-pulse"></div>
                <span>Consulting agents...</span>
              </div>
            </div>
          </motion.div>
        )}
        </AnimatePresence>
      </div>
    </div>
  );
}

export default MultiAgent;

function MarkdownLite({ text, className = "response-content" }) {
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
  return <div className={className}>{elements}</div>;
}

