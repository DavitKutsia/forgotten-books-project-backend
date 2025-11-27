const express = require("express");
const stripe = require("../config/stripe.config");
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
      return res.status(400).send(`Webhook Error`);
    }

    try {
      switch (event.type) {
        case "customer.subscription.created":
        case "customer.subscription.updated": {
          const subscription = event.data.object;

          const user = await User.findOne({
            stripeCustomerId: subscription.customer,
          });

          if (user) {
            user.subscriptionActive = subscription.status === "active";
            user.stripeSubscriptionId = subscription.id;
            await user.save();
          }
          break;
        }

        case "customer.subscription.deleted": {
          const subscription = event.data.object;
          const user = await User.findOne({
            stripeCustomerId: subscription.customer,
          });

          if (user) {
            user.subscriptionActive = false;
            user.stripeSubscriptionId = null;
            await user.save();
          }
          break;
        }
      }

      res.json({ received: true });
    } catch (err) {
      res.status(500).send("Webhook failed");
    }
  }
);

module.exports = router;
