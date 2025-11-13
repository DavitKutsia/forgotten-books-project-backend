
const { Router } = require("express");
const stripe = require("../config/stripe.config");
const isAuth = require("../middlewares/isAuth.middleware");
const Order = require("../models/order.model");
const User = require("../models/user.model");
const express = require("express");

const stripeRouter = Router();

stripeRouter.post("/buy", isAuth, async (req, res) => {
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
    console.error(err);
    res.status(500).json({ message: "Stripe session creation failed" });
  }
});

stripeRouter.post("/checkout", isAuth, async (req, res) => {
  try {
    const { productName, amount, description } = req.body;

    if (!productName || !amount) {
      return res.status(400).json({ message: "Missing product info" });
    }

    const productData = {
      name: productName,
      images: ["https://example.com/product.png"],
    };
    if (description?.trim() !== "") productData.description = description;

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
    console.error(err);
    res.status(500).json({ message: "Stripe checkout failed" });
  }
});

stripeRouter.post(
  "/webhook",
  express.raw({ type: "application/json" }),
  async (req, res) => {
    const sig = req.headers["stripe-signature"];
    const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;

    let event;
    try {
      event = stripe.webhooks.constructEvent(req.body, sig, endpointSecret);
    } catch (err) {
      console.error(err.message);
      return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    try {
      switch (event.type) {
        case "checkout.session.completed": {
          const session = event.data.object;
          const email = session.customer_email;

          const user = await User.findOne({ email });
          if (user) {
            user.subscriptionActive = true;
            await user.save();
          }

          const order = await Order.findOne({ sessionId: session.id });
          if (order) {
            order.status = "SUCCESS";
            await order.save();
          }
          break;
        }

        case "payment_intent.processing": {
          const paymentIntent = event.data.object;
          const order = await Order.findOne({ sessionId: paymentIntent.id });
          if (order) {
            order.status = "PENDING";
            await order.save();
          }
          break;
        }

        case "payment_intent.payment_failed": {
          const paymentIntent = event.data.object;
          const order = await Order.findOne({ sessionId: paymentIntent.id });
          if (order) {
            order.status = "REJECT";
            await order.save();
          }
          break;
        }

        default:
          console.log(event.type);
      }

      res.status(200).json({ received: true });
    } catch (err) {
      console.error(err);
      res.status(500).send("Webhook handler failed");
    }
  }
);

module.exports = stripeRouter;
