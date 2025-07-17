const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const passport = require("passport");
const authMiddleware = require("../middlewares/authMiddleware");
const fs = require('fs');
const path = require('path');
const User = require("../models/User");
const Note = require("../models/Note");
const Review = require("../models/Review");
const Admin = require('../models/Admin');

const router = express.Router();
async function ensureAdminExists() {
  const admin = await Admin.findOne({ username: 'admin' });
  if (!admin) {
    const hash = await bcrypt.hash(process.env.ADMIN_PASSWORD || 'admin123', 10);
    await Admin.create({ username: 'admin', passwordHash: hash });
    console.log('Admin user created with default password.');
  }
}
ensureAdminExists();

router.post("/signup", async (req, res) => {
  try {
    console.log("Signup request body:", req.body);
    let { username, email, password } = req.body;

    if (!username || !email || !password) {
      console.log("Missing fields:", {
        username: !!username,
        email: !!email,
        password: !!password,
      });
      return res.status(400).json({ message: "All fields are required" });
    }

    username = username.trim();
    email = email.trim().toLowerCase();

    console.log("Checking for existing user with:", { username, email });
    const existingUser = await User.findOne({ $or: [{ email }, { username }] });
    if (existingUser) {
      console.log("User already exists:", existingUser.email);
      return res
        .status(400)
        .json({ message: "Email or username already in use" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = new User({ username, email, password: hashedPassword });
    await newUser.save();

    const token = jwt.sign({ userId: newUser._id }, process.env.JWT_SECRET, {
      expiresIn: "1d",
    });

    console.log("User created successfully:", newUser.email);
    res.status(201).json({
      token,
      message: "User registered successfully",
      user: {
        id: newUser._id,
        username: newUser.username,
        email: newUser.email,
      },
    });
  } catch (err) {
    console.error("Signup Error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password)
      return res
        .status(400)
        .json({ message: "Email and password are required" });

    const user = await User.findOne({ email: email.trim().toLowerCase() });
    if (!user)
      return res.status(401).json({ message: "Invalid email or password" });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch)
      return res.status(401).json({ message: "Invalid email or password" });

    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, {
      expiresIn: "1d",
    });

    res.status(200).json({
      token,
      message: "Login successful",
      user: { id: user._id, username: user.username, email: user.email },
    });
  } catch (err) {
    console.error("Login Error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

router.get(
  "/google-signup",
  passport.authenticate("google", {
    scope: ["profile", "email"],
    state: "signup",
  })
);
router.get(
  "/google-login",
  passport.authenticate("google", {
    scope: ["profile", "email"],
    state: "login",
  })
);

router.get(
  "/google/callback",
  passport.authenticate("google", {
    session: false,
    failureRedirect: "http://localhost:5173/auth-error?reason=user_not_found",
  }),
  async (req, res) => {
    const state = req.query.state;
    const redirectUrl = process.env.FRONTEND_URL || "http://localhost:5173";
    const token = jwt.sign({ userId: req.user._id }, process.env.JWT_SECRET, {
      expiresIn: "1h",
    });

    if (state === "signup") {
      return res.redirect(
        `${redirectUrl}/login?signup=${req.user._alreadyExists ? "exists" : "success"}`
      );
    } else {
      return res.redirect(`${redirectUrl}/auth/success?token=${token}`);
    }
  }
);

router.get("/me", authMiddleware, (req, res) => {
  res.json({ message: "This is protected user data", user: req.user });
});

router.get("/upload", authMiddleware, (req, res) => {
  res.json({ message: "You are allowed to upload notes!", user: req.user });
});

router.get("/dashboard-stats", authMiddleware, async (req, res) => {
  try {
    const userId = req.user.userId;
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: "User not found" });

    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);
    const endOfMonth = new Date(startOfMonth);
    endOfMonth.setMonth(endOfMonth.getMonth() + 1);

    const uploadedNotes = await Note.countDocuments({ uploadedBy: userId });
    const uploadedThisMonth = await Note.countDocuments({
      uploadedBy: userId,
      createdAt: { $gte: startOfMonth, $lt: endOfMonth },
    });

    const downloadedNotes = await Note.countDocuments({ downloadedBy: userId });
    const downloadedThisMonth = await Note.countDocuments({
      downloadedBy: userId,
      createdAt: { $gte: startOfMonth, $lt: endOfMonth },
    });

    const userNotes = await Note.find({ uploadedBy: userId }).select("_id");
    const userNoteIds = userNotes.map((n) => n._id);

    const reviewsReceived = await Review.countDocuments({
      note: { $in: userNoteIds },
    });
    const reviewsThisMonth = await Review.countDocuments({
      note: { $in: userNoteIds },
      createdAt: { $gte: startOfMonth, $lt: endOfMonth },
    });

    const allReviews = await Review.find({ note: { $in: userNoteIds } });
    const averageRating =
      allReviews.length > 0
        ? (
            allReviews.reduce((sum, r) => sum + (r.rating || 0), 0) /
            allReviews.length
          ).toFixed(2)
        : 0;

    res.json({
      user: {
        username: user.username || user.name || "User",
        joinDate: user.createdAt,
        bio: user.bio || "",
        imageUrl: user.imageUrl || "",
      },
      stats: {
        uploadedNotes,
        downloadedNotes,
        reviewsReceived,
        uploadedThisMonth,
        downloadedThisMonth,
        reviewsThisMonth,
        averageRating: Number(averageRating),
      },
    });
  } catch (err) {
    console.error("Dashboard stats error:", err);
    res.status(500).json({ message: "Failed to load dashboard stats" });
  }
});

router.get("/public-stats", async (req, res) => {
  try {
    const [userCount, noteCount, reviews] = await Promise.all([
      require("../models/User").countDocuments(),
      require("../models/Note").countDocuments(),
      require("../models/Review").find({}, "rating")
    ]);
    let avgRating = 0;
    if (reviews.length > 0) {
      avgRating = (
        reviews.reduce((sum, r) => sum + (r.rating || 0), 0) / reviews.length
      ).toFixed(2);
    }
    res.json({
      userCount,
      noteCount,
      avgRating: Number(avgRating)
    });
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch stats" });
  }
});

router.post('/admin/login', async (req, res) => {
  const { password } = req.body;
  if (!password) return res.status(400).json({ message: 'Password required' });

  const admin = await Admin.findOne({ username: 'admin' });
  if (!admin) return res.status(500).json({ message: 'Admin not initialized' });

  const isMatch = await bcrypt.compare(password, admin.passwordHash);
  if (!isMatch) return res.status(401).json({ message: 'Invalid password' });

  const adminToken = crypto.randomBytes(32).toString('hex');
  res.status(200).json({ token: adminToken });
});

router.post('/admin/change-password', async (req, res) => {
  const { oldPassword, newPassword } = req.body;
  if (!oldPassword || !newPassword) return res.status(400).json({ message: 'Both old and new password required' });

  const admin = await Admin.findOne({ username: 'admin' });
  if (!admin) return res.status(500).json({ message: 'Admin not initialized' });

  const isMatch = await bcrypt.compare(oldPassword, admin.passwordHash);
  if (!isMatch) return res.status(401).json({ message: 'Old password incorrect' });

  const newHash = await bcrypt.hash(newPassword, 10);
  admin.passwordHash = newHash;
  await admin.save();

  res.status(200).json({ message: 'Password changed successfully' });
});

module.exports = router;
