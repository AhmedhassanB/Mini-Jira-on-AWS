import { Router } from "express";
import { authMiddleware } from "../middleware/auth.js";

import {
  createTask,
  getAllTasks,
  getTaskById,
  updateTask,
  deleteTask,
  getTasksByTeam,
  getTasksByAssignee,
  getTasksByProject,
} from "../controllers/taskController.js";
//im putting those here since they are related to the task
import {  createComment,
  getCommentsByTask,
  deleteComment,
  updateComment }
from "../controllers/commentController.js";

const router = Router();

// Collection routes
router.post("/", createTask);
router.get("/", getAllTasks);

// Filtered queries — defined before /:id to avoid param conflict
router.get("/team/:teamId", getTasksByTeam);
router.get("/assignee/:assigneeId", getTasksByAssignee);
router.get("/project/:projectId", getTasksByProject);

// Single-resource routes
router.get("/:id", getTaskById);
router.put("/:id", updateTask);
router.delete("/:id", deleteTask);

// Comment routes require authentication
router.post("/:id/comments", authMiddleware, createComment);
router.get("/:id/comments", getCommentsByTask);
router.put('/:id/comments/:commentId', authMiddleware, updateComment);
router.delete('/:id/comments/:commentId', authMiddleware, deleteComment);
export default router;
