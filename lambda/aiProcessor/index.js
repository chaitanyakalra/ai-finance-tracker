import { GoogleGenerativeAI } from '@google/generative-ai';

// Initialize Gemini
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

async function callGemini(prompt, modelName = 'gemini-2.0-flash-exp') {
  const model = genAI.getGenerativeModel({ model: modelName });
  const result = await model.generateContent(prompt);
  const response = await result.response;
  return response.text();
}

async function processChat(expenses, question) {
  const expenseSummary = prepareExpenseSummary(expenses);
  
  const prompt = `
You are a personal finance assistant with deep expertise in behavioral finance and spending analysis.

${expenseSummary}

User Question: ${question}

Provide a comprehensive, actionable response with:
1. Direct answer to the question
2. Data-driven insights
3. Specific recommendations
4. Relevant warnings or opportunities
`;

  const response = await callGemini(prompt);
  
  return {
    response,
    context: expenseSummary,
    processed_by: 'Gemini Lambda'
  };
}

async function processMultiAgent(expenses, question) {
  const expenseSummary = prepareExpenseSummary(expenses);
  const byCategory = {};
  expenses.forEach(exp => { byCategory[exp.category] = (byCategory[exp.category] || 0) + Number(exp.amount); });
  const totalAll = Object.values(byCategory).reduce((sum, amt) => sum + amt, 0);
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const monthExpenses = expenses.filter(exp => { const d = new Date(exp.date); return d >= monthStart && d <= now; });
  const byCategoryMonth = {};
  monthExpenses.forEach(exp => { byCategoryMonth[exp.category] = (byCategoryMonth[exp.category] || 0) + Number(exp.amount); });
  const totalMonth = Object.values(byCategoryMonth).reduce((sum, amt) => sum + amt, 0);
  const daysElapsed = Math.max(1, Math.ceil((now - monthStart) / 86400000));
  const avgDailyMonth = totalMonth / daysElapsed;
  const topOverall = Object.entries(byCategory).sort((a,b)=>b[1]-a[1]).slice(0,3).map(([c,a])=>({category:c, amount:a}));
  const topMonth = Object.entries(byCategoryMonth).sort((a,b)=>b[1]-a[1]).slice(0,3).map(([c,a])=>({category:c, amount:a}));
  const stats = {
    totals: { all_time: totalAll, this_month: totalMonth },
    average_daily: { this_month: avgDailyMonth },
    top_categories: { all_time: topOverall, this_month: topMonth },
    by_category_all_time: byCategory,
    by_category_this_month: byCategoryMonth,
    formatted: {
      total_all_time: `₹${Number(totalAll).toFixed(2)}`,
      total_this_month: `₹${Number(totalMonth).toFixed(2)}`,
      avg_daily_this_month: `₹${Number(avgDailyMonth).toFixed(2)}`
    }
  };
  
  const agents = [
    {
      name: "Budget Analyst",
      role: "Analyzes spending patterns and budget implications",
      emoji: "📊",
      focus: "spending patterns, budget allocation, savings opportunities"
    },
    {
      name: "Investment Advisor",
      role: "Provides investment and financial planning advice",
      emoji: "💰",
      focus: "wealth building, investment strategies, financial growth"
    },
    {
      name: "Risk Assessor",
      role: "Evaluates financial risks and provides warnings",
      emoji: "🛡️",
      focus: "financial risks, emergency funds, insurance needs"
    },
    {
      name: "Behavioral Economist",
      role: "Identifies psychological spending patterns",
      emoji: "🧠",
      focus: "spending psychology, habit formation, decision biases"
    }
  ];
  
  const responses = [];
  
  // Process agents in parallel for better performance
  const agentPromises = agents.map(async (agent) => {
    const prompt = `
You are the ${agent.name}, a specialist in ${agent.role}.
Your focus areas: ${agent.focus}

Financial context:
${expenseSummary}

User Question: ${question}

Provide your expert analysis from your specialized perspective.
Be specific and actionable (4-5 sentences max).
Include numbers and concrete recommendations where possible.
`;
    
    const response = await callGemini(prompt);
    
    return {
      agent: agent.name,
      emoji: agent.emoji,
      response
    };
  });
  
  const agentResponses = await Promise.all(agentPromises);
  
  // Generate synthesis
  const summaryPrompt = `
Based on these expert opinions from a multi-agent financial analysis:

${agentResponses.map(r => `${r.agent}: ${r.response}`).join('\n\n')}

User's question: ${question}

Provide a unified final recommendation that:
1. Synthesizes the key insights from all experts
2. Prioritizes the most critical actions
3. Provides a clear, actionable next step
4. Is concise (3-4 sentences)
Ground the recommendation in the financial context above.
`;
  
  const summary = await callGemini(summaryPrompt);
  
  return {
    agents: agentResponses,
    summary,
    context: expenseSummary,
    stats,
    processed_by: 'Gemini Lambda'
  };
}

async function processBehavioralInsight(expenses) {
  if (expenses.length === 0) {
    return { 
      insight: "No data available yet. Start tracking your expenses to get personalized insights!", 
      stats: {} 
    };
  }
  
  // Calculate comprehensive statistics
  const byCategory = {};
  const byDate = {};
  const byWeekday = {};
  
  expenses.forEach(exp => {
    // By category
    byCategory[exp.category] = (byCategory[exp.category] || 0) + exp.amount;
    
    // By date (month)
    const date = exp.date.substring(0, 7); // YYYY-MM
    byDate[date] = (byDate[date] || 0) + exp.amount;
    
    // By weekday
    const weekday = new Date(exp.date).getDay();
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    byWeekday[days[weekday]] = (byWeekday[days[weekday]] || 0) + exp.amount;
  });
  
  const total = Object.values(byCategory).reduce((sum, amt) => sum + amt, 0);
  const avgExpense = total / expenses.length;
  const topCategory = Object.entries(byCategory).sort((a, b) => b[1] - a[1])[0];
  
  const prompt = `
You are a behavioral finance expert analyzing spending patterns.

Expense Statistics:
- Total spending: ₹${total.toFixed(2)}
- Number of transactions: ${expenses.length}
- Average transaction: ₹${avgExpense.toFixed(2)}
- Top category: ${topCategory[0]} (₹${topCategory[1].toFixed(2)})

Spending by category: ${JSON.stringify(byCategory, null, 2)}
Spending by month: ${JSON.stringify(byDate, null, 2)}
Spending by weekday: ${JSON.stringify(byWeekday, null, 2)}

Provide a comprehensive behavioral finance analysis in this format:

INSIGHT: [A compelling insight title about their spending behavior]

PATTERN: [Describe the key pattern you identified in their spending]

PSYCHOLOGY: [Explain the psychological/behavioral economics principle at play]

IMPACT: [Quantify the financial impact of this behavior]

RECOMMENDATION: [Provide ONE specific, actionable recommendation with expected outcome]

CHALLENGE: [Suggest a 7-day behavioral challenge to improve this pattern]
`;
  
  const insightText = await callGemini(prompt);
  
  return {
    insight: insightText,
    stats: {
      total,
      average_transaction: avgExpense,
      transaction_count: expenses.length,
      top_category: topCategory[0],
      top_amount: topCategory[1],
      by_category: byCategory,
      by_month: byDate,
      by_weekday: byWeekday
    },
    processed_by: 'Gemini Lambda'
  };
}

function prepareExpenseSummary(expenses) {
  let summary = `Total expenses: ${expenses.length}\n`;
  
  const byCategory = {};
  expenses.forEach(exp => {
    byCategory[exp.category] = (byCategory[exp.category] || 0) + exp.amount;
  });
  
  summary += "\nSpending by category:\n";
  Object.entries(byCategory).forEach(([cat, amt]) => {
    summary += `- ${cat}: ₹${amt.toFixed(2)}\n`;
  });
  
  summary += "\nRecent transactions:\n";
  expenses.slice(-5).forEach(exp => {
    summary += `- ${exp.date}: ${exp.category} - ₹${exp.amount} (${exp.description})\n`;
  });
  
  return summary;
}

export const handler = async (event) => {
  console.log('Lambda invoked with event:', JSON.stringify(event));
  
  try {
    // Validate Gemini API key
    if (!process.env.GEMINI_API_KEY) {
      throw new Error('GEMINI_API_KEY not configured in Lambda environment');
    }
    
    const { query_type, expenses, question, user_id } = event;
    
    // Validate required fields
    if (!query_type) {
      throw new Error('query_type is required');
    }
    
    if (!expenses || !Array.isArray(expenses)) {
      throw new Error('expenses must be an array');
    }
    
    let result;
    const startTime = Date.now();
    
    switch (query_type) {
      case 'chat':
        if (!question) throw new Error('question is required for chat query');
        result = await processChat(expenses, question);
        break;
        
      case 'multi-agent':
        if (!question) throw new Error('question is required for multi-agent query');
        result = await processMultiAgent(expenses, question);
        break;
        
      case 'behavioral-insight':
        result = await processBehavioralInsight(expenses);
        break;
        
      default:
        throw new Error(`Unknown query type: ${query_type}`);
    }
    
    const processingTime = Date.now() - startTime;
    
    return {
      statusCode: 200,
      body: JSON.stringify({
        success: true,
        user_id,
        query_type,
        result,
        processing_time_ms: processingTime,
        timestamp: new Date().toISOString()
      })
    };
    
  } catch (error) {
    console.error('Lambda error:', error);
    
    return {
      statusCode: 500,
      body: JSON.stringify({
        success: false,
        error: error.message,
        timestamp: new Date().toISOString()
      })
    };
  }
};