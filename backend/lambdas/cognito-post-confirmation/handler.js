import {
  SNSClient,
  CreateTopicCommand,
  SubscribeCommand,
} from "@aws-sdk/client-sns";
import { DynamoDBDocumentClient, UpdateCommand } from "@aws-sdk/lib-dynamodb";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";

const snsClient = new SNSClient({
  region: process.env.AWS_REGION || "us-east-1",
});
const dynamoDB = DynamoDBDocumentClient.from(
  new DynamoDBClient({ region: process.env.AWS_REGION || "us-east-1" }),
  {
    marshallOptions: { removeUndefinedValues: true },
  },
);

/**
 * Cognito Post-Confirmation Lambda
 * - Triggered after user confirms email in Cognito
 * - Creates a dedicated SNS topic per user
 * - Auto-subscribes email to that topic
 * - Stores the user's topic ARN in DynamoDB for targeted notifications
 * - Updates Users table to mark email as verified
 */
export const handler = async (event) => {
  console.log("Post-confirmation event:", JSON.stringify(event, null, 2));

  try {
    // Extract user info from Cognito event
    const userId = event.request.userAttributes.sub;
    const email = event.request.userAttributes.email;
    const username =
      event.request.userAttributes.preferred_username || event.userName;

    if (!email) {
      console.warn("No email found in Cognito user attributes");
      return event;
    }

    console.log(
      `User confirmed: userId=${userId}, email=${email}, username=${username}`,
    );

    // Create/get a dedicated SNS topic for this user
    const userTopicName = `mini-jira-user-${userId}`;
    let userTopicArn = null;

    try {
      const createTopicResp = await snsClient.send(
        new CreateTopicCommand({
          Name: userTopicName,
          Attributes: {
            DisplayName: `Mini Jira ${username || "User"}`,
          },
        }),
      );
      userTopicArn = createTopicResp.TopicArn;
      console.log(`Created/loaded user SNS topic: ${userTopicArn}`);

      const subscribeResp = await snsClient.send(
        new SubscribeCommand({
          TopicArn: userTopicArn,
          Protocol: "email",
          Endpoint: email,
        }),
      );
      console.log(
        `Email ${email} subscribed to user topic (arn: ${subscribeResp.SubscriptionArn})`,
      );
    } catch (snsErr) {
      console.error(
        `Failed to create/subscribe user SNS topic: ${snsErr.message}`,
      );
      // Continue anyway
    }

    try {
      // Save the topic ARN on the user record so publishers can target this user directly
      if (userTopicArn) {
        await dynamoDB.send(
          new UpdateCommand({
            TableName: "Users",
            Key: { userId },
            UpdateExpression:
              "SET #email = :email, #emailVerified = :verified, #snsTopicArn = :snsTopicArn, #updatedAt = :ts",
            ExpressionAttributeNames: {
              "#email": "email",
              "#emailVerified": "emailVerified",
              "#snsTopicArn": "snsTopicArn",
              "#updatedAt": "updatedAt",
            },
            ExpressionAttributeValues: {
              ":email": email,
              ":verified": true,
              ":snsTopicArn": userTopicArn,
              ":ts": new Date().toISOString(),
            },
          }),
        );
      }
      console.log(
        `Updated Users table: userId=${userId}, email=${email}, snsTopicArn=${userTopicArn || "n/a"}`,
      );
    } catch (snsErr) {
      console.error(`Failed to subscribe user SNS topic: ${snsErr.message}`);
      // Continue anyway
    }

    console.log("Post-confirmation processing completed successfully");
    return event;
  } catch (error) {
    console.error(`Post-confirmation handler error: ${error.message}`);
    throw error;
  }
};
