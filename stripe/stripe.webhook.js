
const express = require("express");
const stripe = require("../config/stripe.config");
const Order = require("../models/order.model");
const User = require("../models/user.model");

const router = express.Router();

router.post(
  "/",
  express.raw({ type: "application/json" }),
  async (req, res) => {
    const sig = req.headers["stripe-signature"];
    const secret = process.env.STRIPE_WEBHOOK_SECRET;

    let event;

    try {
      event = stripe.webhooks.constructEvent(req.body, sig, secret);
    } catch (err) {
      return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    try {
      switch (event.type) {
        case "checkout.session.completed": {
          const session = event.data.object;

          const user = await User.findOne({ email: session.customer_email });
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

        case "payment_intent.payment_failed": {
          const intent = event.data.object;
          const order = await Order.findOne({ sessionId: intent.id });
          if (order) {
            order.status = "REJECT";
            await order.save();
          }
          break;
        }

        case "payment_intent.processing": {
          const intent = event.data.object;
          const order = await Order.findOne({ sessionId: intent.id });
          if (order) {
            order.status = "PENDING";
            await order.save();
          }
          break;
        }

        default:
          break;
      }

      res.status(200).json({ received: true });
    } catch (err) {
      res.status(500).send("Webhook handler failed");
    }
  }
);

module.exports = router;
