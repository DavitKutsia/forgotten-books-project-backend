const { Router } = require('express');
const userModel = require('../models/user.model');
const userSchema = require('../validations/user.schema');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const isAuth = require('../middlewares/isAuth.middleware');
const passport = require('../config/google.strategy');
require('dotenv').config();

const authRouter = Router();

authRouter.post('/register', async (req, res) => {
    const { role, name, email, password } = req.body || {};

    if (!role || !['user', 'admin'].includes(role)) {
        return res.status(400).json({ message: 'role must be "user" or "admin"' });
    }

    const { error } = userSchema.validate(req.body);
    if (error) {
        return res.status(400).json({ message: error.details[0].message });
    }

    const existingUser = await userModel.findOne({ email });
    if (existingUser) {
        return res.status(400).json({ message: `User with this email already exists` });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    await userModel.create({ name, email, password: hashedPassword, role });

    res.status(201).json({ message: `${role} registered successfully` });
});

authRouter.post('/login', async (req, res) => {
    const { email, password } = req.body || {};
    if (!email || !password) {
        return res.status(400).json({ message: 'Email and password are required' });
    }

    const user =
        await userModel.findOne({ email });

    if (!user) {
        return res.status(400).json({ message: 'Invalid email or password' });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
        return res.status(400).json({ message: 'Invalid email or password' });
    }

    if (!['user', 'admin'].includes(user.role)) {
        return res.status(403).json({ message: 'Unauthorized role' });
    }

    const payload = { id: user._id, role: user.role };
    const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '1h' });

    res.status(200).json({ message: 'Login successful', token });
}); 

authRouter.get('/profile', isAuth, async (req, res) => {
    try {
        const userId = req.user.id;
        const role = req.user.role;

        if (role === 'admin') {
            return res.status(200).json({
                user: {
                    id: userId,
                    role: 'admin',
                    name: 'Administrator',
                    email: 'admin@gmail.com'
                }
            });
        }

        let user;
        if (role === 'user') {
            user = await userModel.findById(userId).select('-password');
        }

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        res.status(200).json({ user });
    } catch (error) {
        console.error('Error fetching profile:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});


authRouter.get('/google', (req, res, next) => {
    const role = req.query.role;
    if (!role || !['user', 'admin'].includes(role)) {
        return res.status(400).json({ message: 'role query param must be "user" or "admin"' });
    }

    req.session = req.session || {};
    req.session.role = role;

    passport.authenticate('google', {
        scope: ['profile', 'email'],
        state: role,
        prompt: 'select_account'
    })(req, res, next);
});

authRouter.get('/google/callback', passport.authenticate('google', { session: false }), async (req, res) => {
    try {
        const role = req.query.state || 'user';
        const { email, fullName } = req.user;

        const model = role === 'user' ? userModel : adminModel;

        let existUser = await model.findOne({ email });

        if (!existUser) {
            existUser = await model.create({
                name: fullName,
                email,
                role,
                isGoogleUser: true,
                password: Math.random().toString(36).slice(-8)
            });
        } else {
            await model.findByIdAndUpdate(existUser._id, {
                name: fullName,
                isGoogleUser: true
            });
        }

        const payload = { id: existUser._id, role: existUser.role };
        const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '1h' });

        res.redirect(`https://forgotten-books-project-frontend.vercel.app/Signin?token=${token}&role=${role}`);
    } catch (error) {
        console.error(error);
        res.status(500).send('Internal Server Error');
    }
});

module.exports = authRouter;
