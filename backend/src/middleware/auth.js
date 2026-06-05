const jwt = require('jsonwebtoken');

module.exports = (req, res, next) => {
  const token = req.cookies?.token || req.header('Authorization')?.replace('Bearer ', '');
  if (!token) return res.status(401).json({ message: 'No token, access denied' });

  try {
    req.user = jwt.verify(token, process.env.JWT_SECRET, { algorithms: ['HS256'] });
    next();
  } catch {
    res.status(401).json({ message: 'Token invalid' });
  }
};
