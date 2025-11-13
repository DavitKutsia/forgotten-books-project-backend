    const Joi = require('joi');

    const userSchema = Joi.object({
        name: Joi.string().min(3).required().messages({
            'string.base': 'Name must be a string',
            'string.empty': 'Name is required',
            'string.min': 'Name must be at least 3 characters long',
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

    module.exports = userSchema;