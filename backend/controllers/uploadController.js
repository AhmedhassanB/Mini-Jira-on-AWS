import "dotenv/config";

import multer from "multer";
import { PutObjectCommand } from "@aws-sdk/client-s3";
import { GetCommand, UpdateCommand } from "@aws-sdk/lib-dynamodb";
import { v4 as uuidv4 } from "uuid";

import dynamoDB from "../config/dynamodb.js";
import s3 from "../config/s3.js";

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024,
  },
  fileFilter: (req, file, cb) => {
    if (!file.mimetype?.startsWith("image/")) {
      return cb(new Error("Only image files are allowed"));
    }
    cb(null, true);
  },
});

function getBucketName() {
  return process.env.S3_BUCKET_ORIGINALS || "";
}

function buildPublicUrl(bucket, key) {
  const region = process.env.AWS_REGION || "us-east-1";
  return `https://${bucket}.s3.${region}.amazonaws.com/${key}`;
}

// Capture both text fields and any file field; multer.any() accepts all and post-processing moves text to req.body
export const uploadTaskImageMiddleware = upload.any();

// Post-processor to extract text fields from req.files (from multipart) and move to req.body
// Also normalize field names by trimming whitespace
export function extractTextFieldsFromMultipart(req, res, next) {
  if (Array.isArray(req.files)) {
    req.files.forEach((file) => {
      // Trim fieldname to handle trailing spaces from form-data
      const trimmedName = file.fieldname.trim();
      // If it's not actually a file (no mimetype or encoding), treat it as a text field
      if (!file.mimetype || file.mimetype === "application/octet-stream") {
        req.body[trimmedName] = file.buffer.toString("utf-8");
      } else {
        // For actual files, update the fieldname to trimmed version
        file.fieldname = trimmedName;
      }
    });
  }

  // Normalize all req.body keys by trimming whitespace
  if (req.body && typeof req.body === "object") {
    const trimmedBody = {};
    Object.keys(req.body).forEach((key) => {
      trimmedBody[key.trim()] = req.body[key];
    });
    req.body = trimmedBody;
  }

  next();
}

export function handleUploadTaskImage(req, res, next) {
  uploadTaskImageMiddleware(req, res, (err) => {
    if (err) {
      if (err.code === "LIMIT_FILE_SIZE") {
        return res.status(413).json({ error: "File too large. Max size is 10 MB." });
      }

      if (err.message === "Field name missing") {
        return res.status(400).json({ error: "Missing form-data field name. Use key 'file' with type File in Postman." });
      }

      if (err.message === "Only image files are allowed") {
        return res.status(400).json({ error: err.message });
      }

      return res.status(400).json({ error: err.message || "Invalid upload" });
    }

    // Move text fields from req.files to req.body
    extractTextFieldsFromMultipart(req, res, () => next());
  });
}

export async function uploadTaskImage(req, res) {
  try {
    const bucket = getBucketName();
    if (!bucket) {
      return res.status(500).json({ error: "S3 originals bucket not configured" });
    }

    // multer.any() populates `req.files` for all fields; filter for actual image files
    const file = req.files?.find((f) => f.fieldname === "file" || (f.fieldname === "image" && f.mimetype?.startsWith("image/"))) ||
                 req.files?.find((f) => f.mimetype?.startsWith("image/"));
    if (!file) {
      return res.status(400).json({ error: "No file uploaded. Include a file in form-data." });
    }

    const taskId = req.params.id;
    const existingTask = await dynamoDB.send(
      new GetCommand({
        TableName: "Tasks",
        Key: { taskId },
      }),
    );

    if (!existingTask.Item) {
      return res.status(404).json({ error: "Task not found" });
    }

    const fileExt = file.originalname && file.originalname.includes(".") ? file.originalname.split(".").pop() : "bin";
    const key = `tasks/${taskId}/${uuidv4()}.${fileExt}`;

    await s3.send(
      new PutObjectCommand({
        Bucket: bucket,
        Key: key,
        Body: file.buffer,
        ContentType: file.mimetype,
      }),
    );

    const imageUrl = buildPublicUrl(bucket, key);

    let dbUpdateWarning = null;
    try {
      await dynamoDB.send(
        new UpdateCommand({
          TableName: "Tasks",
          Key: { taskId },
          UpdateExpression: "SET imageUrl = :imageUrl, thumbnailUrl = :thumbnailUrl, updatedAt = :updatedAt",
          ExpressionAttributeValues: {
            ":imageUrl": imageUrl,
            ":thumbnailUrl": imageUrl,
            ":updatedAt": new Date().toISOString(),
          },
          ReturnValues: "ALL_NEW",
        }),
      );
    } catch (dbError) {
      const message = String(dbError?.message || "");
      if (dbError?.name === "ValidationException" && message.includes("backfilling index")) {
        dbUpdateWarning = "Task uploaded to S3, but DynamoDB update is waiting for the index to finish backfilling.";
      } else {
        throw dbError;
      }
    }

    return res.status(201).json({
      message: "File uploaded successfully",
      bucket,
      key,
      imageUrl,
      warning: dbUpdateWarning,
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ error: error.name || "Upload failed", details: error.message });
  }
}