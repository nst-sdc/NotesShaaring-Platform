const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const passport = require('passport');
const crypto = require('crypto');
const nodemailer = require('nodemailer');
const User = require('../models/User');
const Note = require('../models/Note');
const Review = require('../models/Review');
const authMiddleware = require('../middlewares/authMiddleware');

const router = express.Router();

// -------------------- Signup --------------------
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
      user: {
        id: newUser._id,
        username: newUser.username,
        email: newUser.email,
      },
      message: 'User registered successfully',
    });
  } catch (err) {
    console.error('Signup error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// -------------------- Login --------------------
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password)
      return res.status(400).json({ message: 'Email and password are required' });

    const user = await User.findOne({ email: email.trim().toLowerCase() });
    if (!user)
      return res.status(401).json({ message: 'Invalid email or password' });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch)
      return res.status(401).json({ message: 'Invalid email or password' });

    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, { expiresIn: '1d' });

    res.status(200).json({
      token,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
      },
      message: 'Login successful',
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// -------------------- Google OAuth --------------------
router.get('/google-signup',
  passport.authenticate('google', { scope: ['profile', 'email'], state: 'signup' })
);

router.get('/google',
  passport.authenticate('google', { scope: ['profile', 'email'], state: 'login' })
);

router.get('/google/callback',
  passport.authenticate('google', {
    session: false,
    failureRedirect: process.env.FRONTEND_URL
      ? `${process.env.FRONTEND_URL}/login`
      : 'http://localhost:5173/login'
  }),
  async (req, res) => {
    const state = req.query.state;
    const redirectUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
    const token = jwt.sign(
      { userId: req.user._id },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );
    if (state === 'signup') {
      // After signup, go to login page
      return res.redirect(`${redirectUrl}/login`);
    } else {
      // After login, go to home/dashboard
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
    const userNoteIds = userNotes.map(n => n._id);

    const reviewsReceived = await Review.countDocuments({ note: { $in: userNoteIds } });
    const reviewsThisMonth = await Review.countDocuments({
      note: { $in: userNoteIds },
      createdAt: { $gte: startOfMonth, $lt: endOfMonth },
    });

    const allReviews = await Review.find({ note: { $in: userNoteIds } });
    const averageRating = allReviews.length > 0
      ? (allReviews.reduce((sum, r) => sum + (r.rating || 0), 0) / allReviews.length).toFixed(2)
      : 0;

    res.json({
      user: {
        username: user.username || user.name || 'User',
        joinDate: user.createdAt,
      },
      stats: {
        uploadedNotes,
        downloadedNotes,
        reviewsReceived,
        uploadedThisMonth,
        downloadedThisMonth,
        reviewsThisMonth,
        averageRating: Number(averageRating),
      }
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
    const expires = Date.now() + 3600000; // 1 hour

    user.resetPasswordToken = token;
    user.resetPasswordExpires = expires;
    await user.save();

    const resetUrl = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/reset-password/${token}`;

    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    const mailOptions = {
      to: user.email,
      from: process.env.EMAIL_USER,
      subject: 'Reset Your Password - Notes Sharing Platform',
      html: `
        <p>Hi ${user.username || 'User'},</p>
        <p>You requested a password reset. Click the button below to reset your password:</p>
        <a href="${resetUrl}" style="padding:10px 15px; background-color:#6366F1; color:white; text-decoration:none; border-radius:5px;">Reset Password</a>
        <p>This link will expire in 1 hour.</p>
        <p>If you did not request this, you can ignore this email.</p>
      `,
    };

    await transporter.sendMail(mailOptions);

    res.status(200).json({ message: 'If that email is registered, a reset link will be sent.' });
  } catch (err) {
    console.error('Forgot password error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
