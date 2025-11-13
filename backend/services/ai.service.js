// import { getGeminiModel } from '../config/gemini.js';
// import { getAllExpenses } from './expense.service.js';

// function prepareExpenseSummary(expenses) {
//   let summary = `Total expenses: ${expenses.length}\n`;
  
//   const byCategory = {};
//   expenses.forEach(exp => {
//     const cat = exp.category;
//     byCategory[cat] = (byCategory[cat] || 0) + exp.amount;
//   });
  
//   summary += "\nSpending by category:\n";
//   Object.entries(byCategory).forEach(([cat, amt]) => {
//     summary += `- ${cat}: ₹${amt.toFixed(2)}\n`;
//   });
  
//   summary += "\nRecent transactions:\n";
//   expenses.slice(-5).forEach(exp => {
//     summary += `- ${exp.date}: ${exp.category} - ₹${exp.amount} (${exp.description})\n`;
//   });
  
//   return summary;
// }

// export async function handleChatQuery(question) {
//   const expenses = await getAllExpenses();
//   const expenseSummary = prepareExpenseSummary(expenses);
  
//   const model = getGeminiModel();
//   const prompt = `
// You are a personal finance assistant. Based on the following expense data, answer the user's question.

// ${expenseSummary}

// User Question: ${question}

// Provide a helpful, concise response with specific insights and recommendations.
// `;
  
//   const result = await model.generateContent(prompt);
//   const response = await result.response;
//   const text = response.text();
  
//   return {
//     response: text,
//     context: expenseSummary
//   };
// }

// export async function handleMultiAgentQuery(question) {
//   const agents = [
//     {
//       name: "Budget Analyst",
//       role: "Analyzes spending patterns and budget implications",
//       emoji: "📊"
//     },
//     {
//       name: "Investment Advisor",
//       role: "Provides investment and financial planning advice",
//       emoji: "💰"
//     },
//     {
//       name: "Risk Assessor",
//       role: "Evaluates financial risks and provides warnings",
//       emoji: "🛡️"
//     }
//   ];
  
//   const expenses = await getAllExpenses();
//   const totalExpenses = expenses.reduce((sum, exp) => sum + exp.amount, 0);
//   const contextInfo = `Current monthly spending: ₹${totalExpenses.toFixed(2)}`;
  
//   const model = getGeminiModel();
//   const responses = [];
  
//   for (const agent of agents) {
//     const prompt = `
// You are the ${agent.name}, a specialist in ${agent.role}.

// User's financial context: ${contextInfo}

// User's question: ${question}

// Provide your expert analysis from your specialized perspective. Be concise (3-4 sentences max).
// Focus on your area of expertise.
// `;
    
//     const result = await model.generateContent(prompt);
//     const response = await result.response;
//     const text = response.text();
    
//     responses.push({
//       agent: agent.name,
//       emoji: agent.emoji,
//       response: text
//     });
//   }
  
//   const summaryPrompt = `
// Based on these expert opinions:

// ${responses.map(r => `${r.agent}: ${r.response}`).join('\n')}

// Provide a brief final recommendation (2-3 sentences) for the user's question: ${question}
// `;
  
//   const summaryResult = await model.generateContent(summaryPrompt);
//   const summaryResponse = await summaryResult.response;
//   const summaryText = summaryResponse.text();
  
//   return {
//     agents: responses,
//     summary: summaryText
//   };
// }

// export async function generateBehavioralInsight() {
//   const expenses = await getAllExpenses();
  
//   if (expenses.length === 0) {
//     return { insight: "No data available yet", stats: {} };
//   }
  
//   const byCategory = {};
//   expenses.forEach(exp => {
//     const cat = exp.category;
//     byCategory[cat] = (byCategory[cat] || 0) + exp.amount;
//   });
  
//   const total = Object.values(byCategory).reduce((sum, amt) => sum + amt, 0);
//   const topCategory = Object.entries(byCategory)
//     .sort((a, b) => b[1] - a[1])[0];
  
//   const model = getGeminiModel();
//   const prompt = `
// Analyze this spending pattern and provide ONE key behavioral finance insight:

// Total spending: ₹${total.toFixed(2)}
// Spending by category: ${JSON.stringify(byCategory, null, 2)}

// Provide:
// 1. A short insight title (max 10 words)
// 2. A brief explanation (2-3 sentences)
// 3. One actionable recommendation

// Format your response as:
// INSIGHT: [title]
// EXPLANATION: [explanation]
// RECOMMENDATION: [recommendation]
// `;
  
//   const result = await model.generateContent(prompt);
//   const response = await result.response;
//   const insightText = response.text();
  
//   return {
//     insight: insightText,
//     stats: {
//       total,
//       top_category: topCategory[0],
//       top_amount: topCategory[1],
//       by_category: byCategory
//     }
//   };
// }


import { getGeminiModel } from '../config/gemini.js';
import { getAllExpenses } from './expense.service.js';
import { invokeLambda, isLambdaConfigured, getLambdaFunctionName } from '../config/aws.js';

const USE_LAMBDA = process.env.USE_LAMBDA === 'true';

function prepareExpenseSummary(expenses) {
  let summary = `Total expenses: ${expenses.length}\n`;
  
  const byCategory = {};
  expenses.forEach(exp => {
    const cat = exp.category;
    byCategory[cat] = (byCategory[cat] || 0) + exp.amount;
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

// Fallback function using Gemini directly
async function handleChatQueryDirect(question, expenses) {
  const expenseSummary = prepareExpenseSummary(expenses);
  
  const model = getGeminiModel();
  const prompt = `
You are a personal finance assistant. Based on the following expense data, answer the user's question.

${expenseSummary}

User Question: ${question}

Provide a helpful, concise response with specific insights and recommendations.
`;
  
  const result = await model.generateContent(prompt);
  const response = await result.response;
  const text = response.text();
  
  return {
    response: text,
    context: expenseSummary,
    processed_by: 'Direct-Gemini'
  };
}

export async function handleChatQuery(question, userId = 'default') {
  const expenses = await getAllExpenses();
  
  // Try Lambda first if configured
  if (USE_LAMBDA && isLambdaConfigured()) {
    try {
      console.log('Using Lambda for chat query');
      const lambdaResponse = await invokeLambda(getLambdaFunctionName(), {
        query_type: 'chat',
        expenses,
        question,
        user_id: userId
      });
      
      return {
        ...lambdaResponse.result,
        source: 'lambda',
        processing_time_ms: lambdaResponse.processing_time_ms
      };

      console.log("Lambda Response:", lambdaResponse);
    } catch (error) {
      console.error('Lambda failed, falling back to direct call:', error);
      // Fallback to direct call
    }
  }
  
  // Direct call fallback
  const result = await handleChatQueryDirect(question, expenses);
  return {
    ...result,
    source: 'direct'
  };
}

async function handleMultiAgentQueryDirect(question, expenses) {
  const agents = [
    {
      name: "Budget Analyst",
      role: "Analyzes spending patterns and budget implications",
      emoji: "📊"
    },
    {
      name: "Investment Advisor",
      role: "Provides investment and financial planning advice",
      emoji: "💰"
    },
    {
      name: "Risk Assessor",
      role: "Evaluates financial risks and provides warnings",
      emoji: "🛡️"
    }
  ];
  
  const totalExpenses = expenses.reduce((sum, exp) => sum + exp.amount, 0);
  const contextInfo = `Current monthly spending: ₹${totalExpenses.toFixed(2)}`;
  
  const model = getGeminiModel();
  const responses = [];
  
  for (const agent of agents) {
    const prompt = `
You are the ${agent.name}, a specialist in ${agent.role}.

User's financial context: ${contextInfo}

User's question: ${question}

Provide your expert analysis from your specialized perspective. Be concise (3-4 sentences max).
Focus on your area of expertise.
`;
    
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    
    responses.push({
      agent: agent.name,
      emoji: agent.emoji,
      response: text
    });
  }
  
  const summaryPrompt = `
Based on these expert opinions:

${responses.map(r => `${r.agent}: ${r.response}`).join('\n')}

Provide a brief final recommendation (2-3 sentences) for the user's question: ${question}
`;
  
  const summaryResult = await model.generateContent(summaryPrompt);
  const summaryResponse = await summaryResult.response;
  const summaryText = summaryResponse.text();
  
  return {
    agents: responses,
    summary: summaryText,
    processed_by: 'Direct-Gemini'
  };
}

export async function handleMultiAgentQuery(question, userId = 'default') {
  const expenses = await getAllExpenses();
  
  if (USE_LAMBDA && isLambdaConfigured()) {
    try {
      console.log('Using Lambda for multi-agent query');
      const lambdaResponse = await invokeLambda(getLambdaFunctionName(), {
        query_type: 'multi-agent',
        expenses,
        question,
        user_id: userId
      });
      
      return {
        ...lambdaResponse.result,
        source: 'lambda',
        processing_time_ms: lambdaResponse.processing_time_ms
      };
    } catch (error) {
      console.error('Lambda failed, falling back to direct call:', error);
    }
  }
  
  const result = await handleMultiAgentQueryDirect(question, expenses);
  return {
    ...result,
    source: 'direct'
  };
}

async function generateBehavioralInsightDirect(expenses) {
  if (expenses.length === 0) {
    return { insight: "No data available yet", stats: {} };
  }
  
  const byCategory = {};
  expenses.forEach(exp => {
    const cat = exp.category;
    byCategory[cat] = (byCategory[cat] || 0) + exp.amount;
  });
  
  const total = Object.values(byCategory).reduce((sum, amt) => sum + amt, 0);
  const topCategory = Object.entries(byCategory)
    .sort((a, b) => b[1] - a[1])[0];
  
  const model = getGeminiModel();
  const prompt = `
Analyze this spending pattern and provide ONE key behavioral finance insight:

Total spending: ₹${total.toFixed(2)}
Spending by category: ${JSON.stringify(byCategory, null, 2)}

Provide:
1. A short insight title (max 10 words)
2. A brief explanation (2-3 sentences)
3. One actionable recommendation

Format your response as:
INSIGHT: [title]
EXPLANATION: [explanation]
RECOMMENDATION: [recommendation]
`;
  
  const result = await model.generateContent(prompt);
  const response = await result.response;
  const insightText = response.text();
  
  return {
    insight: insightText,
    stats: {
      total,
      top_category: topCategory[0],
      top_amount: topCategory[1],
      by_category: byCategory
    },
    processed_by: 'Direct-Gemini'
  };
}

export async function generateBehavioralInsight(userId = 'default') {
  const expenses = await getAllExpenses();
  
  if (USE_LAMBDA && isLambdaConfigured()) {
    try {
      console.log('Using Lambda for behavioral insight');
      const lambdaResponse = await invokeLambda(getLambdaFunctionName(), {
        query_type: 'behavioral-insight',
        expenses,
        user_id: userId
      });
      
      return {
        ...lambdaResponse.result,
        source: 'lambda',
        processing_time_ms: lambdaResponse.processing_time_ms
      };
    } catch (error) {
      console.error('Lambda failed, falling back to direct call:', error);
    }
  }
  
  const result = await generateBehavioralInsightDirect(expenses);
  return {
    ...result,
    source: 'direct'
  };
}