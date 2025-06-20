const Joi = require('joi');

const directorSchema = Joi.object({
    name: Joi.string().min(3).required().messages({
        'string.base': 'Name must be a string',
        'string.empty': 'Name is required',
        'string.min': 'Name must be at least 3 characters long',
    }),
    age: Joi.number().min(18).max(99).required().messages({
        'number.base': 'Age must be a number',
        'number.empty': 'Age is required',
        'number.min': 'Age must be at least 18',
        'number.max': 'Age must be at most 99',
    }),
    email:  Joi.string().email().required().messages({
        'string.base': 'Email must be a string',
        'string.empty': 'Email is required',
        'string.email': 'Invalid email format',
    }),
    password: Joi.string().min(8).required().messages({
        'string.base': 'Password must be a string',
        'string.empty': 'Password is required',
        'string.min': 'Password must be at least 8 characters long',
    }),
    role: Joi.string().valid('user', 'admin').default('user').messages({
        'string.base': 'Role must be a string',
        'any.only': 'Role must be either user or admin',
    }),
});

module.exports = directorSchema;