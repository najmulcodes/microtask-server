const mongoose = require("mongoose");

const withdrawalSchema = new mongoose.Schema(
  {
    workerId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    workerName: { type: String, required: true },
    workerEmail: { type: String, required: true },
    withdrawalCoin: { type: Number, required: true },
    withdrawalAmount: { type: Number, required: true },
    paymentSystem: { type: String, required: true },
    accountNumber: { type: String, required: true },
    status: { type: String, enum: ["pending", "approved", "rejected"], default: "pending" },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Withdrawal", withdrawalSchema);
