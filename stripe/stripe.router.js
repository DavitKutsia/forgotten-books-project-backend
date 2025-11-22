const { Router } = require("express");
const stripe = require("../config/stripe.config");
const isAuth = require("../middlewares/isAuth.middleware");
const Order = require("../models/order.model");

const router = Router();

router.post("/buy", isAuth, async (req, res) => {
  try {
    const priceId = "price_123";

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      mode: "payment",
      customer_email: req.user.email,
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      success_url: `${process.env.FRONT_END_URL}/success`,
      cancel_url: `${process.env.FRONT_END_URL}/cancel`,
    });

    await Order.create({
      sessionId: session.id,
      user: req.user.id,
      amount: 0,
      status: "PENDING",
    });

    res.json({ url: session.url });
  } catch (err) {
    res.status(500).json({ message: "Stripe session failed" });
  }
});

router.post("/checkout", isAuth, async (req, res) => {
  try {
    const { productName, amount, description } = req.body;

    if (!productName || !amount) {
      return res.status(400).json({ message: "Missing product info" });
    }

    const productData = {
      name: productName,
      images: ["https://example.com/product.png"],
    };

    if (description?.trim()) productData.description = description;

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items: [
        {
          price_data: {
            currency: "usd",
            product_data: productData,
            unit_amount: amount * 100,
          },
          quantity: 1,
        },
      ],
      payment_intent_data: {
        metadata: { userId: req.user.id },
      },
      mode: "payment",
      success_url: `${process.env.FRONT_END_URL}/?success=true`,
      cancel_url: `${process.env.FRONT_END_URL}/?canceled=true`,
    });

    await Order.create({
      sessionId: session.id,
      user: req.user.id,
      amount,
      status: "PENDING",
    });

    res.json({ url: session.url });
  } catch (err) {
    res.status(500).json({ message: "Checkout failed" });
  }
});

module.exports = router;
