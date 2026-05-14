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

      deadline: req.body.deadline || null,

      projectId: req.body.projectId || null,

      imageUrl: req.body.imageUrl || null,

      thumbnailUrl: req.body.thumbnailUrl || null,

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

// UPDATE TASK STATUS
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

// GET TASKS BY TEAM
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

    res.status(500).json({
      error: error.message,
    });
  }
};
