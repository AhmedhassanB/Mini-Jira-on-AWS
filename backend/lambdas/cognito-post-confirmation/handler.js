import { SNSClient, SubscribeCommand } from "@aws-sdk/client-sns";
import { DynamoDBDocumentClient, UpdateCommand } from "@aws-sdk/lib-dynamodb";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";

const snsClient = new SNSClient({ region: process.env.AWS_REGION || "us-east-1" });
const dynamoDB = DynamoDBDocumentClient.from(new DynamoDBClient({ region: process.env.AWS_REGION || "us-east-1" }), {
  marshallOptions: { removeUndefinedValues: true },
});

/**
 * Cognito Post-Confirmation Lambda
 * - Triggered after user confirms email in Cognito
 * - Auto-subscribes email to SNS task-assignments topic
 * - Updates Users table to mark email as verified
 */
export const handler = async (event) => {
  console.log("Post-confirmation event:", JSON.stringify(event, null, 2));

  try {
    // Extract user info from Cognito event
    const userId = event.request.userAttributes.sub;
    const email = event.request.userAttributes.email;
    const username = event.request.userAttributes.preferred_username || event.userName;

    if (!email) {
      console.warn("No email found in Cognito user attributes");
      return event;
    }

    console.log(`User confirmed: userId=${userId}, email=${email}, username=${username}`);

    // Auto-subscribe email to SNS task-assignments topic
    console.log(`Subscribing email to SNS task-assignments topic: ${email}`);
    try {
      const taskAssignmentsArn = process.env.SNS_TASK_ASSIGNMENTS_TOPIC_ARN;
      if (!taskAssignmentsArn) {
        console.warn("SNS_TASK_ASSIGNMENTS_TOPIC_ARN not configured");
      } else {
        await snsClient.send(
          new SubscribeCommand({
            TopicArn: taskAssignmentsArn,
            Protocol: "email",
            Endpoint: email,
          }),
        );
        console.log(`Email ${email} subscribed to task-assignments topic`);
      }
    } catch (snsErr) {
      console.error(`Failed to subscribe to task-assignments: ${snsErr.message}`);
      // Continue anyway
    }

    // Auto-subscribe email to SNS daily-digest topic
    console.log(`Subscribing email to SNS daily-digest topic: ${email}`);
    try {
      const dailyDigestArn = process.env.SNS_DAILY_DIGEST_TOPIC_ARN;
      if (!dailyDigestArn) {
        console.warn("SNS_DAILY_DIGEST_TOPIC_ARN not configured");
      } else {
        await snsClient.send(
          new SubscribeCommand({
            TopicArn: dailyDigestArn,
            Protocol: "email",
            Endpoint: email,
          }),
        );
        console.log(`Email ${email} subscribed to daily-digest topic`);
      }
    } catch (snsErr) {
      console.error(`Failed to subscribe to daily-digest: ${snsErr.message}`);
      // Continue anyway
    }

    // Update Users table to mark email as verified
    try {
      await dynamoDB.send(
        new UpdateCommand({
          TableName: "Users",
          Key: { userId },
          UpdateExpression: "SET #email = :email, #emailVerified = :verified, #updatedAt = :ts",
          ExpressionAttributeNames: {
            "#email": "email",
            "#emailVerified": "emailVerified",
            "#updatedAt": "updatedAt",
          },
          ExpressionAttributeValues: {
            ":email": email,
            ":verified": true,
            ":ts": new Date().toISOString(),
          },
        }),
      );
      console.log(`Updated Users table: userId=${userId}, email=${email}, emailVerified=true`);
    } catch (dbErr) {
      console.error(`Failed to update Users table: ${dbErr.message}`);
      // Continue anyway; user is confirmed in Cognito
    }

    console.log("Post-confirmation processing completed successfully");
    return event;
  } catch (error) {
    console.error(`Post-confirmation handler error: ${error.message}`);
    throw error;
  }
};
