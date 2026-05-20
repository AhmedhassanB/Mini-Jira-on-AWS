import dynamoDB from "../config/dynamodb.js";

import {
  PutCommand,
  ScanCommand,
  GetCommand,
  DeleteCommand,
  UpdateCommand,
  QueryCommand,
} from "@aws-sdk/lib-dynamodb";

import { ListTablesCommand } from "@aws-sdk/client-dynamodb";

import { v4 as uuidv4 } from "uuid";

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
    const task = {
      taskId: uuidv4(),

      title: req.body.title,

      description: req.body.description,

      status: req.body.status || "To Do",

      priority: req.body.priority,

      teamId: req.body.teamId,

      assigneeId: req.body.assigneeId,

      deadline: req.body.deadline || undefined,

      projectId: req.body.projectId || undefined,

      imageUrl: req.body.imageUrl || undefined,

      thumbnailUrl: req.body.thumbnailUrl || undefined,

      createdAt: new Date().toISOString(),
    };

    await dynamoDB.send(
      new PutCommand({
        TableName: "Tasks",
        Item: task,
      }),
    );

    res.status(201).json(task);
  } catch (error) {
    console.log(error);

    res.status(500).json({
      error: error.message,
    });
  }
};

// GET ALL TASKS
export const getAllTasks = async (req, res) => {
  try {
    const data = await dynamoDB.send(
      new ScanCommand({
        TableName: "Tasks",
      }),
    );

    res.json(data.Items);
  } catch (error) {
    console.log(error);

    res.status(500).json({
      error: error.message,
    });
  }
};

// GET TASK BY ID
export const getTaskById = async (req, res) => {
  try {
    const data = await dynamoDB.send(
      new GetCommand({
        TableName: "Tasks",

        Key: {
          taskId: req.params.id,
        },
      }),
    );

    res.json(data.Item);
  } catch (error) {
    console.log(error);

    res.status(500).json({
      error: error.message,
    });
  }
};

// DELETE TASK
export const deleteTask = async (req, res) => {
  try {
    await dynamoDB.send(
      new DeleteCommand({
        TableName: "Tasks",

        Key: {
          taskId: req.params.id,
        },
      }),
    );

    res.json({
      message: "Task deleted",
    });
  } catch (error) {
    console.log(error);

    res.status(500).json({
      error: error.message,
    });
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
        Key: { taskId: req.params.id },
        UpdateExpression: `SET ${updates.join(", ")}`,
        ExpressionAttributeNames,
        ExpressionAttributeValues,
        ReturnValues: "ALL_NEW",
      }),
    );

    res.json(data.Attributes);
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: error.message });
  }
};

// GET TASKS BY TEAM — queries GSI teamId-index, sorted by createdAt
export const getTasksByTeam = async (req, res) => {
  try {
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
export const getTasksByAssignee = async (req, res) => {
  try {
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
export const getTasksByProject = async (req, res) => {
  try {
    const data = await dynamoDB.send(
      new QueryCommand({
        TableName: "Tasks",
        IndexName: "projectId-index",
        KeyConditionExpression: "projectId = :projectId",
        ExpressionAttributeValues: {
          ":projectId": req.params.projectId,
        },
      }),
    );

    res.json(data.Items);
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: error.message });
  }
};
