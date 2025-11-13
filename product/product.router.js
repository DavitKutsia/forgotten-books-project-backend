const { Router } = require("express");
const product = require("../models/product.model");
const { isValidObjectId } = require("mongoose");
const User = require("../models/user.model");
const allowToCreateTheProductOnlyIfSellerIdIsThere = require("../middlewares/allow-to-post-the-product-only-if-seller-id-is-there.middleware");

const productRouter = Router();

productRouter.post("/", allowToCreateTheProductOnlyIfSellerIdIsThere, async (req, res) => {

    const userId = req.user.id; 

  if (!isValidObjectId(userId)) {
    return res.status(400).json({ message: "Invalid user ID" });
  }

  const user = await User.findById(userId);
  if (!user) {
    return res.status(404).json({ message: "User not found" });
  }

  const { title, content, price } = req.body || {};

  try {
    const newProduct = await product.create({
      title,
      content,
      price,
      user: userId,
    });

    res.status(201).json({ message: "Product created successfully", data: newProduct });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

productRouter.get("/", async (req, res) => {
    try {
        const products = await product.find().populate("user");
        res.status(200).json(products);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

productRouter.get("/:id", async (req, res) => {
    const { id } = req.params;
    
    if (!isValidObjectId(id)) {
        return res.status(400).json({ message: "Invalid product ID" });
    }

    try {
        const prod = await product.findById(id).populate("user");
        res.status(200).json(prod);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

productRouter.delete("/:id", async (req, res) => {
    const { id } = req.params;

    if (!isValidObjectId(id)) {
        return res.status(400).json({ message: "Invalid product ID" });
    }

    try {
        await product.findByIdAndDelete(id);
        res.status(204).send();
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

productRouter.put("/:id", async (req, res) => {
    const { id } = req.params;

    if (!isValidObjectId(id)) {
        return res.status(400).json({ message: "Invalid product ID" });
    }

    try {
        const updatedProduct = await product.findByIdAndUpdate(id, req.body, { new: true });
        res.status(200).json(updatedProduct);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

module.exports = productRouter;
