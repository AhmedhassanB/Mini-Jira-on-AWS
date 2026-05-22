import dynamoDB from "../config/dynamodb.js";

import {
  PutCommand,
  GetCommand,
  ScanCommand,
  UpdateCommand,
  DeleteCommand,
} from "@aws-sdk/lib-dynamodb";

import { v4 as uuidv4 } from "uuid";

// CREATE TEAM
export const createTeam = async (req, res) => {
  try {
    const team = {
      teamId: uuidv4(),
      name: req.body.name,
      description: req.body.description || null,
      createdAt: new Date().toISOString(),
    };

    await dynamoDB.send(
      new PutCommand({
        TableName: "Teams",
        Item: team,
      })
    );

    res.status(201).json(team);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
};

// GET ALL TEAMS
// Employees only receive their own team; managers and admins receive all teams
export const getAllTeams = async (req, res) => {
  try {
    const role = req.user?.role ? String(req.user.role).toLowerCase() : null;
    const isPrivileged = role === "manager" || role === "admin";

    if (!isPrivileged) {
      if (!req.user.teamId) return res.json([]);
      const data = await dynamoDB.send(
        new GetCommand({ TableName: "Teams", Key: { teamId: req.user.teamId } })
      );
      return res.json(data.Item ? [data.Item] : []);
    }

    const data = await dynamoDB.send(new ScanCommand({ TableName: "Teams" }));
    res.json(data.Items);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
};

// GET TEAM BY ID
export const getTeamById = async (req, res) => {
  try {
    const data = await dynamoDB.send(
      new GetCommand({
        TableName: "Teams",
        Key: { teamId: req.params.id },
      })
    );

    if (!data.Item) {
      return res.status(404).json({ error: "Team not found" });
    }

    res.json(data.Item);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
};

// UPDATE TEAM — dynamically builds SET expression for only supplied fields
export const updateTeam = async (req, res) => {
  try {
    const updatable = ["name", "description"];

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
        TableName: "Teams",
        Key: { teamId: req.params.id },
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

// DELETE TEAM
export const deleteTeam = async (req, res) => {
  try {
    await dynamoDB.send(
      new DeleteCommand({
        TableName: "Teams",
        Key: { teamId: req.params.id },
      })
    );

    res.json({ message: "Team deleted" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
};
