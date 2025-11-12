import { useState } from "react";
import { apiService } from "../utils/api";

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

  return (
    <div className="multi-agent" data-testid="multi-agent-view">
      <h2>Multi-Agent Financial Analysis</h2>
      <p className="help-text">Get comprehensive financial advice from multiple AI specialists.</p>
      
      <form onSubmit={handleMultiAgent} className="agent-form" data-testid="agent-form">
        <input
          type="text"
          value={agentQuestion}
          onChange={(e) => setAgentQuestion(e.target.value)}
          placeholder="E.g., Should I buy a laptop for ₹50,000?"
          data-testid="agent-question-input"
        />
        <button 
          type="submit" 
          disabled={agentLoading}
          data-testid="agent-submit-button"
        >
          {agentLoading ? "Consulting Agents..." : "Get Multi-Agent Analysis"}
        </button>
      </form>
      
      {agentResponses.length > 0 && (
        <div className="agent-responses" data-testid="agent-responses">
          {agentResponses.map((agent, index) => (
            <div 
              key={index} 
              className={`agent-response ${index < displayIndex ? 'visible' : 'hidden'}`}
              data-testid={`agent-response-${index}`}
            >
              <h3>
                <span className="agent-emoji">{agent.emoji}</span>
                {agent.agent}
              </h3>
              <p className="agent-text">{agent.response}</p>
            </div>
          ))}
          
          {displayIndex >= agentResponses.length && agentSummary && (
            <div className="agent-summary" data-testid="agent-summary">
              <h3>📋 Final Recommendation</h3>
              <p>{agentSummary}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default MultiAgent;

