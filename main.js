require('dotenv').config();
const express = require('express');
const cors = require('cors');
const connectToDb = require('./db/db');
const buyerRouter = require('./buyer/buyer.router');
const sellerRouter = require('./seller/seller.router');
const productRouter = require('./product/product.router');
const authRouter = require('./auth/auth.router');
const isAuth = require('./middlewares/isAuth.middleware');

const app = express();
app.use(cors());
app.use(express.json());

const upload = require('./config/cloudinary.config');
app.use('/upload', upload.single('image'), (req, res) => res.json(req.file));

app.use('/auth', authRouter);
app.use('/buyers',   isAuth, buyerRouter);
app.use('/sellers',  isAuth, sellerRouter);
app.use('/products', isAuth, productRouter);

app.get('/', (req, res) => res.send('Hello World'));

connectToDb();  

if (process.env.NODE_ENV !== 'production') {
  const PORT = process.env.PORT || 4000;
  app.listen(PORT, () => console.log(`🚀 Server running at http://localhost:${PORT}`));
}

module.exports = app;
