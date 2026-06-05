const rateLimit = require('express-rate-limit');

const base = {
  windowMs: 15 * 60 * 1000,
  standardHeaders: true,
  legacyHeaders: false,
};

// Login is the brute-force target: cap attempts per IP per window.
const loginLimiter = rateLimit({
  ...base,
  max: 10,
  message: { message: 'Too many login attempts, try again later' },
});

// Registration is rare per user; keep tight to curb spam/abuse.
const registerLimiter = rateLimit({
  ...base,
  windowMs: 60 * 60 * 1000,
  max: 5,
  message: { message: 'Too many accounts created, try again later' },
});

module.exports = { loginLimiter, registerLimiter };
