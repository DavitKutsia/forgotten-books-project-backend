const { Router } = require("express");
const stripe = require("../config/stripe.config");
const isAuth = require("../middlewares/isAuth.middleware");
const orderModel = require("../models/order.model");

const stripeRouter = Router();

stripeRouter.post("/buy", isAuth, async (req, res) => {
  try {
    const session = await stripe.checkout.sessions.create({
      line_items: [
        {
          price: "price_123",
          quantity: 1,
        },
      ],
      mode: "payment",
      success_url: `https://forgotten-books-project-frontend.vercel.app/success?token=${req.token}`,
      cancel_url: `https://forgotten-books-project-frontend.vercel.app/cancel?token=${req.token}`,
    });

    res.json({ url: session.url });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Stripe session failed" });
  }
});


stripeRouter.post("/checkout", isAuth, async (req, res) => {
  try {
    const { productName, amount, description } = req.body;

    if (!productName || !amount) {
      return res.status(400).json({ message: "Missing product info" });
    }

    // Build product_data safely
    const productData = {
      name: productName,
      images: ["https://example.com/product.png"], // optional
    };

    if (description && description.trim() !== "") {
      productData.description = description;
    }

    // Create Stripe checkout session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items: [
        {
          price_data: {
            currency: "usd",
            product_data: productData,
            unit_amount: amount * 100, // Stripe requires cents
          },
          quantity: 1,
        },
      ],
      payment_intent_data: {
        metadata: { userId: req.userId },
      },
      mode: "payment",
      success_url: `${process.env.FRONT_END_URL}/?success=true`,
      cancel_url: `${process.env.FRONT_END_URL}/?canceled=true`,
    });

    // Save order in DB
    await orderModel.create({
      sessionId: session.id,
      user: req.userId,
      amount,
      status: "PENDING",
    });

    res.json({ url: session.url });
  } catch (error) {
    console.error("Stripe /checkout error:", error);
    res.status(500).json({ message: "Stripe checkout failed" });
  }
});

module.exports = stripeRouter;
