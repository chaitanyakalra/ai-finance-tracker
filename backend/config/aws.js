import { LambdaClient, InvokeCommand } from "@aws-sdk/client-lambda";

const lambdaClient = new LambdaClient({
  region: process.env.AWS_REGION || 'us-east-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
  }
});

export async function invokeLambda(functionName, payload) {
  console.log(`Invoking Lambda: ${functionName}`);
  const startTime = Date.now();
  
  const command = new InvokeCommand({
    FunctionName: functionName,
    InvocationType: 'RequestResponse',
    Payload: JSON.stringify(payload)
  });

  try {
    const response = await lambdaClient.send(command);
    const duration = Date.now() - startTime;
    console.log(`Lambda invocation completed in ${duration}ms`);
    
    const result = JSON.parse(new TextDecoder().decode(response.Payload));
    
    if (result.statusCode !== 200) {
      const errorBody = JSON.parse(result.body);
      throw new Error(errorBody.error || 'Lambda invocation failed');
    }
    
    return JSON.parse(result.body);
  } catch (error) {
    console.error('Lambda invocation error:', error);
    throw error;
  }
}

export function isLambdaConfigured() {
  return !!(
    process.env.AWS_ACCESS_KEY_ID &&
    process.env.AWS_SECRET_ACCESS_KEY &&
    process.env.LAMBDA_FUNCTION_NAME
  );
}

export function getLambdaFunctionName() {
  return process.env.LAMBDA_FUNCTION_NAME;
}