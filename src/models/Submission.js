const mongoose = require("mongoose");

const submissionSchema = new mongoose.Schema(
  {
    taskId: { type: mongoose.Schema.Types.ObjectId, ref: "Task", required: true },
    taskTitle: { type: String, required: true },
    workerId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    workerName: { type: String, required: true },
    workerEmail: { type: String, required: true },
    workerPhoto: { type: String },
    buyerId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    payableAmount: { type: Number, required: true },
    submissionText: { type: String, required: true },
    status: { type: String, enum: ["pending", "approved", "rejected"], default: "pending" },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Submission", submissionSchema);
