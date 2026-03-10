const express = require("express");
const router = express.Router();
const User = require("../models/User");
const { protect, isAdmin } = require("../middleware/auth");

// GET /api/users — admin: all users
router.get("/", protect, isAdmin, async (req, res) => {
  try {
    const users = await User.find({ _id: { $ne: req.user._id } }).select("-password");
    res.json(users);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/users/stats — admin stats
router.get("/stats", protect, isAdmin, async (req, res) => {
  try {
    const workers = await User.countDocuments({ role: "worker" });
    const buyers = await User.countDocuments({ role: "buyer" });
    const coinsAgg = await User.aggregate([{ $group: { _id: null, total: { $sum: "$coins" } } }]);
    const totalCoins = coinsAgg[0]?.total || 0;
    res.json({ workers, buyers, totalCoins });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// PATCH /api/users/:id/role — admin: change role
router.patch("/:id/role", protect, isAdmin, async (req, res) => {
  try {
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { role: req.body.role },
      { new: true }
    );
    res.json(user);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// DELETE /api/users/:id — admin: remove user
router.delete("/:id", protect, isAdmin, async (req, res) => {
  try {
    await User.findByIdAndDelete(req.params.id);
    res.json({ message: "User deleted" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
