import { Router } from "express";
import { authMiddleware, requireManager } from "../middleware/auth.js";

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
import {
  uploadTaskImage,
  handleUploadTaskImage,
  uploadTaskImageMiddleware,
  extractTextFieldsFromMultipart,
} from "../controllers/uploadController.js";
//im putting those here since they are related to the task
import {  createComment,
  getCommentsByTask,
  deleteComment,
  updateComment }
from "../controllers/commentController.js";

const router = Router();

// Collection routes
// Only managers can create tasks; file upload allowed via multipart form-data
router.post("/", authMiddleware, requireManager, uploadTaskImageMiddleware, extractTextFieldsFromMultipart, createTask);
// All authenticated users can list tasks (controller applies team filter for employees)
router.get("/", authMiddleware, getAllTasks);

// Filtered queries — defined before /:id to avoid param conflict
// All authenticated users; controller enforces that employees can only query their own team
router.get("/team/:teamId", authMiddleware, getTasksByTeam);
router.get("/assignee/:assigneeId", authMiddleware, getTasksByAssignee);
router.get("/project/:projectId", authMiddleware, getTasksByProject);

// Single-resource routes
router.get("/:id", authMiddleware, getTaskById);
// All authenticated users can update; controller restricts employees to status-only changes
router.put("/:id", authMiddleware, updateTask);
// Only managers can delete tasks
router.delete("/:id", authMiddleware, requireManager, deleteTask);
// Only managers can upload/replace task images
router.post("/:id/image", authMiddleware, requireManager, handleUploadTaskImage, uploadTaskImage);

// Comment routes — all authenticated users can read and write; ownership enforced in controller
router.post("/:id/comments", authMiddleware, createComment);
router.get("/:id/comments", authMiddleware, getCommentsByTask);
router.put('/:id/comments/:commentId', authMiddleware, updateComment);
router.delete('/:id/comments/:commentId', authMiddleware, deleteComment);
export default router;
