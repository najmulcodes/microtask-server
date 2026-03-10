const express = require("express");
const router = express.Router();
const Submission = require("../models/Submission");
const Task = require("../models/Task");
const User = require("../models/User");
const Notification = require("../models/Notification");
const { protect, isWorker, isBuyer } = require("../middleware/auth");

// POST /api/submissions — worker: submit work
router.post("/", protect, isWorker, async (req, res) => {
  try {
    const { taskId, submissionText } = req.body;
    const task = await Task.findById(taskId);
    if (!task) return res.status(404).json({ message: "Task not found" });
    if (task.requiredWorkers <= 0) return res.status(400).json({ message: "Task is full" });

    const already = await Submission.findOne({ taskId, workerId: req.user._id });
    if (already) return res.status(409).json({ message: "Already submitted for this task" });

    const submission = await Submission.create({
      taskId,
      taskTitle: task.title,
      workerId: req.user._id,
      workerName: req.user.name,
      workerEmail: req.user.email,
      workerPhoto: req.user.photoURL,
      buyerId: task.buyerId,
      payableAmount: task.payableAmount,
      submissionText,
    });

    await Task.findByIdAndUpdate(taskId, { $inc: { submissionsCount: 1 } });

    res.status(201).json(submission);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/submissions/my — worker: own submissions
router.get("/my", protect, isWorker, async (req, res) => {
  try {
    const submissions = await Submission.find({ workerId: req.user._id }).sort({ createdAt: -1 });
    res.json(submissions);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/submissions/worker-stats
router.get("/worker-stats", protect, isWorker, async (req, res) => {
  try {
    const subs = await Submission.find({ workerId: req.user._id });
    const total = subs.length;
    const pending = subs.filter(s => s.status === "pending").length;
    const earned = subs.filter(s => s.status === "approved").reduce((sum, s) => sum + s.payableAmount, 0);
    res.json({ total, pending, earned });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/submissions/task/:taskId — buyer: submissions for a task
router.get("/task/:taskId", protect, isBuyer, async (req, res) => {
  try {
    const submissions = await Submission.find({
      taskId: req.params.taskId,
      status: "pending",
    });
    res.json(submissions);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// PATCH /api/submissions/:id/approve — buyer: approve
router.patch("/:id/approve", protect, isBuyer, async (req, res) => {
  try {
    const sub = await Submission.findById(req.params.id);
    if (!sub) return res.status(404).json({ message: "Submission not found" });

    // Pay worker
    await User.findByIdAndUpdate(sub.workerId, { $inc: { coins: sub.payableAmount } });

    // Update submission
    sub.status = "approved";
    await sub.save();

    // Decrement task worker slots
    await Task.findByIdAndUpdate(sub.taskId, { $inc: { requiredWorkers: -1 } });

    // Notify worker
    await Notification.create({
      recipientId: sub.workerId,
      message: `Your submission for "${sub.taskTitle}" was approved! +${sub.payableAmount} coins 🎉`,
    });

    res.json({ message: "Approved", submission: sub });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// PATCH /api/submissions/:id/reject — buyer: reject
router.patch("/:id/reject", protect, isBuyer, async (req, res) => {
  try {
    const sub = await Submission.findById(req.params.id);
    if (!sub) return res.status(404).json({ message: "Submission not found" });

    sub.status = "rejected";
    await sub.save();

    await Notification.create({
      recipientId: sub.workerId,
      message: `Your submission for "${sub.taskTitle}" was rejected.`,
    });

    res.json({ message: "Rejected" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
