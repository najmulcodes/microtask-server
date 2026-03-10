const mongoose = require("mongoose");

const taskSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    detail: { type: String, required: true },
    requiredWorkers: { type: Number, required: true, min: 1 },
    payableAmount: { type: Number, required: true, min: 1 },
    completionDate: { type: String, required: true },
    submissionInfo: { type: String, required: true },
    imageUrl: { type: String, default: "" },
    buyerId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    buyerName: { type: String, required: true },
    buyerEmail: { type: String, required: true },
    status: { type: String, enum: ["open", "closed"], default: "open" },
    submissionsCount: { type: Number, default: 0 },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Task", taskSchema);
