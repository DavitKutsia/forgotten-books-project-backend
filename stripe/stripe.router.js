const { Router } = require("express");
const stripe = require("../config/stripe.config");
const isAuth = require("../middlewares/isAuth.middleware");
const User = require("../models/user.model");

const router = Router();

router.post("/subscribe", isAuth, async (req, res) => {
  try {
    const priceId = process.env.STRIPE_PRICE_ID;
    let user = await User.findById(req.user.id);

    if (!user.stripeCustomerId) {
      const customer = await stripe.customers.create({
        email: user.email,
      });

      user.stripeCustomerId = customer.id;
      await user.save();
    }

    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      customer: user.stripeCustomerId,
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${process.env.FRONT_END_URL}/profile?success=true`,
      cancel_url: `${process.env.FRONT_END_URL}/profile?canceled=true`,
    });

    res.json({ url: session.url });
  } catch (err) {
    res.status(500).json({ message: "Subscription failed" });
  }
});

router.post("/cancel", isAuth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);

    if (!user.stripeSubscriptionId) {
      return res.status(400).json({ message: "No active subscription" });
    }

    await stripe.subscriptions.update(user.stripeSubscriptionId, {
      cancel_at_period_end: true,
    });

    user.subscriptionActive = false;
    await user.save();

    res.json({ message: "Subscription canceled" });
  } catch (err) {
    res.status(500).json({ message: "Cancel failed" });
  }
});

module.exports = router;
