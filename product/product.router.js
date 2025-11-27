const { Router } = require("express");
const { isValidObjectId } = require("mongoose");
const Product = require("../models/product.model");
const User = require("../models/user.model");
const allowToCreateTheProductOnlyIfSellerIdIsThere = require("../middlewares/allow-to-post-the-product-only-if-seller-id-is-there.middleware");

const productRouter = Router();

productRouter.post("/", allowToCreateTheProductOnlyIfSellerIdIsThere, async (req, res) => {
  try {
    const userId = req.user.id;

    if (!isValidObjectId(userId)) return res.status(400).json({ message: "Invalid user ID" });

    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: "User not found" });

    const { title, content } = req.body;

    const newProduct = await Product.create({
      title,
      content,
      user: userId,
    });

    res.status(201).json({ message: "Product created successfully", data: newProduct });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

productRouter.get("/", async (req, res) => {
  try {
    const products = await Product.find().populate("user", "name email");
    res.status(200).json(products);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

productRouter.get("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    if (!isValidObjectId(id)) return res.status(400).json({ message: "Invalid product ID" });

    const prod = await Product.findById(id).populate("user", "name email");
    if (!prod) return res.status(404).json({ message: "Product not found" });

    res.status(200).json(prod);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

productRouter.delete("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    if (!isValidObjectId(id)) return res.status(400).json({ message: "Invalid product ID" });

    const deleted = await Product.findByIdAndDelete(id);
    if (!deleted) return res.status(404).json({ message: "Product not found" });

    res.status(204).send();
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

productRouter.put("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    if (!isValidObjectId(id)) return res.status(400).json({ message: "Invalid product ID" });

    const updatedProduct = await Product.findByIdAndUpdate(id, req.body, { new: true });
    if (!updatedProduct) return res.status(404).json({ message: "Product not found" });

    res.status(200).json(updatedProduct);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = productRouter;
