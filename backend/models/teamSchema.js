import Joi from "joi";

const teamSchema = Joi.object({
  name: Joi.string().required(),
  description: Joi.string().allow("").optional(),
});

export default teamSchema;
