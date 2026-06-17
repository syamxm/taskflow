const router = require('express').Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const User = require('../models/User');
const auth = require('../middleware/auth');
const { loginLimiter, registerLimiter } = require('../middleware/rateLimiters');

const MAX_FAILED_ATTEMPTS = 5;
const LOCK_MS = 15 * 60 * 1000;

const signToken = (id) =>
  jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '7d' });

const COOKIE_NAME = 'token';
const cookieOptions = {
  httpOnly: true,
  secure: process.env.COOKIE_SECURE === 'true',
  sameSite: 'strict',
  maxAge: 7 * 24 * 60 * 60 * 1000,
};

const sendAuth = (res, user, status = 200) =>
  res
    .cookie(COOKIE_NAME, signToken(user._id), cookieOptions)
    .status(status)
    .json({ user: { id: user._id, name: user.name, email: user.email } });

// POST /api/auth/register
router.post(
  '/register',
  registerLimiter,
  [
    body('name').notEmpty().withMessage('Name required'),
    body('email').isEmail().withMessage('Valid email required'),
    body('password').isLength({ min: 6 }).withMessage('Password min 6 chars'),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    const { name, email, password } = req.body;
    try {
      if (await User.findOne({ email }))
        return res.status(400).json({ message: 'Unable to register with those details' });

      const hash = await bcrypt.hash(password, 12);
      const user = await User.create({ name, email, password: hash });
      sendAuth(res, user, 201);
    } catch (err) {
      res.status(500).json({ message: 'Server error' });
    }
  }
);

// POST /api/auth/login
router.post(
  '/login',
  loginLimiter,
  [
    body('email').isEmail(),
    body('password').notEmpty(),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    const { email, password } = req.body;
    try {
      const user = await User.findOne({ email });
      if (!user) return res.status(400).json({ message: 'Invalid credentials' });

      if (user.lockUntil && user.lockUntil > Date.now())
        return res.status(429).json({ message: 'Account locked, try again later' });

      const match = await bcrypt.compare(password, user.password);
      if (!match) {
        user.failedLoginAttempts += 1;
        if (user.failedLoginAttempts >= MAX_FAILED_ATTEMPTS) {
          user.lockUntil = new Date(Date.now() + LOCK_MS);
          user.failedLoginAttempts = 0;
        }
        await user.save();
        return res.status(400).json({ message: 'Invalid credentials' });
      }

      if (user.failedLoginAttempts > 0 || user.lockUntil) {
        user.failedLoginAttempts = 0;
        user.lockUntil = null;
        await user.save();
      }

      sendAuth(res, user);
    } catch {
      res.status(500).json({ message: 'Server error' });
    }
  }
);

// POST /api/auth/logout
router.post('/logout', (req, res) => {
  res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: undefined });
  res.json({ message: 'Logged out' });
});

// GET /api/auth/me
router.get('/me', auth, async (req, res) => {
  const user = await User.findById(req.user.id).select('-password');
  res.json(user);
});

module.exports = router;
