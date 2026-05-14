import Joi from "joi";

const userSchema = Joi.object({
  userId: Joi.string().required(),
  username: Joi.string().required(),
  email: Joi.string().email().required(),
  role: Joi.string().valid("Manager", "Employee", "Admin").required(),
  teamId: Joi.string().allow(null),
  cognitoSub: Joi.string().optional(),
  createdAt: Joi.string().isoDate().required(),
});

export default userSchema;
