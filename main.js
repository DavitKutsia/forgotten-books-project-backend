const express = require("express");
const connectToDb = require("./db/db");
const cors = require("cors");
const passport = require("./config/google.strategy");
const upload = require("./config/cloudinary.config");
const isAuth = require("./middlewares/isAuth.middleware");

const buyerRouter = require("./buyer/buyer.router");
const sellerRouter = require("./seller/seller.router");
const productRouter = require("./product/product.router");
const authRouter = require("./auth/auth.router");
const adminRouter = require("./admin/admin.router");
const stripeRouter = require("./stripe/stripe.router");

const app = express();

const allowedOrigins = ["http://localhost:5173"]; // your frontend URL

const corsOptions = {
  origin: function (origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error("Not allowed by CORS"));
    }
  },
  credentials: true, // if you send cookies/auth headers
};

app.use(cors(corsOptions));

app.use(express.json());
app.use(passport.initialize());

app.post("/upload", upload.single("image"), (req, res) => {
  res.json(req.file);
});
 
app.use("/auth", authRouter);

app.use("/buyers", isAuth, buyerRouter);
app.use("/sellers", isAuth, sellerRouter);
app.use("/products", isAuth, productRouter);
app.use("/admin", isAuth, adminRouter);
app.use('/stripe', stripeRouter);

app.get("/", (req, res) => {
  res.send("Hello World");
});

connectToDb()
  .then(() =>
    app.listen(4000, () =>
      console.log("🚀 Server running at http://localhost:4000")
    )
  )
  .catch((err) => console.error("DB connection failed:", err));
