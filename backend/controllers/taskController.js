import dynamoDB from "../config/dynamodb.js";
import sns from "../config/sns.js";
import { publishMetric } from "../config/cloudwatch.js";

import {
  PutCommand,
  ScanCommand,
  GetCommand,
  DeleteCommand,
  UpdateCommand,
  QueryCommand,
} from "@aws-sdk/lib-dynamodb";

import { ListTablesCommand } from "@aws-sdk/client-dynamodb";
import { PublishCommand } from "@aws-sdk/client-sns";

import { v4 as uuidv4 } from "uuid";
import { PutObjectCommand } from "@aws-sdk/client-s3";
import s3 from "../config/s3.js";

const usersTableName = process.env.USERS_TABLE_NAME || "Users";

async function getUserNotificationTopicArn(userId) {
  const resp = await dynamoDB.send(
    new GetCommand({
      TableName: usersTableName,
      Key: { userId },
    }),
  );

  return resp.Item?.snsTopicArn || resp.Item?.notificationTopicArn || null;
}

// TEST REGION
export const testRegion = async (req, res) => {
  res.json({
    region: process.env.AWS_REGION,
  });
};

// TEST DYNAMODB
export const getTables = async (req, res) => {
  try {
    const data = await dynamoDB.send(new ListTablesCommand({}));

    res.json(data);
  } catch (error) {
    console.log(error);

    res.status(500).json({
      error: error.message,
    });
  }
};

// CREATE TASK
export const createTask = async (req, res) => {
  try {
    console.log("createTask incoming body:", req.body);
    console.log("createTask incoming files:", req.files);
    const taskId = uuidv4();

    // If a file was uploaded via multipart/form-data (field 'file'), upload to S3 first
    let imageUrl;
    let thumbnailUrl;

    // Support multer.any (req.files as array); filter for actual files, move text fields to req.body
    const uploadedFile = req.files?.find((f) =>
      f.mimetype?.startsWith("image/"),
    );
    if (uploadedFile) {
      const bucket =
        process.env.S3_BUCKET_ORIGINALS || process.env.S3_BUCKET_RESIZED || "";
      if (!bucket)
        return res
          .status(500)
          .json({ error: "S3 originals bucket not configured" });

      const fileExt =
        uploadedFile.originalname && uploadedFile.originalname.includes(".")
          ? uploadedFile.originalname.split(".").pop()
          : "bin";
      const key = `tasks/${taskId}/${uuidv4()}.${fileExt}`;

      await s3.send(
        new PutObjectCommand({
          Bucket: bucket,
          Key: key,
          Body: uploadedFile.buffer,
          ContentType: uploadedFile.mimetype,
        }),
      );

      const region = process.env.AWS_REGION || "us-east-1";
      imageUrl = `https://${bucket}.s3.${region}.amazonaws.com/${key}`;
      thumbnailUrl = imageUrl;
    }

    // Only include fields that are provided and non-empty to avoid DynamoDB empty-string errors
    const task = { taskId, createdAt: new Date().toISOString() };

    const pick = (v) => {
      if (v === undefined || v === null) return undefined;
      const s = String(v).trim();
      return s === "" ? undefined : s;
    };

    const title = pick(req.body.title);
    const description = pick(req.body.description);
    const status = pick(req.body.status) || "To Do";
    const priority = pick(req.body.priority);
    const teamId = pick(req.body.teamId);
    const assigneeId = pick(req.body.assigneeId);
    const deadline = pick(req.body.deadline);
    const projectId = pick(req.body.projectId);

    if (title) task.title = title;
    if (description) task.description = description;
    if (status) task.status = status;
    if (priority) task.priority = priority;
    if (teamId) task.teamId = teamId;
    if (assigneeId) task.assigneeId = assigneeId;
    if (deadline) task.deadline = deadline;
    if (projectId) task.projectId = projectId;

    if (imageUrl) task.imageUrl = imageUrl;
    else if (pick(req.body.imageUrl)) task.imageUrl = pick(req.body.imageUrl);

    if (thumbnailUrl) task.thumbnailUrl = thumbnailUrl;
    else if (pick(req.body.thumbnailUrl))
      task.thumbnailUrl = pick(req.body.thumbnailUrl);

    await dynamoDB.send(
      new PutCommand({
        TableName: "Tasks",
        Item: task,
      }),
    );

    // If assigneeId was provided at creation, publish to SNS for task assignment workflow
    if (assigneeId) {
      try {
        const topicArn = await getUserNotificationTopicArn(assigneeId);
        if (topicArn) {
          console.log(
            `Publishing task assignment event for task ${taskId} to assignee ${assigneeId} via ${topicArn}`,
          );
          await sns.send(
            new PublishCommand({
              TopicArn: topicArn,
              Message: JSON.stringify({
                taskId,
                assigneeId,
                title: task.title,
                timestamp: new Date().toISOString(),
              }),
              Subject: "Task Assignment Notification",
              MessageAttributes: {
                assigneeId: {
                  DataType: "String",
                  StringValue: assigneeId,
                },
                eventType: {
                  DataType: "String",
                  StringValue: "TASK_ASSIGNMENT",
                },
              },
            }),
          );
        } else {
          console.warn(
            `No SNS topic found for assignee ${assigneeId}; task assignment email/event will not be published for task ${taskId}`,
          );
        }
      } catch (err) {
        console.error(`Failed to publish task assignment: ${err.message}`);
        // Don't fail the request; log and continue
      }
    }

    const teamDimension = teamId ? [{ Name: "TeamId", Value: teamId }] : [];
    await publishMetric("TasksCreated", 1, teamDimension);
    if (assigneeId) {
      await publishMetric("TasksAssignedPerTeam", 1, teamDimension);
    }

    res.status(201).json(task);
  } catch (error) {
    console.log(error);

    res.status(500).json({
      error: error.message,
    });
  }
};

// GET ALL TASKS
// Managers see everything; employees are automatically scoped to their own team
export const getAllTasks = async (req, res) => {
  try {
    const role = req.user?.role ? String(req.user.role).toLowerCase() : null;
    const isPrivileged = role === "manager" || role === "admin";
    const employeeTeamId = req.user?.teamId;

    if (!isPrivileged) {
      if (!employeeTeamId) {
        return res
          .status(403)
          .json({ error: "Employee account has no team assigned" });
      }
      const data = await dynamoDB.send(
        new QueryCommand({
          TableName: "Tasks",
          IndexName: "teamId-index",
          KeyConditionExpression: "teamId = :teamId",
          ExpressionAttributeValues: { ":teamId": employeeTeamId },
        }),
      );
      return res.json(data.Items);
    }

    // Manager/Admin: full scan
    const data = await dynamoDB.send(new ScanCommand({ TableName: "Tasks" }));
    res.json(data.Items);
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: error.message });
  }
};

// GET TASK BY ID
// Employees may only fetch tasks that belong to their own team
export const getTaskById = async (req, res) => {
  try {
    const data = await dynamoDB.send(
      new GetCommand({
        TableName: "Tasks",
        Key: { taskId: req.params.id },
      }),
    );

    if (!data.Item) {
      return res.status(404).json({ error: "Task not found" });
    }

    const role = req.user?.role ? String(req.user.role).toLowerCase() : null;
    const isPrivileged = role === "manager" || role === "admin";
    if (!isPrivileged && data.Item.teamId !== req.user.teamId) {
      return res
        .status(403)
        .json({ error: "Access denied: task belongs to a different team" });
    }

    res.json(data.Item);
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: error.message });
  }
};

// DELETE TASK — also removes all comments belonging to the task
export const deleteTask = async (req, res) => {
  try {
    const taskId = req.params.id;
    const commentsTable = process.env.COMMENTS_TABLE_NAME || "Comments";

    // Fetch all comments for this task then delete them
    const { Items: comments = [] } = await dynamoDB.send(
      new QueryCommand({
        TableName: commentsTable,
        KeyConditionExpression: "taskId = :taskId",
        ExpressionAttributeValues: { ":taskId": taskId },
        ProjectionExpression: "taskId, commentId",
      }),
    );

    await Promise.all(
      comments.map((c) =>
        dynamoDB.send(
          new DeleteCommand({
            TableName: commentsTable,
            Key: { taskId: c.taskId, commentId: c.commentId },
          }),
        ),
      ),
    );

    await dynamoDB.send(
      new DeleteCommand({ TableName: "Tasks", Key: { taskId } }),
    );

    res.json({ message: "Task deleted" });
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: error.message });
  }
};

// UPDATE TASK STATUS — kept for backward compatibility with existing routes
export const updateTaskStatus = async (req, res) => {
  try {
    await dynamoDB.send(
      new UpdateCommand({
        TableName: "Tasks",

        Key: {
          taskId: req.params.id,
        },

        UpdateExpression: "SET #status = :status",

        ExpressionAttributeNames: {
          "#status": "status",
        },

        ExpressionAttributeValues: {
          ":status": req.body.status,
        },
      }),
    );

    res.json({
      message: "Task updated",
    });
  } catch (error) {
    console.log(error);

    res.status(500).json({
      error: error.message,
    });
  }
};

// UPDATE TASK — dynamically builds SET expression for only supplied fields
export const updateTask = async (req, res) => {
  try {
    const taskId = req.params.id;

    const updatable = [
      "title",
      "description",
      "status",
      "priority",
      "teamId",
      "assigneeId",
      "deadline",
      "projectId",
      "imageUrl",
      "thumbnailUrl",
    ];

    const updates = [];
    const ExpressionAttributeNames = {};
    const ExpressionAttributeValues = {};

    updatable.forEach((field) => {
      if (req.body[field] !== undefined) {
        updates.push(`#${field} = :${field}`);
        ExpressionAttributeNames[`#${field}`] = field;
        ExpressionAttributeValues[`:${field}`] = req.body[field];
      }
    });

    if (updates.length === 0) {
      return res.status(400).json({ error: "No fields to update" });
    }

    // Track when the record was last modified
    updates.push("#updatedAt = :updatedAt");
    ExpressionAttributeNames["#updatedAt"] = "updatedAt";
    ExpressionAttributeValues[":updatedAt"] = new Date().toISOString();

    const data = await dynamoDB.send(
      new UpdateCommand({
        TableName: "Tasks",
        Key: { taskId },
        UpdateExpression: `SET ${updates.join(", ")}`,
        ExpressionAttributeNames,
        ExpressionAttributeValues,
        ReturnValues: "ALL_NEW",
      }),
    );

    // If assigneeId was updated, publish to SNS for task assignment workflow
    if (req.body.assigneeId !== undefined) {
      try {
        const topicArn = await getUserNotificationTopicArn(req.body.assigneeId);
        if (topicArn) {
          console.log(
            `Publishing task assignment event for task ${taskId} to assignee ${req.body.assigneeId} via ${topicArn}`,
          );
          await sns.send(
            new PublishCommand({
              TopicArn: topicArn,
              Message: JSON.stringify({
                taskId,
                assigneeId: req.body.assigneeId,
                title: data.Attributes.title,
                timestamp: new Date().toISOString(),
              }),
              Subject: "Task Assignment Notification",
              MessageAttributes: {
                assigneeId: {
                  DataType: "String",
                  StringValue: req.body.assigneeId,
                },
                eventType: {
                  DataType: "String",
                  StringValue: "TASK_ASSIGNMENT",
                },
              },
            }),
          );
        } else {
          console.warn(
            `No SNS topic found for assignee ${req.body.assigneeId}; task assignment email/event will not be published for task ${taskId}`,
          );
        }
      } catch (err) {
        console.error(`Failed to publish task assignment: ${err.message}`);
        // Don't fail the request; log and continue
      }
    }

    const updatedTask = data.Attributes;
    const teamDimension = updatedTask?.teamId
      ? [{ Name: "TeamId", Value: updatedTask.teamId }]
      : [];

    if (req.body.status === "Done") {
      if (updatedTask.createdAt) {
        const hoursToClose =
          (Date.now() - new Date(updatedTask.createdAt).getTime()) /
          (1000 * 60 * 60);
        await publishMetric("AvgTimeToClose", hoursToClose, teamDimension);
      }
      await publishMetric("TasksClosed", 1, teamDimension);
    }
    if (req.body.assigneeId !== undefined) {
      await publishMetric("TasksAssignedPerTeam", 1, teamDimension);
    }

    res.json(updatedTask);
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: error.message });
  }
};

// GET TASKS BY TEAM — queries GSI teamId-index, sorted by createdAt
// Employees may only query their own team; managers can query any team
export const getTasksByTeam = async (req, res) => {
  try {
    const role = req.user?.role ? String(req.user.role).toLowerCase() : null;
    const isPrivileged = role === "manager" || role === "admin";
    if (!isPrivileged && req.params.teamId !== req.user.teamId) {
      return res
        .status(403)
        .json({
          error:
            "Access denied: employees may only view their own team's tasks",
        });
    }

    const data = await dynamoDB.send(
      new QueryCommand({
        TableName: "Tasks",
        IndexName: "teamId-index",
        KeyConditionExpression: "teamId = :teamId",
        ExpressionAttributeValues: {
          ":teamId": req.params.teamId,
        },
      }),
    );

    res.json(data.Items);
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: error.message });
  }
};

// GET TASKS BY ASSIGNEE — queries GSI assigneeId-index
// Employees may only query their own assigneeId; managers can query any assignee
export const getTasksByAssignee = async (req, res) => {
  try {
    const role = req.user?.role ? String(req.user.role).toLowerCase() : null;
    const isPrivileged = role === "manager" || role === "admin";
    if (!isPrivileged && req.params.assigneeId !== req.user.sub) {
      return res
        .status(403)
        .json({
          error:
            "Access denied: employees may only view their own assigned tasks",
        });
    }

    const data = await dynamoDB.send(
      new QueryCommand({
        TableName: "Tasks",
        IndexName: "assigneeId-index",
        KeyConditionExpression: "assigneeId = :assigneeId",
        ExpressionAttributeValues: {
          ":assigneeId": req.params.assigneeId,
        },
      }),
    );

    res.json(data.Items);
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: error.message });
  }
};

// GET TASKS BY PROJECT — queries GSI projectId-index
// Employees only receive tasks that also belong to their own team
export const getTasksByProject = async (req, res) => {
  try {
    const role = req.user?.role ? String(req.user.role).toLowerCase() : null;
    const isPrivileged = role === "manager" || role === "admin";
    const employeeTeamId = req.user?.teamId;

    if (!isPrivileged && !employeeTeamId) {
      return res
        .status(403)
        .json({ error: "Employee account has no team assigned" });
    }

    const query = {
      TableName: "Tasks",
      IndexName: "projectId-index",
      KeyConditionExpression: "projectId = :projectId",
      ExpressionAttributeValues: { ":projectId": req.params.projectId },
    };

    if (!isPrivileged) {
      query.FilterExpression = "teamId = :teamId";
      query.ExpressionAttributeValues[":teamId"] = employeeTeamId;
    }

    const data = await dynamoDB.send(new QueryCommand(query));
    res.json(data.Items);
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: error.message });
  }
};
