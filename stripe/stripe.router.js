const { Router } = require("express");
const stripe = require("../config/stripe.config");
const isAuth = require("../middlewares/isAuth.middleware");
const orderModel = require("../models/order.model");

const stripeRouter = Router();

// Example static product purchase (for testing)
stripeRouter.post("/buy", async (req, res) => {
  try {
    const session = await stripe.checkout.sessions.create({
      line_items: [
        {
          price: "price_1Rb4qwEWaHsE9wj75fpgOUsx",
          quantity: 1,
        },
      ],
      mode: "payment",
      success_url: `${process.env.FRONT_END_URL}/?success=true`,
      cancel_url: `${process.env.FRONT_END_URL}/?canceled=true`,
    });

    res.json({ url: session.url });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Stripe session creation failed" });
  }
});

stripeRouter.post("/checkout", isAuth, async (req, res) => {
  try {
    const { productName, amount, description } = req.body;

    const session = await stripe.checkout.sessions.create({
      line_items: [
        {
          price_data: {
            currency: "usd",
            product_data: {
              name: productName,
              description,
              images: ["https://example.com/hoodie.png"],
            },
            unit_amount: amount * 100, 
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

    await orderModel.create({
      amount,
      user: req.userId,
      sessionId: session.id,
      status: "pending",
    });

    res.json({ url: session.url });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Stripe checkout failed" });
  }
});

module.exports = stripeRouter;
