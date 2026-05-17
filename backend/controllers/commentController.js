import "dotenv/config";
import { v4 as uuidv4 } from "uuid";
import {
  PutCommand,
  GetCommand,
  DeleteCommand,
  UpdateCommand,
  QueryCommand,
} from "@aws-sdk/lib-dynamodb";
import dynamoDB from "../config/dynamodb.js";
import commentSchema from "../models/commentSchema.js";
import { UsernameAttributeType } from "@aws-sdk/client-cognito-identity-provider";

const commentsTableName = process.env.COMMENTS_TABLE_NAME || "Comments";

// CREATE COMMENT
export const createComment = async (req, res) => {
  try {
    const { taskId, text, attachments } = req.body;
    const authorId = req.user?.userId || req.user?.sub || req.body.authorId;
    const authorName = req.user?.username || req.body.authorName;

    if (!taskId || !text || !authorId || !authorName) {
      return res.status(400).json({
        error: "taskId, text, authorId, and authorName are required",
      });
    }

    const commentId = uuidv4();
    const createdAt = new Date().toISOString();

    const comment = {
      commentId,
      taskId,
      authorId,
      authorName,
      text,
      attachments: attachments || [],
      createdAt,
    };

    // Validate comment data
    const { error, value } = commentSchema.validate(comment);
    if (error) {
      return res.status(400).json({
        error: "Validation failed",
        details: error.details.map((d) => d.message),
      });
    }

    await dynamoDB.send(
      new PutCommand({
        TableName: commentsTableName,
        Item: value,
      })
    );

    return res.status(201).json({
      message: "Comment created successfully",
      comment: value,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      error: error.name || "Failed to create comment",
      details: error.message,
    });
  }
};

// GET COMMENTS FOR A TASK
export const getCommentsByTask = async (req, res) => {
  try {
    const { id } = req.params;

    const taskId = id;
    if (!taskId) {
      return res.status(400).json({
        error: "taskId is required",
      });
    }

    const cmd = new QueryCommand({
      TableName: commentsTableName,
      KeyConditionExpression: "taskId = :taskId",
      ExpressionAttributeValues: {
        ":taskId": taskId,
      },
      ScanIndexForward: false, // Sort by createdAt descending (most recent first)
    });

    const result = await dynamoDB.send(cmd);

    return res.json({
      message: "Comments retrieved successfully",
      count: result.Items?.length || 0,
      comments: result.Items || [],
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      error: error.name || "Failed to retrieve comments",
      details: error.message,
    });
  }
};

// GET SINGLE COMMENT
export const getComment = async (req, res) => {
  try {
    const { commentId, id } = req.params;
const taskId = id; // Since the route is /:id/comments/:commentId, we treat :id as taskId
    if (!commentId || !taskId) {
      return res.status(400).json({
        error: "commentId and taskId are required",
      });
    }

    const cmd = new GetCommand({
      TableName: commentsTableName,
      Key: {
        taskId,
        commentId,
      },
    });

    const result = await dynamoDB.send(cmd);

    if (!result.Item) {
      return res.status(404).json({
        error: "Comment not found",
      });
    }

    return res.json({
      message: "Comment retrieved successfully",
      comment: result.Item,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      error: error.name || "Failed to retrieve comment",
      details: error.message,
    });
  }
};

// UPDATE COMMENT
export const updateComment = async (req, res) => {
  try {
    const { commentId, id } = req.params;
    const taskId = id; // Since the route is /:id/comments/:commentId, we treat :id as taskId
    const { text, attachments } = req.body;
    const authorId = req.user?.userId;

    if (!commentId || !taskId) {
      return res.status(400).json({
        error: "commentId and taskId are required",
      });
    }

    if (!text && !attachments) {
      return res.status(400).json({
        error: "At least one of text or attachments must be provided",
      });
    }

    // Get the comment to verify ownership
    const getCmd = new GetCommand({
      TableName: commentsTableName,
      Key: {
        taskId,
        commentId,
      },
    });

    const getResult = await dynamoDB.send(getCmd);

    if (!getResult.Item) {
      return res.status(404).json({
        error: "Comment not found",
      });
    }

    // Check if the user is the comment author
    if (authorId && getResult.Item.authorId !== authorId) {
      return res.status(403).json({
        error: "Unauthorized",
        details: "You can only update your own comments",
      });
    }

    const updatedAt = new Date().toISOString();
    const updateExpressions = ["#updatedAt = :updatedAt"];
    const expressionAttributeNames = {
      "#updatedAt": "updatedAt",
    };
    const expressionAttributeValues = {
      ":updatedAt": updatedAt,
    };

    if (text) {
      updateExpressions.push("#text = :text");
      expressionAttributeNames["#text"] = "text";
      expressionAttributeValues[":text"] = text;
    }

    if (attachments) {
      updateExpressions.push("#attachments = :attachments");
      expressionAttributeNames["#attachments"] = "attachments";
      expressionAttributeValues[":attachments"] = attachments;
    }

    const updateCmd = new UpdateCommand({
      TableName: commentsTableName,
      Key: {
        taskId,
        commentId,
      },
      UpdateExpression: updateExpressions.join(", "),
      ExpressionAttributeNames: expressionAttributeNames,
      ExpressionAttributeValues: expressionAttributeValues,
      ReturnValues: "ALL_NEW",
    });

    const updateResult = await dynamoDB.send(updateCmd);

    return res.json({
      message: "Comment updated successfully",
      comment: updateResult.Attributes,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      error: error.name || "Failed to update comment",
      details: error.message,
    });
  }
};

// DELETE COMMENT
export const deleteComment = async (req, res) => {
  try {
    const { commentId, id } = req.params;
    const authorId = req.user?.userId;
    const taskId = id; // Since the route is /:id/comments/:commentId, we treat :id as taskId
    if (!commentId || !taskId) {
      return res.status(400).json({
        error: "commentId and taskId are required",
      });
    }

    // Get the comment to verify ownership
    const getCmd = new GetCommand({
      TableName: commentsTableName,
      Key: {
        taskId,
        commentId,
      },
    });

    const getResult = await dynamoDB.send(getCmd);

    if (!getResult.Item) {
      return res.status(404).json({
        error: "Comment not found",
      });
    }

    // Check if the user is the comment author
    if (authorId && getResult.Item.authorId !== authorId) {
      return res.status(403).json({
        error: "Unauthorized",
        details: "You can only delete your own comments",
      });
    }

    const deleteCmd = new DeleteCommand({
      TableName: commentsTableName,
      Key: {
        taskId,
        commentId,
      },
    });

    await dynamoDB.send(deleteCmd);

    return res.json({
      message: "Comment deleted successfully",
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      error: error.name || "Failed to delete comment",
      details: error.message,
    });
  }
};

export default {
  createComment,
  getCommentsByTask,
  getComment,
  updateComment,
  deleteComment,
};