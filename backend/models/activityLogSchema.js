import Joi from "joi";

const activityLogValidator = Joi.object({
  taskId: Joi.string().required(),

  changedBy: Joi.string().required(),

  action: Joi.string()
    .valid(
      "Task Created",
      "Task Updated",
      "Status Changed",
      "Task Assigned",
      "Comment Added",
      "Image Uploaded",
      "Task Deleted",
    )
    .required(),

  oldStatus: Joi.string()
    .valid("To Do", "In Progress", "In Review", "Done")
    .optional(),

  newStatus: Joi.string()
    .valid("To Do", "In Progress", "In Review", "Done")
    .optional(),

  teamId: Joi.string().required(),

  timestamp: Joi.date().default(() => new Date()),

  details: Joi.string().optional(),
});

export default activityLogValidator;
