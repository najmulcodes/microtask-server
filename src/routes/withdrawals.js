const express = require("express");
const router = express.Router();
const Withdrawal = require("../models/Withdrawal");
const User = require("../models/User");
const Notification = require("../models/Notification");
const { protect, isWorker, isAdmin } = require("../middleware/auth");

const MIN_COINS = 200;

// POST /api/withdrawals — worker: request withdrawal
router.post("/", protect, isWorker, async (req, res) => {
  try {
    const { withdrawalCoin, paymentSystem, accountNumber } = req.body;
    const coins = Number(withdrawalCoin);

    if (coins < MIN_COINS) {
      return res.status(400).json({ message: `Minimum ${MIN_COINS} coins required` });
    }

    const worker = await User.findById(req.user._id);
    if (worker.coins < coins) {
      return res.status(400).json({ message: "Insufficient coins" });
    }

    // Deduct coins immediately
    worker.coins -= coins;
    await worker.save();

    const withdrawal = await Withdrawal.create({
      workerId: worker._id,
      workerName: worker.name,
      workerEmail: worker.email,
      withdrawalCoin: coins,
      withdrawalAmount: coins / 20,
      paymentSystem,
      accountNumber,
    });

    res.status(201).json({ withdrawal, coins: worker.coins });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/withdrawals/my — worker: own withdrawal history
router.get("/my", protect, isWorker, async (req, res) => {
  try {
    const withdrawals = await Withdrawal.find({ workerId: req.user._id }).sort({ createdAt: -1 });
    res.json(withdrawals);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/withdrawals — admin: all withdrawals
router.get("/", protect, isAdmin, async (req, res) => {
  try {
    const withdrawals = await Withdrawal.find().sort({ createdAt: -1 });
    res.json(withdrawals);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// PATCH /api/withdrawals/:id/approve — admin
router.patch("/:id/approve", protect, isAdmin, async (req, res) => {
  try {
    const w = await Withdrawal.findByIdAndUpdate(
      req.params.id,
      { status: "approved" },
      { new: true }
    );
    await Notification.create({
      recipientId: w.workerId,
      message: `Your withdrawal of ${w.withdrawalCoin} coins ($${w.withdrawalAmount.toFixed(2)}) via ${w.paymentSystem} was approved! ✅`,
    });
    res.json(w);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// PATCH /api/withdrawals/:id/reject — admin: reject & refund coins
router.patch("/:id/reject", protect, isAdmin, async (req, res) => {
  try {
    const w = await Withdrawal.findByIdAndUpdate(
      req.params.id,
      { status: "rejected" },
      { new: true }
    );
    // Refund coins
    await User.findByIdAndUpdate(w.workerId, { $inc: { coins: w.withdrawalCoin } });

    await Notification.create({
      recipientId: w.workerId,
      message: `Your withdrawal of ${w.withdrawalCoin} coins was rejected. Coins refunded.`,
    });
    res.json(w);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
