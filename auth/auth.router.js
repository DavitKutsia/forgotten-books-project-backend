const { Router } = require('express');
const sellerModel = require('../models/seller.model');
const buyerModel = require('../models/buyer.model');
const sellerSchema = require('../validations/seller.schema');
const buyerSchema = require('../validations/buyer.schema');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const isAuth = require('../middlewares/isAuth.middleware');
require('dotenv').config();

const authRouter = Router();

authRouter.post('/register', async (req, res) => {
    const { role, name, email, password } = req.body || {};
    if (!role || !['seller', 'buyer'].includes(role)) {
        return res.status(400).json({ message: 'role must be "seller" or "buyer"' });
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
    await model.create({ name, email, password: hashedPassword });

    res.status(201).json({ message: `${role} registered successfully` });
});

authRouter.post('/login', async (req, res) => {
    const { email, password } = req.body || {};
    if (!email || !password) {
        return res.status(400).json({ message: 'Email and password are required' });
    }

    const user = await sellerModel.findOne({ email }) || await buyerModel.findOne({ email });
    if (!user) {
        return res.status(400).json({ message: 'Invalid email or password' });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
        return res.status(400).json({ message: 'Invalid email or password' });
    }

    const payload = { id: user._id, role: user.role };
    const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '1h' });

    res.status(200).json({ message: 'Login successful', token });
});

authRouter.get('/profile', isAuth, async (req, res) => {
    const userId = req.user.id;
    const role = req.user.role;

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

module.exports = authRouter;