const mongoose = require("mongoose");
const { Router } = require("express");
const seller = require("../models/seller.model");
const { isValidObjectId } = require("mongoose");
const product = require("../models/product.model"); 
const sellerSchema = require("../validations/seller.schema");


const sellerRouter = Router();

sellerRouter.get("/", async (req, res) => {
    const sellers = await seller.find();
    res.status(200).json(sellers);
});

sellerRouter.get("/:id", async (req, res) => {
    const { id } = req.params;
    if (!isValidObjectId(id)) {
        return res.status(400).json({ message: "Invalid seller ID" });
    }

    const seller = await seller.findById(id);
    if (!seller) {
        return res.status(404).json({ message: "Seller not found" });
    }
    res.status(200).json(seller);
});

sellerRouter.get("/:id/products", async (req, res) => {
    const { id } = req.params;
    if (!isValidObjectId(id)) {
        return res.status(400).json({ message: "Invalid seller ID" });
    }

    const seller = await seller.findById(id);
    if (!seller) {
        return res.status(404).json({ message: "Seller not found" });
    }
    
const products = await product.find({ seller: mongoose.Types.ObjectId(id) });

    res.status(200).json(products);
});

sellerRouter.delete("/:id", async (req, res) => {
    const { id } = req.params;
    if (!isValidObjectId(id)) {
        return res.status(400).json({ message: "Invalid seller ID" });
    }

    const seller = await seller.findByIdAndDelete(id);
    if (!seller) {
        return res.status(404).json({ message: "Seller not found" });
    }

    res.status(200).json({ message: "Seller deleted successfully" });
});

sellerRouter.post("/", async (req, res) => {
    const { error } = sellerSchema.validate(req.body || 0);
    if (error) {
        return res.status(400).json({ message: error.details[0].message });
    }

    const { name, email, password } = req.body;
    const newSeller = await seller.create({ name, email, password });
    res.status(201).json(newSeller);
});

sellerRouter.put("/:id", async (req, res) => {
    const { id } = req.params;
    if (!isValidObjectId(id)) {
        return res.status(400).json({ message: "Invalid seller ID" });
    }       

    const { error } = sellerSchema.validate(req.body || 0);
    if (error) {
        return res.status(400).json({ message: error.details[0].message });
    }   

    const { name, email, password } = req.body;
    const updatedSeller = await seller.findByIdAndUpdate(
        id,
        { name, email, password },
        { new: true }
    );
    if (!updatedSeller) {
        return res.status(404).json({ message: "Seller not found" });
    }
    res.status(200).json(updatedSeller);
});

module.exports = sellerRouter;
