const { Router } = require("express");
const { v4: uuidv4 } = require("uuid");
const Match = require("../models/match.model");
const Product = require("../models/product.model");
const User = require("../models/user.model");
const isAuth = require("../middlewares/isAuth.middleware");

const matchRouter = Router();

matchRouter.get("/all", isAuth, async (req, res) => {
  try {
    const userId = req.user?.id || req.userId;
    if (!userId) return res.status(401).json({ message: "Unauthorized" });

    const matches = await Match.find()
      .populate({ path: "matcherUserId", select: "name username email" })
      .populate({ path: "productId", select: "title user" })
      .populate({ path: "matchedProduct", select: "title content description price tags user" });

    const userMatches = matches.filter(
      (m) => m.productId && String(m.productId.user) === String(userId)
    );

    res.json(userMatches);
  } catch (err) {
    console.error("MATCH /all error:", err);
    res.status(500).json({ message: err.message });
  }
});

matchRouter.get("/:productId", isAuth, async (req, res) => {
  try {
    const { productId } = req.params;
    const userId = req.user.id;

    const product = await Product.findById(productId);
    if (!product)
      return res.status(404).json({ message: "Product not found." });

    if (String(product.user) !== String(userId)) {
      return res.status(403).json({ message: "Not your product." });
    }

    const matches = await Match.find({ productId })
      .populate("matcherUserId", "username name email")
      .populate("matchedProduct");

    const user = await User.findById(userId);

    if (!user.subscriptionActive) {
      return res.json({
        count: matches.length,
        message: "Upgrade your subscription to see who matched with you.",
      });
    }

    // Check for mutual matches
    const enrichedMatches = await Promise.all(
      matches.map(async (match) => {
        // Check if you've also matched back with their product
        const mutualMatch = await Match.findOne({
          matcherUserId: userId,
          productId: match.matchedProduct?._id
        });

        return {
          matchId: match.matchId,
          matcher: match.matcherUserId,
          matchedProduct: match.matchedProduct,
          createdAt: match.createdAt,
          respondedByOwner: match.respondedByOwner || !!mutualMatch,
          isMutual: !!mutualMatch
        };
      })
    );

    res.json({
      count: enrichedMatches.length,
      matches: enrichedMatches
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: err.message });
  }
});

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

    // Get the matcher's product
    const matcherProduct = await Product.findOne({ user: matcherUserId });
    if (!matcherProduct) {
      return res.status(400).json({ message: "You must have a product to match with others." });
    }

    const match = await Match.create({
      matchId: uuidv4(),
      productId,
      matcherUserId,
      matchedProduct: matcherProduct._id
    });

    res.status(201).json({
      message: "Match created successfully!",
      matchId: match.matchId,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: err.message });
  }
});

matchRouter.get("/user/matches", isAuth, async (req, res) => {
  try {
    const userId = req.user.id;

    const matches = await Match.find({ matcherUserId: userId }).select("productId matcherUserId createdAt");

    res.json(matches);
  } catch (err) {
    console.error("MATCH /user/matches error:", err);
    res.status(500).json({ message: err.message });
  }
});

module.exports = matchRouter;