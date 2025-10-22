const { Router } = require('express');
const sellerModel = require('../models/seller.model');
const buyerModel = require('../models/buyer.model');
const sellerSchema = require('../validations/seller.schema');
const buyerSchema = require('../validations/buyer.schema');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const isAuth = require('../middlewares/isAuth.middleware');
const passport = require('../config/google.strategy');
require('dotenv').config();

const authRouter = Router();

authRouter.post('/register', async (req, res) => {
    const { role, name, email, password } = req.body || {};
    if (!role || !['seller', 'buyer', 'admin'].includes(role)) {
        return res.status(400).json({ message: 'role must be "seller", "buyer" or "admin"' });
    }

    const schema = role === 'seller' ? sellerSchema : buyerSchema;
    const model  = role === 'seller' ? sellerModel  : buyerModel;

    const { error } = schema.validate(req.body);
    if (error) {
        return res.status(400).json({ message: error.details[0].message });
    }

    const existingUser = await model.findOne({ email });
    if (existingUser) {
        return res.status(400).json({ message: `${role} with this email already exists` });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    await model.create({ name, email, password: hashedPassword, role });

    res.status(201).json({ message: `${role} registered successfully` });
});

authRouter.post('/login', async (req, res) => {
    const { email, password } = req.body || {};
    if (!email || !password) {
        return res.status(400).json({ message: 'Email and password are required' });
    }

    const user =
        await sellerModel.findOne({ email }) ||
        await buyerModel.findOne({ email });

    if (!user) {
        return res.status(400).json({ message: 'Invalid email or password' });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
        return res.status(400).json({ message: 'Invalid email or password' });
    }

    if (!['buyer', 'seller', 'admin'].includes(user.role)) {
        return res.status(403).json({ message: 'Unauthorized role' });
    }

    const payload = { id: user._id, role: user.role };
    const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '1h' });

    res.status(200).json({ message: 'Login successful', token });
}); 

authRouter.get('/profile', isAuth, async (req, res) => {
    const userId = req.user.id;
    const role = req.user.role;

    if (role === 'admin') {
        return res.status(200).json({
            user: {
                id: userId,
                role: 'admin',
                name: 'Administrator',
                email: 'admin@forgottenbooks.com' 
            }
        });
    }

    let user;
    if (role === 'seller') {
        user = await sellerModel.findById(userId).select('-password');
    } else if (role === 'buyer') {
        user = await buyerModel.findById(userId).select('-password');
    }

    if (!user) {
        return res.status(404).json({ message: 'User not found' });
    }

    res.status(200).json({ user });
});

authRouter.get('/google', (req, res, next) => {
    const role = req.query.role;
    if (!role || !['buyer', 'seller'].includes(role)) {
        return res.status(400).json({ message: 'role query param must be "buyer" or "seller"' });
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
        const role = req.query.state || 'buyer';
        const { email, fullName } = req.user;

        const model = role === 'seller' ? sellerModel : buyerModel;

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
