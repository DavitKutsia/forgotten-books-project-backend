const { Router } = require("express");
const Buyer = require("../models/buyer.model");
const { isValidObjectId } = require("mongoose");
const product = require("../models/product.model"); 
const buyerSchema = require("../validations/buyer.schema");

const buyerRouter = Router();

buyerRouter.get("/", async (req, res) => {
    const buyers = await Buyer.find();
    res.status(200).json(buyers);
});

buyerRouter.get("/:id", async (req, res) => {
    const { id } = req.params;
    if (!isValidObjectId(id)) {
        return res.status(400).json({ message: "Invalid buyer ID" });
    }

    const buyer = await Buyer.findById(id);
    if (!buyer) {
        return res.status(404).json({ message: "Buyer not found" });
    }
    res.status(200).json(buyer);
});

buyerRouter.get("/:id/products", async (req, res) => {
    const { id } = req.params;
    if (!isValidObjectId(id)) {
        return res.status(400).json({ message: "Invalid buyer ID" });
    }
    const buyer = await Buyer.findById(id);
    if (!buyer) {
        return res.status(404).json({ message: "Buyer not found" });
    }
    const products = await product.find({ buyer: id });
    res.status(200).json(products);
});

buyerRouter.delete("/:id", async (req, res) => {
    const { id } = req.params;  
    if (!isValidObjectId(id)) {
        return res.status(400).json({ message: "Invalid buyer ID" });
    }

    const buyer = await Buyer.findByIdAndDelete(id);
    if (!buyer) {
        return res.status(404).json({ message: "Buyer not found" });
    }
    res.status(200).json({ message: "Buyer deleted successfully" });
});

buyerRouter.post("/", async (req, res) => {
    const { error } = buyerSchema.validate(req.body || 0);
    if (error) {
        return res.status(400).json({ message: error.details[0].message });
    }
    const { name, email, password } = req.body;
    const newBuyer = await Buyer.create({ name, email, password });
    res.status(201).json(newBuyer);
});

buyerRouter.put("/:id", async (req, res) => {
    const { id } = req.params;
    if (!isValidObjectId(id)) {
        return res.status(400).json({ message: "Invalid buyer ID" });
    }

    const { error } = buyerSchema.validate(req.body || 0);
    if (error) {
        return res.status(400).json({ message: error.details[0].message });
    }   

    const { name, email, password } = req.body;
    const updatedBuyer = await Buyer.findByIdAndUpdate(
        id,
        { name, email, password },
        { new: true }
    );
    if (!updatedBuyer) {
        return res.status(404).json({ message: "Buyer not found" });
    }
    res.status(200).json(updatedBuyer);
});

module.exports = buyerRouter;