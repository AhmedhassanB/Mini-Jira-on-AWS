import { DynamoDBDocumentClient, ScanCommand } from "@aws-sdk/lib-dynamodb";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { SNSClient, PublishCommand } from "@aws-sdk/client-sns";

const dynamoDB = DynamoDBDocumentClient.from(new DynamoDBClient({ region: process.env.AWS_REGION || "us-east-1" }), {
  marshallOptions: { removeUndefinedValues: true },
});

const snsClient = new SNSClient({ region: process.env.AWS_REGION || "us-east-1" });

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

    console.log(`Scanning for tasks due between ${todayString} and ${tomorrowString}`);

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

    // Publish digest to SNS
    const topicArn = process.env.SNS_DAILY_DIGEST_TOPIC_ARN;
    if (!topicArn) {
      console.error("SNS_DAILY_DIGEST_TOPIC_ARN not configured");
      return { statusCode: 500, body: JSON.stringify({ error: "SNS topic not configured" }) };
    }

    const publishResults = [];

    // For each assignee, create and send personalized digest
    for (const [assigneeId, tasks] of Object.entries(tasksByAssignee)) {
      try {
        const taskList = tasks
          .map((task) => `- ${task.title} (Priority: ${task.priority || "N/A"})`)
          .join("\n");

        const emailBody = `
Daily Task Digest - ${todayString}

You have ${tasks.length} task(s) due today:

${taskList}

Please log in to Mini Jira to view details and track progress.

--
This is an automated notification from Mini Jira
        `.trim();

        console.log(`Publishing personalized digest for assignee ${assigneeId}`);

        await snsClient.send(
          new PublishCommand({
            TopicArn: topicArn,
            Subject: `Your Daily Task Digest - ${tasks.length} tasks due today`,
            Message: emailBody,
            MessageAttributes: {
              assigneeId: {
                DataType: "String",
                StringValue: assigneeId,
              },
            },
          }),
        );

        publishResults.push({ assigneeId, taskCount: tasks.length, status: "sent" });
        console.log(`Digest sent for assignee ${assigneeId}`);
      } catch (err) {
        console.error(`Failed to send digest for assignee ${assigneeId}: ${err.message}`);
        publishResults.push({ assigneeId, status: "failed", error: err.message });
      }
    }

    console.log("Daily digest published successfully");

    return {
      statusCode: 200,
      body: JSON.stringify({
        message: "Daily digests sent",
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
