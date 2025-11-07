const express = require("express");
const connectToDb = require("./db/db");
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

const allowedOrigins = [
  "http://localhost:5173",
  "https://forgotten-books-project-frontend.vercel.app"
];

app.use((req, res, next) => {
  const origin = req.headers.origin;
  if (allowedOrigins.includes(origin)) {
    res.setHeader("Access-Control-Allow-Origin", origin);
  }

  res.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
  res.setHeader(
    "Access-Control-Allow-Headers",
    "Content-Type, Authorization, X-Requested-With"
  );
  res.setHeader("Access-Control-Allow-Credentials", "true");

  if (req.method === "OPTIONS") {
    return res.sendStatus(200); 
  }

  next();
});

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
app.use("/stripe", stripeRouter);

app.get("/", (req, res) => res.send("Hello World"));

connectToDb()
  .then(() =>
    app.listen(4000, () => console.log("🚀 Server running at http://localhost:4000"))
  )
  .catch((err) => console.error("DB connection failed:", err));
