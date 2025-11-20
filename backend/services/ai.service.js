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
  const currency = v => `₹${Number(v || 0).toFixed(2)}`;
  let summary = `Total transactions: ${expenses.length}\n`;
  const byCategory = {};
  expenses.forEach(exp => {
    const cat = exp.category;
    byCategory[cat] = (byCategory[cat] || 0) + Number(exp.amount);
  });
  const totalAll = Object.values(byCategory).reduce((s, a) => s + a, 0);
  const topOverall = Object.entries(byCategory).sort((a,b)=>b[1]-a[1]).slice(0,3);
  summary += `Total spending (all time): ${currency(totalAll)}\n`;
  summary += "\nTop categories (all time):\n";
  topOverall.forEach(([cat, amt]) => {
    summary += `- ${cat}: ${currency(amt)}\n`;
  });
  const now = new Date();
  const monthKey = `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}`;
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const monthExpenses = expenses.filter(exp => {
    const d = new Date(exp.date);
    return d >= monthStart && d <= now;
  });
  const byCategoryMonth = {};
  monthExpenses.forEach(exp => {
    const cat = exp.category;
    byCategoryMonth[cat] = (byCategoryMonth[cat] || 0) + Number(exp.amount);
  });
  const totalMonth = Object.values(byCategoryMonth).reduce((s,a)=>s+a,0);
  const topMonth = Object.entries(byCategoryMonth).sort((a,b)=>b[1]-a[1]).slice(0,3);
  const daysElapsed = Math.max(1, Math.ceil((now - monthStart) / 86400000));
  const avgDailyMonth = totalMonth / daysElapsed;
  summary += `\nCurrent month (${monthKey}) spending: ${currency(totalMonth)}\n`;
  summary += `Average daily spending this month: ${currency(avgDailyMonth)}\n`;
  if (topMonth.length) {
    summary += "\nTop categories this month:\n";
    topMonth.forEach(([cat, amt]) => {
      summary += `- ${cat}: ${currency(amt)}\n`;
    });
  }
  summary += "\nSpending by category (all time):\n";
  Object.entries(byCategory).forEach(([cat, amt]) => {
    summary += `- ${cat}: ${currency(amt)}\n`;
  });
  if (expenses.length) {
    summary += "\nRecent transactions:\n";
    expenses.slice(-5).forEach(exp => {
      summary += `- ${exp.date}: ${exp.category} - ${currency(exp.amount)} (${exp.description})\n`;
    });
  }
  return summary;
}

// Fallback function using Gemini directly
async function handleChatQueryDirect(question, expenses) {
  const expenseSummary = prepareExpenseSummary(expenses);
  const stats = (() => {
    const currency = v => `₹${Number(v || 0).toFixed(2)}`;
    const byCategory = {};
    expenses.forEach(e=>{byCategory[e.category]=(byCategory[e.category]||0)+Number(e.amount)});
    const totalAll = Object.values(byCategory).reduce((s,a)=>s+a,0);
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const monthExpenses = expenses.filter(exp => {
      const d = new Date(exp.date);
      return d >= monthStart && d <= now;
    });
    const byCategoryMonth = {};
    monthExpenses.forEach(e=>{byCategoryMonth[e.category]=(byCategoryMonth[e.category]||0)+Number(e.amount)});
    const totalMonth = Object.values(byCategoryMonth).reduce((s,a)=>s+a,0);
    const daysElapsed = Math.max(1, Math.ceil((now - monthStart) / 86400000));
    const avgDailyMonth = totalMonth / daysElapsed;
    const topOverall = Object.entries(byCategory).sort((a,b)=>b[1]-a[1]);
    const topMonth = Object.entries(byCategoryMonth).sort((a,b)=>b[1]-a[1]);
    return {
      totals: { all_time: totalAll, this_month: totalMonth },
      average_daily: { this_month: avgDailyMonth },
      top_categories: {
        all_time: topOverall.slice(0,3).map(([c,a])=>({ category:c, amount:a })),
        this_month: topMonth.slice(0,3).map(([c,a])=>({ category:c, amount:a }))
      },
      by_category_all_time: byCategory,
      by_category_this_month: byCategoryMonth,
      formatted: {
        total_all_time: currency(totalAll),
        total_this_month: currency(totalMonth),
        avg_daily_this_month: currency(avgDailyMonth)
      }
    };
  })();

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
    stats,
    processed_by: 'Direct-Gemini'
  };
}

export async function handleChatQuery(question, userId = 'default') {
  const expenses = await getAllExpenses(userId);

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

  const expenseSummary = prepareExpenseSummary(expenses);
  const stats = (() => {
    const currency = v => `₹${Number(v || 0).toFixed(2)}`;
    const byCategory = {};
    expenses.forEach(e=>{byCategory[e.category]=(byCategory[e.category]||0)+Number(e.amount)});
    const totalAll = Object.values(byCategory).reduce((s,a)=>s+a,0);
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const monthExpenses = expenses.filter(exp => {
      const d = new Date(exp.date);
      return d >= monthStart && d <= now;
    });
    const byCategoryMonth = {};
    monthExpenses.forEach(e=>{byCategoryMonth[e.category]=(byCategoryMonth[e.category]||0)+Number(e.amount)});
    const totalMonth = Object.values(byCategoryMonth).reduce((s,a)=>s+a,0);
    const daysElapsed = Math.max(1, Math.ceil((now - monthStart) / 86400000));
    const avgDailyMonth = totalMonth / daysElapsed;
    const topOverall = Object.entries(byCategory).sort((a,b)=>b[1]-a[1]);
    const topMonth = Object.entries(byCategoryMonth).sort((a,b)=>b[1]-a[1]);
    return {
      totals: { all_time: totalAll, this_month: totalMonth },
      average_daily: { this_month: avgDailyMonth },
      top_categories: {
        all_time: topOverall.slice(0,3).map(([c,a])=>({ category:c, amount:a })),
        this_month: topMonth.slice(0,3).map(([c,a])=>({ category:c, amount:a }))
      },
      by_category_all_time: byCategory,
      by_category_this_month: byCategoryMonth,
      formatted: {
        total_all_time: currency(totalAll),
        total_this_month: currency(totalMonth),
        avg_daily_this_month: currency(avgDailyMonth)
      }
    };
  })();

  const model = getGeminiModel();
  const responses = [];

  for (const agent of agents) {
    const prompt = `
You are the ${agent.name}, a specialist in ${agent.role}.

Financial context:
${expenseSummary}

User Question: ${question}

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
Ground the recommendation in the financial context above.
`;

  const summaryResult = await model.generateContent(summaryPrompt);
  const summaryResponse = await summaryResult.response;
  const summaryText = summaryResponse.text();

  return {
    agents: responses,
    summary: summaryText,
    context: expenseSummary,
    stats,
    processed_by: 'Direct-Gemini'
  };
}

export async function handleMultiAgentQuery(question, userId = 'default') {
  const expenses = await getAllExpenses(userId);

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
  const expenses = await getAllExpenses(userId);

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