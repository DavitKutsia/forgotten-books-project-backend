const { Router } = require('express');
const directorModel = require('../models/director.model');
const bcrypt = require('bcrypt');
const directorSchema = require('../validations/director.schema');
const jwt = require('jsonwebtoken');
const isAuth = require("../middlewares/isAuth.middleware"); // <-- import this
require('dotenv').config();

const authRouter = Router();

/**
 * @swagger
 * /auth/register:
 *   post:
 *     summary: Register a new director
 *     tags:
 *       - Auth
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - email
 *               - password
 *               - age
 *               - role
 *             properties:
 *               name:
 *                 type: string
 *                 example: John Doe
 *               email:
 *                 type: string
 *                 format: email
 *                 example: johndoe@example.com
 *               password:
 *                 type: string
 *                 format: password
 *                 example: mySecret123
 *               age:
 *                 type: integer
 *                 example: 35
 *               role:
 *                 type: string
 *                 example: director
 *     responses:
 *       201:
 *         description: Director registered successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Director registered successfully
 *       400:
 *         description: Bad request (validation error or director already exists)
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: Director already exists
 */
authRouter.post('/register', async (req, res) => {
    const { error } = directorSchema.validate(req.body || {});
    if (error) {
        return res.status(400).json({ error: error.details[0].message });
    }

    const { name, email, password, age, role } = req.body;

    const existingDirector = await directorModel.findOne({ email });
    if (existingDirector) {
        return res.status(400).json({ error: 'Director already exists' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    await directorModel.create({ name, email, password: hashedPassword, age, role });
    
    res.status(201).json({ message: 'Director registered successfully' });
});

/**
 * @swagger
 * /auth/login:
 *   post:
 *     summary: Login as a director
 *     tags:
 *       - Auth
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 example: johndoe@example.com
 *               password:
 *                 type: string
 *                 format: password
 *                 example: mySecret123
 *     responses:
 *       200:
 *         description: Login successful, returns JWT token
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 token:
 *                   type: string
 *                   example: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
 *       400:
 *         description: Invalid credentials or missing fields
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: Email and password is invalid
 */
authRouter.post('/login', async (req, res) => {
    const { email, password } = req.body || {};
    if (!email || !password) {
        return res.status(400).json({ error: 'Email and password are required' });
    }

    const existingDirector = await directorModel.findOne({ email });
    if (!existingDirector) {
        return res.status(400).json({ error: 'Email and password is invalid' });
    }

    const isPasswordValid = await bcrypt.compare(password, existingDirector.password);
    if (!isPasswordValid) {
        return res.status(400).json({ error: 'Email and password is invalid' });
    }

    const payload = { directorId: existingDirector._id };
    const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '1h' });

    res.status(200).json({ token });
});

/**
 * @swagger
 * /auth/profile:
 *   get:
 *     summary: Get the authenticated director's profile
 *     tags:
 *       - Auth
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Returns the director's profile (without password)
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 director:
 *                   type: object
 *                   properties:
 *                     _id:
 *                       type: string
 *                       example: 60d0fe4f5311236168a109ca
 *                     name:
 *                       type: string
 *                       example: John Doe
 *                     email:
 *                       type: string
 *                       example: johndoe@example.com
 *                     age:
 *                       type: integer
 *                       example: 35
 *                     role:
 *                       type: string
 *                       example: director
 *       401:
 *         description: Unauthorized (missing or invalid token)
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: Unauthorized
 *       404:
 *         description: Director not found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: Director not found
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: Internal server error
 */
authRouter.get('/profile', isAuth, async (req, res) => {
    try {
        const director = await directorModel.findById(req.directorId).select('-password');
        if (!director) {
            return res.status(404).json({ error: 'Director not found' });
        }
        res.status(200).json({ director });
    } catch (err) {
        res.status(500).json({ error: 'Internal server error' });
    }
});

module.exports = authRouter;
