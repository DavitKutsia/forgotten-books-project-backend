const express = require("express");
const connectToDb = require("./db/db");
const passport = require("./config/google.strategy");
const upload = require("./config/cloudinary.config");
const isAuth = require("./middlewares/isAuth.middleware");
const cors = require("cors");

const userRouter = require("./user/user.router");
const productRouter = require("./product/product.router");
const authRouter = require("./auth/auth.router");
const adminRouter = require("./admin/admin.router");
const stripeRouter = require("./stripe/stripe.router");
const stripeWebhook = require("./stripe/stripe.webhook");
const matchRouter = require("./match/match.router");

const app = express();

const allowedOrigins = [
  "http://localhost:5173",
  "http://localhost:5175",
  "http://localhost:5176",
  "https://forgotten-books-project-frontend.vercel.app"
];

app.use("/stripe/webhook", stripeWebhook);

app.options("*", cors());

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error("Not allowed by CORS"));
      }
    },
    credentials: true,
  })
);

app.use((req, res, next) => {
  if (req.originalUrl === "/stripe/webhook") return next();
  express.json()(req, res, next);
});

app.use(passport.initialize());

app.post("/upload", upload.single("image"), (req, res) => {
  res.json(req.file);
});

app.use("/auth", authRouter);
app.use("/users", isAuth, userRouter);
app.use("/products", isAuth, productRouter);
app.use("/admin", isAuth, adminRouter);
app.use("/stripe", stripeRouter);
app.use("/match", matchRouter);

app.get("/", (req, res) => res.send("Hello World"));

connectToDb()
  .then(() =>
    app.listen(4000, () =>
      console.log("🚀 Server running at http://localhost:4000")
    )
  )
  .catch((err) => console.error("DB connection failed:", err));
