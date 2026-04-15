const { Router } = require("express");
const { isValidObjectId } = require("mongoose");
const User = require("../models/user.model");
const Product = require("../models/product.model");
const {
  createUserSchema,
  updateUserSchema,
} = require("../validations/user.schema");

const userRouter = Router();

userRouter.get("/", async (req, res) => {
  try {
    const users = await User.find();
    res.status(200).json(users);
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
});

userRouter.get("/:id", async (req, res) => {
  try {
    const { id } = req.params;

    if (!isValidObjectId(id)) {
      return res.status(400).json({ message: "Invalid user ID" });
    }

    const userDoc = await User.findById(id);
    if (!userDoc) {
      return res.status(404).json({ message: "User not found" });
    }

    res.status(200).json(userDoc);
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
});

userRouter.get("/:id/products", async (req, res) => {
  try {
    const { id } = req.params;

    if (!isValidObjectId(id)) {
      return res.status(400).json({ message: "Invalid user ID" });
    }

    const userDoc = await User.findById(id);
    if (!userDoc) {
      return res.status(404).json({ message: "User not found" });
    }

    const products = await Product.find({ user: id });
    res.status(200).json(products);
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
});

userRouter.post("/", async (req, res) => {
  try {
    const { error } = createUserSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ message: error.details[0].message });
    }

    const { name, email, password, role, subscriptionActive } = req.body;

    const newUser = await User.create({
      name,
      email,
      password,
      role,
      subscriptionActive,
    });

    res.status(201).json(newUser);
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
});

userRouter.put("/:id", async (req, res) => {
  try {
    const { id } = req.params;

    if (!isValidObjectId(id)) {
      return res.status(400).json({ message: "Invalid user ID" });
    }

    const { error } = updateUserSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ message: error.details[0].message });
    }

    const updatedUser = await User.findByIdAndUpdate(
      id,
      req.body,
      {
        new: true,
        runValidators: true,
      }
    );

    if (!updatedUser) {
      return res.status(404).json({ message: "User not found" });
    }

    res.status(200).json(updatedUser);
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
});

userRouter.delete("/:id", async (req, res) => {
  try {
    const { id } = req.params;

    if (!isValidObjectId(id)) {
      return res.status(400).json({ message: "Invalid user ID" });
    }

    const userDoc = await User.findByIdAndDelete(id);
    if (!userDoc) {
      return res.status(404).json({ message: "User not found" });
    }

    res.status(200).json({ message: "User deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = userRouter;
