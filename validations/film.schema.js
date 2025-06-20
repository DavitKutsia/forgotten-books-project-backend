const Joi = require('joi');

const filmSchema = Joi.object({
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
    genre: Joi.string().valid('action', 'comedy', 'drama', 'horror', 'romance', 'sci-fi').required().messages({
        'string.base': 'Genre must be a string',
        'string.empty': 'Genre is required',
    }),
    year: Joi.number().integer().min(1900).max(2025).required().messages({
        'number.base': 'Year must be a number',
        'number.empty': 'Year is required',
        'number.integer': 'Year must be an integer',
        'number.min': 'Year must be greater than or equal to 1900',
        'number.max': 'Year must be less than or equal to the current year',
    })
});

module.exports = filmSchema;