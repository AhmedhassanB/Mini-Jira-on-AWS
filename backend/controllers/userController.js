import dynamoDB from "../config/dynamodb.js";
import { ScanCommand, UpdateCommand } from "@aws-sdk/lib-dynamodb";

const usersTableName = process.env.USERS_TABLE_NAME || "Users";

// GET ALL USERS — admin only; strips internal fields before sending
export const getAllUsers = async (req, res) => {
  try {
    const data = await dynamoDB.send(new ScanCommand({ TableName: usersTableName }));
    const users = (data.Items || []).map(({ userId, username, email, role, teamId }) => ({
      userId,
      username,
      email,
      role,
      teamId: teamId || null,
    }));
    res.json(users);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
};

// PATCH /api/users/:userId/team — admin only; updates a user's teamId in DynamoDB
export const assignUserToTeam = async (req, res) => {
  try {
    const { userId } = req.params;
    const { teamId } = req.body;

    if (!teamId) {
      return res.status(400).json({ error: "teamId is required" });
    }

    await dynamoDB.send(
      new UpdateCommand({
        TableName: usersTableName,
        Key: { userId },
        UpdateExpression: "SET teamId = :teamId, updatedAt = :updatedAt",
        ExpressionAttributeValues: {
          ":teamId": teamId,
          ":updatedAt": new Date().toISOString(),
        },
      })
    );

    res.json({ message: "User assigned to team", userId, teamId });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
};
