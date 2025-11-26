import Joi from "joi";

export const createStoreSchema = Joi.object({
  name: Joi.string().min(3).max(100).required(),
  address: Joi.string().min(5).required(),
  phone: Joi.string().optional(),
  email: Joi.string().email().optional(),
  description: Joi.string().max(500).optional(),

  // 👇 IMPORTANTE: Prisma requiere INT
  ownerId: Joi.number().integer().required(),

  // opcional
  domain: Joi.string().optional()
});
export const updateStoreSchema = Joi.object({
  name: Joi.string().min(3).max(100).optional(),
  address: Joi.string().min(5).optional(),
  phone: Joi.string().optional(),
  email: Joi.string().email().optional(),
  description: Joi.string().max(500).optional(),
  active: Joi.boolean().optional(),

  ownerId: Joi.number().integer().optional(),
  domain: Joi.string().optional()
});
