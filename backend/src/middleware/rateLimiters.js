const rateLimit = require('express-rate-limit');
const MongoStore = require('../utils/rateLimitStore');

const base = {
  windowMs: 15 * 60 * 1000,
  standardHeaders: true,
  legacyHeaders: false,
};

// Coarse per-IP backstop against login floods. Per-account lockout handles
// targeted attacks, so only failed attempts count here and the cap is loose
// enough not to punish users sharing an IP (NAT, office, CGNAT).
const loginLimiter = rateLimit({
  ...base,
  max: 30,
  skipSuccessfulRequests: true,
  store: new MongoStore({ prefix: 'login:' }),
  message: { message: 'Too many login attempts, try again later' },
});

// Registration is rare per user; keep tight to curb spam/abuse.
const registerLimiter = rateLimit({
  ...base,
  windowMs: 60 * 60 * 1000,
  max: 5,
  store: new MongoStore({ prefix: 'register:' }),
  message: { message: 'Too many accounts created, try again later' },
});

// Broad cap on all authenticated API traffic per IP.
const apiLimiter = rateLimit({
  ...base,
  max: 300,
  store: new MongoStore({ prefix: 'api:' }),
  message: { message: 'Too many requests, slow down' },
});

// GitHub routes proxy an external rate-limited API: keep them tighter.
const githubLimiter = rateLimit({
  ...base,
  max: 30,
  store: new MongoStore({ prefix: 'github:' }),
  message: { message: 'Too many GitHub requests, try again later' },
});

// Counts only failed attempts so a user can't brute-force their way past
// the login lockout via the password-change endpoint.
const passwordLimiter = rateLimit({
  ...base,
  max: 10,
  skipSuccessfulRequests: true,
  store: new MongoStore({ prefix: 'password:' }),
  message: { message: 'Too many attempts, try again later' },
});

module.exports = { loginLimiter, registerLimiter, apiLimiter, githubLimiter, passwordLimiter };
