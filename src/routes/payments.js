const express = require("express");
const router = express.Router();
const Payment = require("../models/Payment");
const User = require("../models/User");
const { protect, isBuyer, isAdmin } = require("../middleware/auth");

const PACKAGES = [
  { id: 1, dollars: 1, coins: 10, bonus: 0 },
  { id: 2, dollars: 9, coins: 100, bonus: 10 },
  { id: 3, dollars: 99, coins: 1000, bonus: 150 },
];

// POST /api/payments/create-payment-intent — Stripe
router.post("/create-payment-intent", protect, isBuyer, async (req, res) => {
  try {
    const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);
    const { packageId } = req.body;
    const pkg = PACKAGES.find(p => p.id === Number(packageId));
    if (!pkg) return res.status(400).json({ message: "Invalid package" });

    const paymentIntent = await stripe.paymentIntents.create({
      amount: pkg.dollars * 100,
      currency: "usd",
      metadata: { userId: req.user._id.toString(), packageId: pkg.id },
    });

    res.json({ clientSecret: paymentIntent.client_secret, pkg });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST /api/payments/confirm — called after successful Stripe payment
router.post("/confirm", protect, isBuyer, async (req, res) => {
  try {
    const { packageId, stripePaymentId } = req.body;
    const pkg = PACKAGES.find(p => p.id === Number(packageId));
    if (!pkg) return res.status(400).json({ message: "Invalid package" });

    const totalCoins = pkg.coins + pkg.bonus;

    const user = await User.findByIdAndUpdate(
      req.user._id,
      { $inc: { coins: totalCoins } },
      { new: true }
    );

    await Payment.create({
      userId: req.user._id,
      userName: req.user.name,
      userEmail: req.user.email,
      amount: pkg.dollars,
      coins: totalCoins,
      stripePaymentId,
    });

    res.json({ coins: user.coins, message: `+${totalCoins} coins added!` });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/payments/my — buyer: own payment history
router.get("/my", protect, isBuyer, async (req, res) => {
  try {
    const payments = await Payment.find({ userId: req.user._id }).sort({ createdAt: -1 });
    res.json(payments);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/payments/total — admin: total payments sum
router.get("/total", protect, isAdmin, async (req, res) => {
  try {
    const agg = await Payment.aggregate([{ $group: { _id: null, total: { $sum: "$amount" } } }]);
    res.json({ totalPayments: agg[0]?.total || 0 });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
