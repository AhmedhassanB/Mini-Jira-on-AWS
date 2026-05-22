import { S3Client, GetObjectCommand, PutObjectCommand } from "@aws-sdk/client-s3";
import { DynamoDBDocumentClient, UpdateCommand } from "@aws-sdk/lib-dynamodb";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import sharp from "sharp";

const s3 = new S3Client({ region: process.env.AWS_REGION || "us-east-1" });
const dynamoDB = DynamoDBDocumentClient.from(new DynamoDBClient({ region: process.env.AWS_REGION || "us-east-1" }), {
  marshallOptions: { removeUndefinedValues: true },
});

const RESIZED_BUCKET = process.env.S3_BUCKET_RESIZED || "mini-jira-resized";
const THUMBNAIL_SIZES = [
  { name: "thumbnail-600x300", width: 600, height: 300 },
];

/**
 * Lambda handler: triggered by S3 ObjectCreated events on originals bucket
 * - Extracts taskId from S3 key (tasks/{taskId}/uuid.ext)
 * - Downloads original image
 * - Resizes to multiple thumbnail sizes using Sharp
 * - Uploads thumbnails to resized bucket
 * - Updates Tasks table with thumbnailUrl
 */
export const handler = async (event) => {
  console.log("Image resize Lambda triggered:", JSON.stringify(event, null, 2));

  try {
    // Parse S3 event
    const records = event.Records || [];
    if (records.length === 0) {
      console.log("No S3 records in event");
      return { statusCode: 200, body: "No records to process" };
    }

    const results = [];

    for (const record of records) {
      const bucket = record.s3.bucket.name;
      const key = decodeURIComponent(record.s3.object.key);

      console.log(`Processing S3 object: s3://${bucket}/${key}`);

      // Extract taskId from key: tasks/{taskId}/uuid.ext
      const keyParts = key.split("/");
      if (keyParts.length < 3 || keyParts[0] !== "tasks") {
        console.log(`Skipping non-task object: ${key}`);
        results.push({ key, status: "skipped", reason: "Not a task object" });
        continue;
      }

      const taskId = keyParts[1];
      const originalFilename = keyParts[2];
      const ext = originalFilename.split(".").pop();

      // Download original image from S3
      console.log(`Downloading original image: ${key}`);
      let imageBuffer;
      try {
        const getResp = await s3.send(
          new GetObjectCommand({
            Bucket: bucket,
            Key: key,
          }),
        );
        imageBuffer = await getResp.Body.transformToByteArray();
      } catch (err) {
        console.error(`Failed to download image from S3: ${err.message}`);
        results.push({ key, status: "failed", reason: `Download failed: ${err.message}` });
        continue;
      }

      // Generate and upload thumbnails
      const thumbnailUrls = [];
      let resizeError = null;
      for (const size of THUMBNAIL_SIZES) {
        try {
          console.log(`Generating ${size.name} (${size.width}x${size.height})`);
          // Use fit: "cover" to force exact output dimensions (600x300)
          const resizedBuffer = await sharp(imageBuffer)
            .resize(size.width, size.height, { fit: "cover", position: "center" })
            .toBuffer();

          const thumbnailKey = `tasks/${taskId}/${size.name}.${ext}`;
          console.log(`Uploading to S3: ${thumbnailKey}`);

          // Robust MIME type mapping
          const mimeTypeMap = {
            jpg: "jpeg",
            jpeg: "jpeg",
            png: "png",
            gif: "gif",
            webp: "webp",
            bmp: "bmp",
            tiff: "tiff",
          };
          const mimeType = mimeTypeMap[ext.toLowerCase()] || ext;

          await s3.send(
            new PutObjectCommand({
              Bucket: RESIZED_BUCKET,
              Key: thumbnailKey,
              Body: resizedBuffer,
              ContentType: `image/${mimeType}`,
            }),
          );

          const region = process.env.AWS_REGION || "us-east-1";
          const thumbnailUrl = `https://${RESIZED_BUCKET}.s3.${region}.amazonaws.com/${thumbnailKey}`;
          thumbnailUrls.push(thumbnailUrl);
        } catch (err) {
          console.error(`Failed to generate/upload ${size.name}: ${err.message}`);
          resizeError = err;
          // Don't break; try to generate other sizes
        }
      }

      if (resizeError && thumbnailUrls.length === 0) {
        console.error(`All thumbnail resizes failed for ${key}`);
        results.push({ key, status: "failed", reason: `All resizes failed: ${resizeError.message}` });
        continue;
      }

      // Update Tasks table with the generated resized image URL
      if (thumbnailUrls.length > 0) {
        try {
          console.log(`Updating Tasks table for taskId ${taskId}`);
          await dynamoDB.send(
            new UpdateCommand({
              TableName: "Tasks",
              Key: { taskId },
              UpdateExpression: "SET imageUrl = :imageUrl, thumbnailUrl = :thumbnailUrl, updatedAt = :updatedAt",
              ExpressionAttributeValues: {
                ":imageUrl": thumbnailUrls[0], // Replace original imageUrl with resized image (600x300)
                ":thumbnailUrl": thumbnailUrls[0], // Use resized image as thumbnail URL
                ":updatedAt": new Date().toISOString(),
              },
              ReturnValues: "ALL_NEW",
            }),
          );

          results.push({
            key,
            taskId,
            status: "success",
            thumbnailUrls,
            message: "Image resized and thumbnails uploaded",
          });
        } catch (err) {
          console.error(`Failed to update Tasks table: ${err.message}`);
          results.push({
            key,
            taskId,
            status: "partial",
            reason: `Thumbnails uploaded but DB update failed: ${err.message}`,
            thumbnailUrls,
          });
        }
      }
    }

    console.log("Processing complete:", JSON.stringify(results, null, 2));
    return {
      statusCode: 200,
      body: JSON.stringify({ message: "Image resize complete", results }),
    };
  } catch (err) {
    console.error("Handler error:", err);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: err.message }),
    };
  }
};