import dynamoDB from "../config/dynamodb.js";

import {
  PutCommand,
  GetCommand,
  ScanCommand,
  UpdateCommand,
  DeleteCommand,
  QueryCommand,
} from "@aws-sdk/lib-dynamodb";

import { v4 as uuidv4 } from "uuid";

// CREATE PROJECT
export const createProject = async (req, res) => {
  try {
    const project = {
      projectId: uuidv4(),
      name: req.body.name,
      description: req.body.description || null,
      ownerId: req.body.ownerId,
      teamId: req.body.teamId || null,
      createdAt: new Date().toISOString(),
    };

    await dynamoDB.send(
      new PutCommand({
        TableName: "Projects",
        Item: project,
      })
    );

    res.status(201).json(project);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
};

// GET ALL PROJECTS
export const getAllProjects = async (req, res) => {
  try {
    const data = await dynamoDB.send(
      new ScanCommand({
        TableName: "Projects",
      })
    );

    res.json(data.Items);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
};

// GET PROJECT BY ID
export const getProjectById = async (req, res) => {
  try {
    const data = await dynamoDB.send(
      new GetCommand({
        TableName: "Projects",
        Key: { projectId: req.params.id },
      })
    );

    if (!data.Item) {
      return res.status(404).json({ error: "Project not found" });
    }

    res.json(data.Item);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
};

// UPDATE PROJECT — dynamically builds SET expression for only supplied fields
export const updateProject = async (req, res) => {
  try {
    const updatable = ["name", "description", "ownerId", "teamId"];

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
        TableName: "Projects",
        Key: { projectId: req.params.id },
        UpdateExpression: `SET ${updates.join(", ")}`,
        ExpressionAttributeNames,
        ExpressionAttributeValues,
        ReturnValues: "ALL_NEW",
      })
    );

    res.json(data.Attributes);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
};

// DELETE PROJECT
export const deleteProject = async (req, res) => {
  try {
    await dynamoDB.send(
      new DeleteCommand({
        TableName: "Projects",
        Key: { projectId: req.params.id },
      })
    );

    res.json({ message: "Project deleted" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
};

// GET PROJECTS BY TEAM — queries the teamId GSI for efficient filtered lookup
export const getProjectsByTeam = async (req, res) => {
  try {
    const data = await dynamoDB.send(
      new QueryCommand({
        TableName: "Projects",
        IndexName: "teamId-index",
        KeyConditionExpression: "teamId = :teamId",
        ExpressionAttributeValues: {
          ":teamId": req.params.teamId,
        },
      })
    );

    res.json(data.Items);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
};
