const { Router } = require("express");
const { v4: uuidv4 } = require("uuid");
const Match = require("../models/match.model");
const Product = require("../models/product.model");
const User = require("../models/user.model");
const isAuth = require("../middlewares/isAuth.middleware");

const matchRouter = Router();

matchRouter.post("/:productId", isAuth, async (req, res) => {
  try {
    const { productId } = req.params;
    const matcherUserId = req.user.id;

    const existing = await Match.findOne({ productId, matcherUserId });
    if (existing) {
      return res.status(400).json({ message: "You already liked this product." });
    }

    const product = await Product.findById(productId);
    if (!product) return res.status(404).json({ message: "Product not found." });

    const match = await Match.create({
      matchId: uuidv4(),
      productId,
      matcherUserId,
    });

    res.status(201).json({
      message: "Match created successfully!",
      matchId: match.matchId,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

matchRouter.get("/:productId", isAuth, async (req, res) => {
  try {
    const { productId } = req.params;
    const userId = req.user.id;

    const product = await Product.findById(productId);
    if (!product) return res.status(404).json({ message: "Product not found." });
    if (String(product.ownerId) !== String(userId)) {
      return res.status(403).json({ message: "Not your product." });
    }

    const matches = await Match.find({ productId })
      .populate("matcherUserId", "username name email");

    const user = await User.findById(userId);

    if (!user.subscriptionActive) {
      return res.json({
        count: matches.length,
        message: "Upgrade your subscription to see who matched with you.",
      });
    }

    res.json({
      count: matches.length,
      matches: matches.map((m) => ({
        matchId: m.matchId,
        matcher: m.matcherUserId,
        createdAt: m.createdAt,
        respondedByOwner: m.respondedByOwner,
      })),
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

matchRouter.get("/all", isAuth, async (req, res) => {
  try {
    const userId = req.user.id;

    const matches = await Match.find()
      .populate({ path: "matcherUserId", select: "name username email" })
      .populate({ path: "productId", select: "title ownerId" });

    const userMatches = matches.filter(
      (m) => String(m.productId.ownerId) === String(userId)
    );

    res.json(userMatches);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = matchRouter;

