import { SESClient, VerifyEmailIdentityCommand, SendEmailCommand } from "@aws-sdk/client-ses";
import { DynamoDBClient, GetCommand } from "@aws-sdk/client-dynamodb";
import { unmarshall } from "@aws-sdk/util-dynamodb";

const sesClient = new SESClient({ region: process.env.AWS_REGION || "us-east-1" });
const dynamodbClient = new DynamoDBClient({ region: process.env.AWS_REGION || "us-east-1" });

export const handler = async (event) => {
  console.log("Email Notifier Lambda triggered:", JSON.stringify(event, null, 2));

  const results = [];

  for (const record of event.Records) {
    try {
      // Parse SNS message
      const snsMessage = JSON.parse(record.Sns.Message);
      const { taskId, assigneeId, title, timestamp } = snsMessage;

      console.log(`Processing email notification for task ${taskId}, assignee ${assigneeId}`);

      // Fetch assignee details from DynamoDB Users table
      const userResponse = await dynamodbClient.send(
        new GetCommand({
          TableName: "Users",
          Key: { userId: { S: assigneeId } },
        }),
      );

      if (!userResponse.Item) {
        console.warn(`User not found: ${assigneeId}`);
        results.push({
          taskId,
          assigneeId,
          status: "failed",
          message: "User not found in database",
        });
        continue;
      }

      const user = unmarshall(userResponse.Item);
      const assigneeEmail = user.email;

      if (!assigneeEmail) {
        console.warn(`User has no email: ${assigneeId}`);
        results.push({
          taskId,
          assigneeId,
          status: "failed",
          message: "User has no email address",
        });
        continue;
      }

      // Auto-verify the recipient email in SES
      console.log(`Auto-verifying email in SES: ${assigneeEmail}`);
      try {
        await sesClient.send(
          new VerifyEmailIdentityCommand({
            EmailAddress: assigneeEmail,
          }),
        );
        console.log(`Email ${assigneeEmail} verification initiated in SES`);
      } catch (verifyErr) {
        console.warn(`Failed to verify email in SES: ${verifyErr.message}`);
        // Continue anyway; email may already be verified
      }

      // Send email via SES
      const senderEmail = process.env.SES_SENDER_EMAIL || "noreply@mini-jira.com";
      const emailParams = {
        Source: senderEmail,
        Destination: {
          ToAddresses: [assigneeEmail],
        },
        Message: {
          Subject: {
            Data: `Task Assigned: ${title}`,
            Charset: "UTF-8",
          },
          Body: {
            Html: {
              Data: `
                <h2>Task Assignment Notification</h2>
                <p>You have been assigned a new task:</p>
                <ul>
                  <li><strong>Task:</strong> ${title}</li>
                  <li><strong>Task ID:</strong> ${taskId}</li>
                  <li><strong>Assigned at:</strong> ${timestamp}</li>
                </ul>
                <p>Please log in to Mini Jira to view task details.</p>
              `,
              Charset: "UTF-8",
            },
          },
        },
      };

      await sesClient.send(new SendEmailCommand(emailParams));
      console.log(`Email sent successfully to ${assigneeEmail}`);

      results.push({
        taskId,
        assigneeId,
        assigneeEmail,
        status: "success",
        message: "Email sent successfully",
      });
    } catch (error) {
      console.error(`Error processing SNS record: ${error.message}`);
      results.push({
        status: "error",
        message: error.message,
      });
    }
  }

  console.log("Email notifier results:", JSON.stringify(results, null, 2));
  return { statusCode: 200, body: JSON.stringify(results) };
};
