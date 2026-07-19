const User = require('../models/User');

module.exports = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id).select('role');
    if (!user || user.role !== 'admin') {
      return res.status(403).json({ message: 'Forbidden' });
    }
    next();
  } catch {
    res.status(500).json({ message: 'Server error' });
  }
};
