import { DynamoDBDocumentClient, GetCommand } from "@aws-sdk/lib-dynamodb";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { CloudWatchClient, PutMetricDataCommand } from "@aws-sdk/client-cloudwatch";

const dynamoDB = DynamoDBDocumentClient.from(new DynamoDBClient({ region: process.env.AWS_REGION || "us-east-1" }), {
  marshallOptions: { removeUndefinedValues: true },
});

const cloudwatch = new CloudWatchClient({ region: process.env.AWS_REGION || "us-east-1" });

/**
 * Lambda handler: Assignment Worker
 * - Drains SQS queue receiving task assignment events
 * - Writes activity logs to CloudWatch Logs
 * - Publishes CloudWatch custom metrics
 * (Email notifications are sent by email-notifier Lambda via SNS)
 */
export const handler = async (event) => {
  console.log("Assignment Worker Lambda triggered:", JSON.stringify(event, null, 2));

  try {
    const results = [];

    // Drain SQS queue
    for (const record of event.Records) {
      try {
        // Parse SNS message wrapped in SQS
        const snsMessage = JSON.parse(record.body);
        let message;

        if (snsMessage.Message) {
          message = JSON.parse(snsMessage.Message);
        } else {
          message = snsMessage;
        }

        const { taskId, assigneeId, title, timestamp } = message;

        console.log(`Processing assignment: taskId=${taskId}, assigneeId=${assigneeId}`);

        // Fetch task and assignee data
        let task, assignee;
        try {
          const taskResp = await dynamoDB.send(new GetCommand({
            TableName: "Tasks",
            Key: { taskId },
          }));
          task = taskResp.Item;

          const userResp = await dynamoDB.send(new GetCommand({
            TableName: "Users",
            Key: { userId: assigneeId },
          }));
          assignee = userResp.Item;
        } catch (err) {
          console.error(`Failed to fetch data: ${err.message}`);
          results.push({ taskId, status: "failed", reason: err.message });
          continue;
        }

        // Write activity log to CloudWatch Logs
        const auditLog = {
          timestamp: new Date().toISOString(),
          eventType: "TASK_ASSIGNMENT",
          taskId,
          taskTitle: task?.title || "Unknown",
          assigneeId,
          assigneeName: assignee?.username || "Unknown",
          assigneeEmail: assignee?.email || "Unknown",
          teamId: task?.teamId || "Unknown",
          status: "success",
        };

        console.log(`AUDIT_LOG: ${JSON.stringify(auditLog)}`);

        // Publish CloudWatch metric
        try {
          await cloudwatch.send(
            new PutMetricDataCommand({
              Namespace: "MiniJira",
              MetricData: [
                {
                  MetricName: "TaskAssignments",
                  Value: 1,
                  Unit: "Count",
                  Timestamp: new Date(),
                  Dimensions: [
                    { Name: "TeamId", Value: task?.teamId || "Unknown" },
                    { Name: "Action", Value: "Assigned" },
                  ],
                },
              ],
            }),
          );
          console.log("CloudWatch metric published");
        } catch (err) {
          console.error(`Failed to publish metric: ${err.message}`);
        }

        results.push({
          taskId,
          assigneeId,
          status: "success",
          message: `Assignment logged and metrics published`,
        });
      } catch (err) {
        console.error(`Failed to process record: ${err.message}`);
        results.push({ status: "error", reason: err.message });
      }
    }

    console.log("Queue drained:", JSON.stringify(results, null, 2));
    return {
      statusCode: 200,
      body: JSON.stringify({ message: "Queue processed", results }),
    };
  } catch (err) {
    console.error("Handler error:", err);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: err.message }),
    };
  }
};
