// middleware/auth.js
const jwt = require('jsonwebtoken');

// 🔹 Même clé que dans User.js
const JWT_SECRET = 'RANDOM_SECRET_KEY';

module.exports = (req, res, next) => {
  try {
    const token = req.headers.authorization.split(' ')[1];
    const decodedToken = jwt.verify(token, JWT_SECRET);
    req.auth = { userId: decodedToken.userId };
    next();
  } catch (error) {
    res.status(401).json({ message: `Token invalide : ${error.message}` });
  }
};
