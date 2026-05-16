import Joi from "joi";

const teamSchema = Joi.object({
  teamId: Joi.string().required(),
  name: Joi.string().required(),
  description: Joi.string().allow("").optional(),
  createdAt: Joi.string().isoDate().required(),
});

export default teamSchema;
