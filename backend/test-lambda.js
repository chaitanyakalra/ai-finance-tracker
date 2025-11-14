/**
 * Lambda Integration Test Script
 * 
 * This script tests the Lambda integration with your backend
 * Run this file to verify Lambda is working correctly
 * 
 * Usage: node test-lambda.js
 */

import { LambdaClient, InvokeCommand } from "@aws-sdk/client-lambda";
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
dotenv.config({ path: join(__dirname, '.env') });

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  cyan: '\x1b[36m',
  blue: '\x1b[34m'
};

// Test configuration
const config = {
  awsAccessKeyId: process.env.AWS_ACCESS_KEY_ID,
  awsSecretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  awsRegion: process.env.AWS_REGION || 'us-east-1',
  lambdaFunctionName: process.env.LAMBDA_FUNCTION_NAME || 'finance-ai-processor'
};

// Sample test data
const sampleExpenses = [
  { id: '1', date: "2025-10-12", amount: 1200, category: "Food", description: "Groceries" },
  { id: '2', date: "2025-10-11", amount: 500, category: "Transport", description: "Uber" },
  { id: '3', date: "2025-10-10", amount: 3500, category: "Shopping", description: "Clothes" },
  { id: '4', date: "2025-10-09", amount: 2000, category: "Entertainment", description: "Movie night" },
  { id: '5', date: "2025-10-08", amount: 800, category: "Food", description: "Restaurant" }
];

// Helper function to print colored messages
function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function logSection(title) {
  console.log('\n' + '='.repeat(60));
  log(title, 'cyan');
  console.log('='.repeat(60));
}

// Check environment variables
function checkEnvironment() {
  logSection('STEP 1: Checking Environment Variables');
  
  const checks = [
    { name: 'AWS_ACCESS_KEY_ID', value: config.awsAccessKeyId, required: true },
    { name: 'AWS_SECRET_ACCESS_KEY', value: config.awsSecretAccessKey, required: true, mask: true },
    { name: 'AWS_REGION', value: config.awsRegion, required: false },
    { name: 'LAMBDA_FUNCTION_NAME', value: config.lambdaFunctionName, required: true }
  ];
  
  let allPassed = true;
  
  checks.forEach(check => {
    const status = check.value ? '✅' : '❌';
    const value = check.value 
      ? (check.mask ? '***' + check.value.slice(-4) : check.value)
      : 'NOT SET';
    
    console.log(`${status} ${check.name}: ${value}`);
    
    if (check.required && !check.value) {
      allPassed = false;
      log(`   ERROR: ${check.name} is required!`, 'red');
    }
  });
  
  if (!allPassed) {
    log('\n❌ Environment check FAILED. Please configure your .env file.', 'red');
    process.exit(1);
  }
  
  log('\n✅ All environment variables configured!', 'green');
  return true;
}

// Initialize Lambda client
function initializeLambdaClient() {
  logSection('STEP 2: Initializing Lambda Client');
  
  try {
    const lambdaClient = new LambdaClient({
      region: config.awsRegion,
      credentials: {
        accessKeyId: config.awsAccessKeyId,
        secretAccessKey: config.awsSecretAccessKey
      }
    });
    
    log('✅ Lambda client initialized successfully!', 'green');
    log(`   Region: ${config.awsRegion}`, 'cyan');
    log(`   Function: ${config.lambdaFunctionName}`, 'cyan');
    
    return lambdaClient;
  } catch (error) {
    log('❌ Failed to initialize Lambda client', 'red');
    log(`   Error: ${error.message}`, 'red');
    process.exit(1);
  }
}

// Invoke Lambda function
async function invokeLambda(lambdaClient, queryType, payload) {
  const startTime = Date.now();
  
  const command = new InvokeCommand({
    FunctionName: config.lambdaFunctionName,
    InvocationType: 'RequestResponse',
    Payload: JSON.stringify(payload)
  });
  
  try {
    log(`\n📤 Invoking Lambda with query type: ${queryType}`, 'yellow');
    
    const response = await lambdaClient.send(command);
    const duration = Date.now() - startTime;
    
    const result = JSON.parse(new TextDecoder().decode(response.Payload));
    
    log(`✅ Lambda invocation completed in ${duration}ms`, 'green');
    
    // Parse the response body
    if (result.statusCode === 200) {
      const body = JSON.parse(result.body);
      log('   Status: SUCCESS', 'green');
      log(`   Processing Time: ${body.processing_time_ms}ms`, 'cyan');
      log(`   Processed By: ${body.result.processed_by}`, 'cyan');
      return { success: true, data: body, duration };
    } else {
      const errorBody = JSON.parse(result.body);
      log('   Status: FAILED', 'red');
      log(`   Error: ${errorBody.error}`, 'red');
      return { success: false, error: errorBody.error, duration };
    }
  } catch (error) {
    const duration = Date.now() - startTime;
    log(`❌ Lambda invocation failed after ${duration}ms`, 'red');
    log(`   Error: ${error.message}`, 'red');
    return { success: false, error: error.message, duration };
  }
}

// Test 1: Chat Query
async function testChatQuery(lambdaClient) {
  logSection('TEST 1: Chat Query');
  
  const payload = {
    query_type: 'chat',
    question: 'How much did I spend on food this month?',
    user_id: 'test-user',
    expenses: sampleExpenses
  };
  
  const result = await invokeLambda(lambdaClient, 'chat', payload);
  
  if (result.success) {
    log('\n📝 Response Preview:', 'cyan');
    const response = result.data.result.response.substring(0, 200);
    console.log(`   ${response}...`);
  }
  
  return result.success;
}

// Test 2: Multi-Agent Query
async function testMultiAgentQuery(lambdaClient) {
  logSection('TEST 2: Multi-Agent Analysis');
  
  const payload = {
    query_type: 'multi-agent',
    question: 'Should I focus on saving or investing based on my spending?',
    user_id: 'test-user',
    expenses: sampleExpenses
  };
  
  const result = await invokeLambda(lambdaClient, 'multi-agent', payload);
  
  if (result.success) {
    log('\n🤖 Agent Responses:', 'cyan');
    result.data.result.agents.forEach(agent => {
      log(`\n   ${agent.emoji} ${agent.agent}:`, 'yellow');
      const preview = agent.response.substring(0, 150);
      console.log(`   ${preview}...`);
    });
    
    log('\n💡 Summary:', 'cyan');
    const summary = result.data.result.summary.substring(0, 200);
    console.log(`   ${summary}...`);
  }
  
  return result.success;
}

// Test 3: Behavioral Insight
async function testBehavioralInsight(lambdaClient) {
  logSection('TEST 3: Behavioral Insight');
  
  const payload = {
    query_type: 'behavioral-insight',
    user_id: 'test-user',
    expenses: sampleExpenses
  };
  
  const result = await invokeLambda(lambdaClient, 'behavioral-insight', payload);
  
  if (result.success) {
    log('\n🧠 Insight Preview:', 'cyan');
    const insight = result.data.result.insight.substring(0, 300);
    console.log(`   ${insight}...`);
    
    log('\n📊 Statistics:', 'cyan');
    const stats = result.data.result.stats;
    console.log(`   Total Spending: ₹${stats.total.toFixed(2)}`);
    console.log(`   Transactions: ${stats.transaction_count}`);
    console.log(`   Average: ₹${stats.average_transaction.toFixed(2)}`);
    console.log(`   Top Category: ${stats.top_category} (₹${stats.top_amount.toFixed(2)})`);
  }
  
  return result.success;
}

// Test 4: Error Handling
async function testErrorHandling(lambdaClient) {
  logSection('TEST 4: Error Handling');
  
  log('Testing with invalid query type...', 'yellow');
  
  const payload = {
    query_type: 'invalid-type',
    user_id: 'test-user',
    expenses: sampleExpenses
  };
  
  const result = await invokeLambda(lambdaClient, 'invalid-type', payload);
  
  if (!result.success) {
    log('✅ Error handling works correctly!', 'green');
    return true;
  } else {
    log('❌ Error handling test failed - should have returned error', 'red');
    return false;
  }
}

// Test 5: Performance Test
async function testPerformance(lambdaClient) {
  logSection('TEST 5: Performance Test');
  
  log('Running 3 consecutive requests...', 'yellow');
  
  const results = [];
  
  for (let i = 1; i <= 3; i++) {
    log(`\n   Request ${i}/3:`, 'cyan');
    const payload = {
      query_type: 'chat',
      question: `Test request ${i}`,
      user_id: 'test-user',
      expenses: sampleExpenses
    };
    
    const result = await invokeLambda(lambdaClient, 'chat', payload);
    results.push(result);
  }
  
  const successCount = results.filter(r => r.success).length;
  const totalDuration = results.reduce((sum, r) => sum + r.duration, 0);
  const avgDuration = totalDuration / results.length;
  
  log('\n📈 Performance Summary:', 'cyan');
  console.log(`   Successful Requests: ${successCount}/3`);
  console.log(`   Average Duration: ${avgDuration.toFixed(0)}ms`);
  console.log(`   Total Time: ${totalDuration}ms`);
  
  return successCount === 3;
}

// Main test runner
async function runTests() {
  console.clear();
  log('╔════════════════════════════════════════════════════════════╗', 'bright');
  log('║        AWS Lambda Integration Test Suite                  ║', 'bright');
  log('╚════════════════════════════════════════════════════════════╝', 'bright');
  
  const startTime = Date.now();
  
  try {
    // Step 1: Check environment
    checkEnvironment();
    
    // Step 2: Initialize Lambda client
    const lambdaClient = initializeLambdaClient();
    
    // Run tests
    const testResults = {
      chatQuery: await testChatQuery(lambdaClient),
      multiAgent: await testMultiAgentQuery(lambdaClient),
      behavioralInsight: await testBehavioralInsight(lambdaClient),
      errorHandling: await testErrorHandling(lambdaClient),
      performance: await testPerformance(lambdaClient)
    };
    
    // Summary
    logSection('TEST SUMMARY');
    
    const tests = [
      { name: 'Chat Query', passed: testResults.chatQuery },
      { name: 'Multi-Agent Analysis', passed: testResults.multiAgent },
      { name: 'Behavioral Insight', passed: testResults.behavioralInsight },
      { name: 'Error Handling', passed: testResults.errorHandling },
      { name: 'Performance Test', passed: testResults.performance }
    ];
    
    tests.forEach(test => {
      const status = test.passed ? '✅ PASSED' : '❌ FAILED';
      const color = test.passed ? 'green' : 'red';
      log(`${status} - ${test.name}`, color);
    });
    
    const passedCount = Object.values(testResults).filter(r => r).length;
    const totalTests = Object.keys(testResults).length;
    const totalDuration = Date.now() - startTime;
    
    console.log('\n' + '─'.repeat(60));
    log(`Total: ${passedCount}/${totalTests} tests passed`, passedCount === totalTests ? 'green' : 'yellow');
    log(`Total Duration: ${totalDuration}ms`, 'cyan');
    console.log('─'.repeat(60));
    
    if (passedCount === totalTests) {
      log('\n🎉 ALL TESTS PASSED! Lambda integration is working perfectly!', 'green');
      process.exit(0);
    } else {
      log('\n⚠️  Some tests failed. Check the errors above.', 'yellow');
      process.exit(1);
    }
    
  } catch (error) {
    log('\n💥 FATAL ERROR', 'red');
    log(error.message, 'red');
    console.error(error);
    process.exit(1);
  }
}

// Run the tests
runTests();