import Joi from "joi";

export const createProductSchema = Joi.object({
  name: Joi.string().min(3).required(),
  price: Joi.number().min(0).required(),
  stock: Joi.number().min(0).required(),
  description: Joi.string().optional(),
  image: Joi.string().optional(),
  storeId: Joi.string().uuid().required()
});
