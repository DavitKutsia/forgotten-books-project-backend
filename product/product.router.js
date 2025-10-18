const { Router } = require("express");
const product = require("../models/product.model");
const { isValidObjectId } = require("mongoose");
const Seller = require("../models/seller.model");
const allowToCreateTheProductOnlyIfSellerIdIsThere = require("../middlewares/allow-to-post-the-product-only-if-seller-id-is-there.middleware");

const productRouter = Router();

productRouter.post("/", isAuth, allowToCreateTheProductOnlyIfSellerIdIsThere, async (req, res) => {

    const sellerId = req.user.id; 

  if (!isValidObjectId(sellerId)) {
    return res.status(400).json({ message: "Invalid seller ID" });
  }

  const seller = await Seller.findById(sellerId);
  if (!seller) {
    return res.status(404).json({ message: "Seller not found" });
  }

  const { title, content, price } = req.body || {};

  try {
    const newProduct = await product.create({
      title,
      content,
      price,
      seller: sellerId,
    });

    res.status(201).json({ message: "Product created successfully", data: newProduct });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

productRouter.get("/", async (req, res) => {
    try {
        const products = await product.find().populate("seller");
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
        const prod = await product.findById(id).populate("seller");
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
