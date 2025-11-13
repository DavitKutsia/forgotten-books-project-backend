const mongoose = require("mongoose");
const { Router } = require("express");
const user = require("../models/user.model");
const { isValidObjectId } = require("mongoose");
const product = require("../models/product.model"); 
const userSchema = require("../validations/user.schema");


const userRouter = Router();

userRouter.get("/", async (req, res) => {
    const users = await user.find();
    res.status(200).json(users);
});

userRouter.get("/:id", async (req, res) => {
    const { id } = req.params;
    if (!isValidObjectId(id)) {
        return res.status(400).json({ message: "Invalid user ID" });
    }

    const userDoc = await user.findById(id);
    if (!userDoc) {
        return res.status(404).json({ message: "User not found" });
    }
    res.status(200).json(userDoc);
});

userRouter.get("/:id/products", async (req, res) => {
    const { id } = req.params;
    if (!isValidObjectId(id)) {
        return res.status(400).json({ message: "Invalid user ID" });
    }

const userDoc = await user.findById(id);
    if (!userDoc) {
      return res.status(404).json({ message: "User not found" });
    }
    
   const products = await product.find({ user: id });

    res.status(200).json(products);
});

userRouter.delete("/:id", async (req, res) => {
    const { id } = req.params;
    if (!isValidObjectId(id)) {
        return res.status(400).json({ message: "Invalid user ID" });
    }

    const userDoc = await user.findByIdAndDelete(id);
    if (!userDoc) {
        return res.status(404).json({ message: "User not found" });
    }

    res.status(200).json({ message: "User deleted successfully" });
});

userRouter.post("/", async (req, res) => {
    const { error } = userSchema.validate(req.body || 0);
    if (error) {
        return res.status(400).json({ message: error.details[0].message });
    }

    const { name, email, password } = req.body;
    const newUser = await user.create({ name, email, password });
    res.status(201).json(newUser);
});

userRouter.put("/:id", async (req, res) => {
    const { id } = req.params;
    if (!isValidObjectId(id)) {
        return res.status(400).json({ message: "Invalid user ID" });
    }       

    const { error } = userSchema.validate(req.body || 0);
    if (error) {
        return res.status(400).json({ message: error.details[0].message });
    }   

    const { name, email, password } = req.body;
    const updatedUser = await user.findByIdAndUpdate(
        id,
        { name, email, password },
        { new: true }
    );
    if (!updatedUser) {
        return res.status(404).json({ message: "User not found" });
    }
    res.status(200).json(updatedUser);
});

module.exports = userRouter;
