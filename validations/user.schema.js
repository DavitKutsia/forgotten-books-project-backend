const Joi = require("joi");

const createUserSchema = Joi.object({
  name: Joi.string().min(3).required().messages({
    "string.base": "Name must be a string",
    "string.empty": "Name is required",
    "string.min": "Name must be at least 3 characters long",
    "any.required": "Name is required",
  }),

  email: Joi.string().email().required().messages({
    "string.base": "Email must be a string",
    "string.empty": "Email is required",
    "string.email": "Invalid email format",
    "any.required": "Email is required",
  }),

  password: Joi.string().min(8).required().messages({
    "string.base": "Password must be a string",
    "string.empty": "Password is required",
    "string.min": "Password must be at least 8 characters long",
    "any.required": "Password is required",
  }),

  role: Joi.string().valid("user", "admin").default("user").messages({
    "string.base": "Role must be a string",
    "any.only": "Role must be either user or admin",
  }),

  subscriptionActive: Joi.boolean().optional(),
});

const updateUserSchema = Joi.object({
  name: Joi.string().min(3).optional().messages({
    "string.base": "Name must be a string",
    "string.empty": "Name is required",
    "string.min": "Name must be at least 3 characters long",
  }),

  email: Joi.string().email().optional().messages({
    "string.base": "Email must be a string",
    "string.empty": "Email is required",
    "string.email": "Invalid email format",
  }),

  password: Joi.string().min(8).optional().messages({
    "string.base": "Password must be a string",
    "string.empty": "Password is required",
    "string.min": "Password must be at least 8 characters long",
  }),

  role: Joi.string().valid("user", "admin").optional().messages({
    "string.base": "Role must be a string",
    "any.only": "Role must be either user or admin",
  }),

  subscriptionActive: Joi.boolean().optional(),
}).min(1);

module.exports = {
  createUserSchema,
  updateUserSchema,
};
