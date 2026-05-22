import {
  DynamoDBDocumentClient,
  ScanCommand,
  GetCommand,
} from "@aws-sdk/lib-dynamodb";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { SNSClient, PublishCommand } from "@aws-sdk/client-sns";

const dynamoDB = DynamoDBDocumentClient.from(
  new DynamoDBClient({ region: process.env.AWS_REGION || "us-east-1" }),
  {
    marshallOptions: { removeUndefinedValues: true },
  },
);

const snsClient = new SNSClient({
  region: process.env.AWS_REGION || "us-east-1",
});

/**
 * Daily Digest Lambda
 * - Triggered by EventBridge daily at 9:00 AM
 * - Scans Tasks table for tasks due today
 * - Sends digest email via SNS
 */
export const handler = async (event) => {
  console.log("Daily Digest Lambda triggered:", JSON.stringify(event, null, 2));

  try {
    // Get today's date range
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const todayString = today.toISOString().split("T")[0];
    const tomorrowString = tomorrow.toISOString().split("T")[0];

    console.log(
      `Scanning for tasks due between ${todayString} and ${tomorrowString}`,
    );

    // Scan Tasks table for tasks due today
    let dueTodayTasks = [];
    let lastEvaluatedKey;

    do {
      const result = await dynamoDB.send(
        new ScanCommand({
          TableName: "Tasks",
          FilterExpression: "deadline BETWEEN :today AND :tomorrow",
          ExpressionAttributeValues: {
            ":today": todayString,
            ":tomorrow": tomorrowString,
          },
          ExclusiveStartKey: lastEvaluatedKey,
        }),
      );

      if (result.Items) {
        dueTodayTasks = dueTodayTasks.concat(result.Items);
      }

      lastEvaluatedKey = result.LastEvaluatedKey;
    } while (lastEvaluatedKey);

    console.log(`Found ${dueTodayTasks.length} tasks due today`);

    if (dueTodayTasks.length === 0) {
      console.log("No tasks due today, skipping digest email");
      return {
        statusCode: 200,
        body: JSON.stringify({ message: "No tasks due today" }),
      };
    }

    // Group tasks by assigneeId
    const tasksByAssignee = {};
    dueTodayTasks.forEach((task) => {
      const assigneeId = task.assigneeId || "unassigned";
      if (!tasksByAssignee[assigneeId]) {
        tasksByAssignee[assigneeId] = [];
      }
      tasksByAssignee[assigneeId].push(task);
    });

    const publishResults = [];

    // For each assignee, create and send personalized digest to that user's dedicated SNS topic
    for (const [assigneeId, tasks] of Object.entries(tasksByAssignee)) {
      try {
        // Skip unassigned tasks (no recipient)
        if (assigneeId === "unassigned") {
          console.log("Skipping unassigned tasks (no recipient)");
          publishResults.push({
            assigneeId: "unassigned",
            taskCount: tasks.length,
            status: "skipped",
            reason: "No assignee",
          });
          continue;
        }

        const userResp = await dynamoDB.send(
          new GetCommand({
            TableName: "Users",
            Key: { userId: assigneeId },
          }),
        );

        const topicArn =
          userResp.Item?.snsTopicArn || userResp.Item?.notificationTopicArn;
        if (!topicArn) {
          console.warn(
            `No SNS topic found for assignee ${assigneeId}; skipping daily digest`,
          );
          publishResults.push({
            assigneeId,
            taskCount: tasks.length,
            status: "skipped",
            reason: "No user topic",
          });
          continue;
        }

        const taskList = tasks
          .map(
            (task) => `- ${task.title} (Priority: ${task.priority || "N/A"})`,
          )
          .join("\n");

        const emailBody = `
Daily Task Digest - ${todayString}

You have ${tasks.length} task(s) due today:

${taskList}

Please log in to Mini Jira to view details and track progress.

--
This is an automated notification from Mini Jira
        `.trim();

        console.log(
          `Publishing digest for assignee ${assigneeId} via ${topicArn}`,
        );

        await snsClient.send(
          new PublishCommand({
            TopicArn: topicArn,
            Subject: `Your Daily Task Digest - ${tasks.length} tasks due today`,
            Message: emailBody,
          }),
        );

        publishResults.push({
          assigneeId,
          taskCount: tasks.length,
          status: "sent",
        });
        console.log(`Digest published for assignee ${assigneeId}`);
      } catch (err) {
        console.error(
          `Failed to publish digest for assignee ${assigneeId}: ${err.message}`,
        );
        publishResults.push({
          assigneeId,
          status: "failed",
          error: err.message,
        });
      }
    }

    console.log("Daily digests published to SNS successfully");

    return {
      statusCode: 200,
      body: JSON.stringify({
        message: "Daily digests published (filtered by assigneeId)",
        totalTasks: dueTodayTasks.length,
        results: publishResults,
      }),
    };
  } catch (error) {
    console.error("Daily digest handler error:", error.message);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message }),
    };
  }
};
