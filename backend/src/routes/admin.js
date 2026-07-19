const router = require('express').Router();
const User = require('../models/User');
const Project = require('../models/Project');
const auth = require('../middleware/auth');
const admin = require('../middleware/admin');

// GET /api/admin/users
router.get('/users', auth, admin, async (req, res) => {
  try {
    const [users, counts] = await Promise.all([
      User.find().select('name email role createdAt').sort({ createdAt: 1 }).lean(),
      Project.aggregate([{ $group: { _id: '$owner', count: { $sum: 1 } } }]),
    ]);
    const countByOwner = Object.fromEntries(counts.map((c) => [String(c._id), c.count]));
    res.json(
      users.map((u) => ({
        id: u._id,
        name: u.name,
        email: u.email,
        role: u.role || 'user',
        projectCount: countByOwner[String(u._id)] || 0,
        createdAt: u.createdAt,
      }))
    );
  } catch {
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
