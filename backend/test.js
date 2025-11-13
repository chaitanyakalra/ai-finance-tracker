import AWS from 'aws-sdk';

const lambda = new AWS.Lambda({ region: 'us-east-1' });

const payload = {
  query_type: "chat",
  question: "How much did I spend on food?",
  user_id: "test-user",
  expenses: [
    { date: "2025-10-12", amount: 1200, category: "Food", description: "Groceries" },
    { date: "2025-10-11", amount: 500, category: "Transport", description: "Uber" }
  ]
};

const response = await lambda.invoke({
  FunctionName: 'finance-ai-processor',
  Payload: JSON.stringify(payload),
}).promise();

console.log(JSON.parse(response.Payload));
