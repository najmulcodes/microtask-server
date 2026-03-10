const express = require("express");
const router = express.Router();
const Task = require("../models/Task");
const User = require("../models/User");
const { protect, isBuyer, isAdmin } = require("../middleware/auth");

// GET /api/tasks — worker: available open tasks (excluding own & already submitted)
router.get("/", protect, async (req, res) => {
  try {
    const Submission = require("../models/Submission");
    // Get task IDs this worker already submitted
    const submitted = await Submission.find({ workerId: req.user._id }).distinct("taskId");

    const tasks = await Task.find({
      status: "open",
      requiredWorkers: { $gt: 0 },
      buyerId: { $ne: req.user._id },
      _id: { $nin: submitted },
    }).sort({ createdAt: -1 });

    res.json(tasks);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/tasks/my — buyer: own tasks
router.get("/my", protect, isBuyer, async (req, res) => {
  try {
    const tasks = await Task.find({ buyerId: req.user._id }).sort({ createdAt: -1 });
    res.json(tasks);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/tasks/all — admin: all tasks
router.get("/all", protect, isAdmin, async (req, res) => {
  try {
    const tasks = await Task.find().sort({ createdAt: -1 });
    res.json(tasks);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/tasks/buyer-stats — buyer home stats
router.get("/buyer-stats", protect, isBuyer, async (req, res) => {
  try {
    const tasks = await Task.find({ buyerId: req.user._id });
    const totalTasks = tasks.length;
    const pendingTasks = tasks.reduce((sum, t) => sum + t.requiredWorkers, 0);
    const totalPaid = tasks.reduce((sum, t) => sum + t.payableAmount * (t.submissionsCount || 0), 0);
    res.json({ totalTasks, pendingTasks, totalPaid });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST /api/tasks — buyer: add task
router.post("/", protect, isBuyer, async (req, res) => {
  try {
    const { title, detail, requiredWorkers, payableAmount, completionDate, submissionInfo, imageUrl } = req.body;

    const cost = Number(requiredWorkers) * Number(payableAmount);
    const buyer = await User.findById(req.user._id);

    if (buyer.coins < cost) {
      return res.status(400).json({ message: `Insufficient coins. Need ${cost}, have ${buyer.coins}.` });
    }

    const task = await Task.create({
      title, detail,
      requiredWorkers: Number(requiredWorkers),
      payableAmount: Number(payableAmount),
      completionDate, submissionInfo,
      imageUrl: imageUrl || "",
      buyerId: buyer._id,
      buyerName: buyer.name,
      buyerEmail: buyer.email,
    });

    // Deduct coins
    buyer.coins -= cost;
    await buyer.save();

    res.status(201).json({ task, coins: buyer.coins });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// DELETE /api/tasks/:id — buyer/admin: delete task
router.delete("/:id", protect, async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);
    if (!task) return res.status(404).json({ message: "Task not found" });

    const isOwner = task.buyerId.toString() === req.user._id.toString();
    if (!isOwner && req.user.role !== "admin") {
      return res.status(403).json({ message: "Not authorized" });
    }

    // Refund buyer if owner deletes
    if (isOwner) {
      const refund = task.requiredWorkers * task.payableAmount;
      await User.findByIdAndUpdate(req.user._id, { $inc: { coins: refund } });
    }

    await Task.findByIdAndDelete(req.params.id);
    res.json({ message: "Task deleted" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
