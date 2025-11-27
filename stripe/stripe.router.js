const { Router } = require("express");
const stripe = require("../config/stripe.config");
const isAuth = require("../middlewares/isAuth.middleware");
const Order = require("../models/order.model");
const User = require("../models/user.model");

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
    if (!productName || !amount) return res.status(400).json({ message: "Missing product info" });

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items: [
        {
          price_data: {
            currency: "usd",
            product_data: { name: productName, description },
            unit_amount: Math.round(amount * 100),
          },
          quantity: 1,
        },
      ],
      payment_intent_data: { metadata: { userId: req.user.id } },
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

    await User.findByIdAndUpdate(req.user.id, { subscriptionActive: true });

    res.json({ url: session.url });
  } catch (err) {
    console.error("Stripe checkout error:", err);
    res.status(500).json({ message: "Checkout failed" });
  }
});



router.post("/cancel", isAuth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id)
    if (!user) return res.status(404).json({ message: "User not found" })

    user.subscriptionActive = false
    await user.save()

    res.json({ message: "Subscription cancelled", subscriptionActive: false })
  } catch {
    res.status(500).json({ message: "Failed to cancel subscription" })
  }
})

router.post("/activate", isAuth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ message: "User not found" });

    user.subscriptionActive = true;
    await user.save();

    res.json({ message: "Subscription activated", subscriptionActive: true });
  } catch {
    res.status(500).json({ message: "Failed to activate subscription" });
  }
});


module.exports = router;
