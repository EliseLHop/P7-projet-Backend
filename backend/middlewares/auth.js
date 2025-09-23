// middleware/auth.js
const jwt = require('jsonwebtoken');
const JWT_SECRET = process.env.JWT_SECRET;

module.exports = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization || '';
    const [scheme, token] = authHeader.split(' ');

    if (scheme !== 'Bearer' || !token) {
      return res.status(401).json({ message: 'Authorization manquante ou mal formée' });
    }

    const decoded = jwt.verify(token, JWT_SECRET);
    req.auth = { userId: decoded.userId };
    next();
  } catch (error) {
    res.status(401).json({ message: `Token invalide : ${error.message}` });
  }
};
