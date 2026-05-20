import Joi from "joi";

const commentSchema = Joi.object({
  commentId: Joi.string().required(),
  taskId: Joi.string().required(),
  authorId: Joi.string().required(),
  authorName: Joi.string().required(),
  text: Joi.string().required(),
  attachments: Joi.array().items(Joi.string()).optional(),
  createdAt: Joi.string().isoDate().required(),
});

export default commentSchema;
