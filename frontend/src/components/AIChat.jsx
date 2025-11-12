import { useState } from "react";
import { api } from "../utils/api";

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
      const response = await api.chat(chatQuestion);
      setChatResponse(response.data.response);
    } catch (error) {
      console.error("Error in AI chat:", error);
      setChatResponse("Error: Failed to get AI response");
    } finally {
      setChatLoading(false);
    }
  };

  return (
    <div className="ai-chat" data-testid="ai-chat-view">
      <h2>AI Financial Insights</h2>
      <p className="help-text">Ask questions about your expenses and get AI-powered insights.</p>
      
      <form onSubmit={handleAIChat} className="chat-form" data-testid="chat-form">
        <textarea
          value={chatQuestion}
          onChange={(e) => setChatQuestion(e.target.value)}
          placeholder="E.g., How much did I spend on food? What are my spending patterns?"
          rows="3"
          data-testid="chat-question-input"
        />
        <button 
          type="submit" 
          disabled={chatLoading}
          data-testid="chat-submit-button"
        >
          {chatLoading ? "Analyzing..." : "Ask AI"}
        </button>
      </form>
      
      {chatResponse && (
        <div className="chat-response" data-testid="chat-response">
          <h3>AI Response:</h3>
          <p>{chatResponse}</p>
        </div>
      )}
    </div>
  );
}

export default AIChat;

