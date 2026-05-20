/*
 Lambda handler: S3 ObjectCreated -> Update DynamoDB Tasks item

 Expects S3 object key: tasks/{taskId}/{filename}
 Environment variables required:
 - TABLE_NAME (e.g. Tasks)
 - AWS_REGION (optional, default us-east-1)

 Deployment: zip this directory and create a Lambda (nodejs18.x) with a role
 that allows DynamoDB UpdateItem on the Tasks table and Lambda invoke by S3.
 See README in this folder for full deployment and IAM snippets.
*/

import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, UpdateCommand } from "@aws-sdk/lib-dynamodb";

const REGION = process.env.AWS_REGION || "us-east-1";
const TABLE_NAME = process.env.TABLE_NAME || process.env.TASKS_TABLE || "Tasks";

const ddbClient = new DynamoDBClient({ region: REGION });
const ddb = DynamoDBDocumentClient.from(ddbClient);

function sleep(ms) {
  return new Promise((res) => setTimeout(res, ms));
}

export const handler = async (event) => {
  console.log("Event received", JSON.stringify(event, null, 2));

  for (const rec of event.Records || []) {
    try {
      if (!rec.s3 || !rec.s3.bucket || !rec.s3.object) continue;

      const bucket = rec.s3.bucket.name;
      const key = decodeURIComponent(rec.s3.object.key.replace(/\+/g, " "));

      // Expect key like tasks/{taskId}/{filename}
      const m = key.match(/^tasks\/([^/]+)\/.+$/);
      if (!m) {
        console.warn("S3 key doesn't match expected pattern, skipping:", key);
        continue;
      }

      const taskId = m[1];
      const imageUrl = `https://${bucket}.s3.${REGION}.amazonaws.com/${key}`;

      // Try update with retries for backfilling index ValidationException
      const maxAttempts = 6;
      let attempt = 0;
      while (attempt < maxAttempts) {
        attempt += 1;
        try {
          const resp = await ddb.send(
            new UpdateCommand({
              TableName: TABLE_NAME,
              Key: { taskId },
              UpdateExpression: "SET imageUrl = :u, thumbnailUrl = :t, updatedAt = :ts",
              ExpressionAttributeValues: {
                ":u": imageUrl,
                ":t": imageUrl,
                ":ts": new Date().toISOString(),
              },
            }),
          );
          console.log(`Updated task ${taskId} with imageUrl`, imageUrl);
          break;
        } catch (err) {
          const msg = String(err?.message || err);
          console.warn(`Attempt ${attempt} failed updating ${taskId}:`, msg);
          // If index is backfilling, retry after delay
          if (msg.includes("backfilling index") || msg.includes("Schema violation against backfilling index")) {
            const delay = Math.min(30000, 1000 * Math.pow(2, attempt));
            console.log(`Backfilling detected; retrying after ${delay}ms (attempt ${attempt})`);
            await sleep(delay);
            continue;
          }
          // non-retryable error — rethrow so Lambda can surface or dead-letter
          throw err;
        }
      }
    } catch (outerErr) {
      console.error("Error processing record", outerErr);
    }
  }

  return { statusCode: 200 };
};
