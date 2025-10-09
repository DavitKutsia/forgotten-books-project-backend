const Joi = require('joi');

const productSchema = Joi.object({
    title: Joi.string().min(3).required().messages({
        'string.base': 'Title must be a string',
        'string.empty': 'Title is required',
        'string.min': 'Title must be at least 3 characters long',
    }),
    content: Joi.string().min(10).required().messages({
        'string.base': 'Content must be a string',
        'string.empty': 'Content is required',
        'string.min': 'Content must be at least 10 characters long',
    }),
    price: Joi.number().min(0).required().messages({
        'number.base': 'Price must be a number',
        'number.empty': 'Price is required',
    })
});

module.exports = productSchema;