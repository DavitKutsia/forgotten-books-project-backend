const express = require("express");
const connectToDb = require("./db/db");
const cors = require("cors");
const passport = require("./config/google.strategy");
const upload = require("./config/cloudinary.config");

const buyerRouter = require("./buyer/buyer.router");
const sellerRouter = require("./seller/seller.router");
const productRouter = require("./product/product.router");
const authRouter = require("./auth/auth.router");
const adminRouter = require("./admin/admin.router");
const stripeRouter = require("./stripe/stripe.router");

const app = express();

const corsOptions = {
  origin: function (origin, callback) {
    const allowedOrigins = [
      "http://localhost:5173",
      "https://forgotten-books-project-frontend.vercel.app",
    ];

    if (!origin) return callback(null, true);

    if (allowedOrigins.indexOf(origin) === -1) {
      const msg = "The CORS policy for this site does not allow access from the specified Origin.";
      return callback(new Error(msg), false);
    }
    return callback(null, true);
  },
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
  credentials: true, 
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
