import Joi from "joi";

const projectSchema = Joi.object({
  projectId: Joi.string().required(),
  name: Joi.string().required(),
  description: Joi.string().allow("").optional(),
  ownerId: Joi.string().required(),
  teamId: Joi.string().allow(null).optional(),
  createdAt: Joi.string().isoDate().required(),
});

export default projectSchema;
