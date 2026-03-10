const jwt = require("jsonwebtoken");
const User = require("../models/User");

const protect = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ message: "No token provided" });
    }

    const token = authHeader.split(" ")[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id).select("-password");

    if (!user) return res.status(401).json({ message: "User not found" });

    req.user = user;
    next();
  } catch (err) {
    return res.status(401).json({ message: "Invalid or expired token" });
  }
};

const isAdmin = (req, res, next) => {
  if (req.user?.role !== "admin") {
    return res.status(403).json({ message: "Admin access required" });
  }
  next();
};

const isBuyer = (req, res, next) => {
  if (req.user?.role !== "buyer" && req.user?.role !== "admin") {
    return res.status(403).json({ message: "Buyer access required" });
  }
  next();
};

const isWorker = (req, res, next) => {
  if (req.user?.role !== "worker" && req.user?.role !== "admin") {
    return res.status(403).json({ message: "Worker access required" });
  }
  next();
};

module.exports = { protect, isAdmin, isBuyer, isWorker };
