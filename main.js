const express = require("express");
const connectToDb = require("./db/db");
const passport = require("./config/google.strategy");
const upload = require("./config/cloudinary.config");
const isAuth = require("./middlewares/isAuth.middleware");

const userRouter = require("./user/user.router");
const productRouter = require("./product/product.router");
const authRouter = require("./auth/auth.router");
const adminRouter = require("./admin/admin.router");
const stripeRouter = require("./stripe/stripe.router");
const matchRouter = require("./match/match.router");
const stripeWebhook = require("./stripe/stripe.webhook");

const app = express();

<<<<<<< HEAD
const allowedOrigins = [
  "http://localhost:5173",
  "http://localhost:5175",
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
=======
const allowedOrigins = ["http://localhost:5173"];

const corsOptions = {
  origin: function (origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error("Not allowed by CORS"));
    }
  },
  credentials: true,
};

// Use CORS
app.use(cors(corsOptions));
>>>>>>> 2506b12 (davaleba)

// JSON parser for all routes EXCEPT Stripe webhook
app.use((req, res, next) => {
  if (req.originalUrl === "/stripe/webhook") {
    next();
  } else {
    express.json()(req, res, next);
  }
});

app.use(passport.initialize());

// File upload
app.post("/upload", upload.single("image"), (req, res) => {
  res.json(req.file);
});

<<<<<<< HEAD
app.use("/auth", authRouter);
app.use("/buyers", isAuth, buyerRouter);
app.use("/sellers", isAuth, sellerRouter);
app.use("/products", isAuth, productRouter);
app.use("/admin", isAuth, adminRouter);
app.use("/stripe", stripeRouter);
=======
// Routes
app.use("/auth", authRouter);
app.use("/users", isAuth, userRouter);
app.use("/products", isAuth, productRouter);
app.use("/admin", isAuth, adminRouter);
app.use("/stripe", stripeRouter);
app.use("/match", matchRouter);

// Stripe webhook (needs raw body)
app.use("/stripe/webhook", stripeWebhook);
>>>>>>> 2506b12 (davaleba)

app.get("/", (req, res) => res.send("Hello World"));

// Connect DB and start server
connectToDb()
  .then(() =>
    app.listen(4000, () => console.log("🚀 Server running at http://localhost:4000"))
  )
  .catch((err) => console.error("DB connection failed:", err));
