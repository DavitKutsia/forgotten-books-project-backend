require("dotenv").config();
const express = require("express");
const http = require("http");
const cors = require("cors");
const jwt = require("jsonwebtoken");
const { Server } = require("socket.io");

const connectToDb = require("./db/db");
const passport = require("./config/google.strategy");

const userRouter = require("./user/user.router");
const productRouter = require("./product/product.router");
const authRouter = require("./auth/auth.router");
const adminRouter = require("./admin/admin.router");
const stripeRouter = require("./stripe/stripe.router");
const stripeWebhook = require("./stripe/stripe.webhook");
const matchRouter = require("./match/match.router");
const messageRouter = require("./message/message.router");

const MessageService = require("./message/message.service");

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: [
      "http://localhost:5173",
      "http://localhost:5174",
      "http://localhost:5175",
      "https://forgotten-books-project-frontend.vercel.app",
    ],
    methods: ["GET", "POST"],
    credentials: true,
  },
});

const userSocketMap = new Map(); // Map userId -> socketId

// Stripe webhook route
app.use("/stripe/webhook", stripeWebhook);

// Middleware
app.use(
  cors({
    origin: [
      "http://localhost:5173",
      "http://localhost:5174",
      "http://localhost:5175",
      "https://forgotten-books-project-frontend.vercel.app",
    ],
    credentials: true,
  })
);
app.use(express.json());
app.use(passport.initialize());

// REST routes
app.use("/auth", authRouter);
app.use("/users", userRouter);
app.use("/products", productRouter);
app.use("/admin", adminRouter);
app.use("/stripe", stripeRouter);
app.use("/match", matchRouter);
app.use("/messages", messageRouter);

app.get("/", (req, res) => res.send("API is running"));

// Socket.IO authentication middleware
io.use((socket, next) => {
  try {
    const token = socket.handshake.auth?.token;
    if (!token) return next(new Error("No token provided"));
    const actualToken = token.startsWith("Bearer ") ? token.slice(7) : token;
    const decoded = jwt.verify(actualToken, process.env.JWT_SECRET);
    socket.userId = decoded.id?.toString();
    if (!socket.userId) return next(new Error("Invalid token"));
    next();
  } catch (err) {
    next(new Error("Invalid token"));
  }
});

// Socket.IO events
io.on("connection", (socket) => {
  console.log(`User connected: ${socket.userId} (Socket: ${socket.id})`);
  userSocketMap.set(socket.userId, socket.id);

  // Join a conversation room
  socket.on("joinConversation", ({ conversationId }) => {
    if (!conversationId) return;
    socket.rooms.forEach((room) => {
      if (room !== socket.id) socket.leave(room);
    });
    socket.join(conversationId.toString());
    console.log(`User ${socket.userId} joined conversation ${conversationId}`);
  });

  // Send a message
  socket.on("sendMessage", async ({ conversationId, receiverId, content, productId }) => {
    if (!content) return;
    try {
      const result = await MessageService.sendMessage({
        senderId: socket.userId,
        receiverId,
        content,
        productId,
      });

      console.log("Message created and saved to DB:", result.message);
      
      const conversationRoom = result.conversationId?.toString();
      
      // Emit to all users in the conversation room (including sender)
      if (conversationRoom) {
        io.to(conversationRoom).emit("receiveMessage", result.message);
        console.log("Emitted to conversation room:", conversationRoom);
      }

      // Also try to emit directly to receiver if they're online (backup)
      const receiverSocketId = userSocketMap.get(receiverId.toString());
      if (receiverSocketId && receiverSocketId !== socket.id) {
        io.to(receiverSocketId).emit("receiveMessage", result.message);
        console.log("Emitted directly to receiver socket:", receiverSocketId);
      } else {
        console.log("Receiver not online - message saved to DB, will be fetched via polling");
      }
    } catch (err) {
      console.error("sendMessage error:", err);
      socket.emit("messageSendError", { error: err.message });
    }
  });

  socket.on("disconnect", () => {
    console.log(`User disconnected: ${socket.userId}`);
    userSocketMap.delete(socket.userId);
  });
});

app.get("/health", (_, res) => 
  res.status(200).send("ok")
);

// Start server first (must respond to health checks)
const PORT = process.env.PORT || 4000;

server.listen(PORT, "0.0.0.0", () => {
  console.log(`Server running on port ${PORT}`);
});

// Then connect DB (retry or exit)
connectToDb()
  .then(() => console.log("DB connected"))
  .catch((err) => {
    console.error("DB connection failed:", err);
    // optional: process.exit(1);
  });

