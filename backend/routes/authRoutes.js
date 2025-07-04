const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const passport = require('passport');
const authMiddleware = require('../middlewares/authMiddleware');
const sendEmail = require('../utils/sendEmail');

const User = require('../models/User');
const Note = require('../models/Note');
const Review = require('../models/Review');

const router = express.Router();

// -------------------- Local Signup --------------------
router.post('/signup', async (req, res) => {
  try {
    let { username, email, password } = req.body;
    if (!username || !email || !password) {
      return res.status(400).json({ message: 'All fields are required' });
    }

    username = username.trim();
    email = email.trim().toLowerCase();

    const existingUser = await User.findOne({ $or: [{ email }, { username }] });
    if (existingUser) {
      return res.status(400).json({ message: 'Email or username already in use' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = new User({ username, email, password: hashedPassword });
    await newUser.save();

    const token = jwt.sign({ userId: newUser._id }, process.env.JWT_SECRET, { expiresIn: '1d' });

    res.status(201).json({
      token,
      message: 'User registered successfully',
      user: { id: newUser._id, username: newUser.username, email: newUser.email },
    });
  } catch (err) {
    console.error('Signup Error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// -------------------- Local Login --------------------
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password)
      return res.status(400).json({ message: 'Email and password are required' });

    const user = await User.findOne({ email: email.trim().toLowerCase() });
    if (!user) return res.status(401).json({ message: 'Invalid email or password' });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(401).json({ message: 'Invalid email or password' });

    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, { expiresIn: '1d' });

    res.status(200).json({
      token,
      message: 'Login successful',
      user: { id: user._id, username: user.username, email: user.email },
    });
  } catch (err) {
    console.error('Login Error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// -------------------- Protected Routes --------------------
router.get('/me', authMiddleware, (req, res) => {
  res.json({ message: 'This is protected user data', user: req.user });
});

router.get('/upload', authMiddleware, (req, res) => {
  res.json({ message: 'You are allowed to upload notes!', user: req.user });
});

// -------------------- Google OAuth --------------------
router.get('/google-signup', passport.authenticate('google', { scope: ['profile', 'email'], state: 'signup' }));
router.get('/google-login', passport.authenticate('google', { scope: ['profile', 'email'], state: 'login' }));

router.get('/google', (req, res, next) => {
  const state = req.query.state || 'login';
  passport.authenticate('google', {
    scope: ['profile', 'email'],
    state,
    prompt: 'select_account',
  })(req, res, next);
});

router.get('/google/callback',
  passport.authenticate('google', { session: false, failureRedirect: '/login' }),
  async (req, res) => {
    const state = req.query.state;
    const redirectUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
    const token = jwt.sign({ userId: req.user._id }, process.env.JWT_SECRET, { expiresIn: '1h' });

    if (state === 'signup') {
      return res.redirect(`${redirectUrl}/login`);
    } else {
      return res.redirect(`${redirectUrl}/auth/success?token=${token}`);
    }
  }
);

// -------------------- Dashboard Stats --------------------
router.get('/dashboard-stats', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.userId;
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: 'User not found' });

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

    const userNotes = await Note.find({ uploadedBy: userId }).select('_id');
    const userNoteIds = userNotes.map((n) => n._id);

    const reviewsReceived = await Review.countDocuments({ note: { $in: userNoteIds } });
    const reviewsThisMonth = await Review.countDocuments({
      note: { $in: userNoteIds },
      createdAt: { $gte: startOfMonth, $lt: endOfMonth },
    });

    const allReviews = await Review.find({ note: { $in: userNoteIds } });
    const averageRating =
      allReviews.length > 0
        ? (allReviews.reduce((sum, r) => sum + (r.rating || 0), 0) / allReviews.length).toFixed(2)
        : 0;

    res.json({
      user: { username: user.username || user.name || 'User', joinDate: user.createdAt },
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
    console.error('Dashboard stats error:', err);
    res.status(500).json({ message: 'Failed to load dashboard stats' });
  }
});

// -------------------- Forgot Password --------------------
router.post('/forgot-password', async (req, res) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ message: 'Email is required' });

  try {
    const user = await User.findOne({ email: email.trim().toLowerCase() });
    if (!user) {
      return res.status(200).json({ message: 'If that email is registered, a reset link will be sent.' });
    }

    const token = crypto.randomBytes(32).toString('hex');
    user.resetPasswordToken = token;
    user.resetPasswordExpires = Date.now() + 3600000; // 1 hour
    await user.save();

    const resetLink = `${process.env.FRONTEND_URL}/reset-password/${token}`;
    const subject = 'Password Reset';
    const html = `
      <p>Hello ${user.username || 'user'},</p>
      <p>You requested to reset your password.</p>
      <p><a href="${resetLink}" style="color:blue;">Click here to reset your password</a></p>
      <p>This link will expire in 1 hour.</p>
    `;

    await sendEmail({ to: user.email, subject, html });

    res.status(200).json({ message: 'If that email is registered, a reset link will be sent.' });
  } catch (err) {
    console.error('Forgot password error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// -------------------- Reset Password --------------------
router.post('/reset-password/:token', async (req, res) => {
  const { token } = req.params;
  const { password } = req.body;

  if (!password) return res.status(400).json({ message: 'Password is required' });

  try {
    const user = await User.findOne({
      resetPasswordToken: token,
      resetPasswordExpires: { $gt: Date.now() },
    });

    if (!user) return res.status(400).json({ message: 'Invalid or expired token' });

    user.password = await bcrypt.hash(password, 10);
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;
    await user.save();

    res.status(200).json({ message: 'Password has been reset successfully' });
  } catch (err) {
    console.error('Reset password error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
