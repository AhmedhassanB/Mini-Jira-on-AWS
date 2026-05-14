import Joi from "joi";

const taskValidator = Joi.object({
  title: Joi.string().required(),

  description: Joi.string().required(),

  priority: Joi.string().valid("Low", "Medium", "High").required(),

  status: Joi.string()
    .valid("To Do", "In Progress", "In Review", "Done")
    .default("To Do"),

  teamId: Joi.string().required(),

  assigneeId: Joi.string().required(),

  deadline: Joi.string().optional(),

  projectId: Joi.string().optional(),

  imageUrl: Joi.string().optional(),

  thumbnailUrl: Joi.string().optional(),
});

export default taskValidator;
