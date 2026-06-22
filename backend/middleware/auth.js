const jwt = require('jsonwebtoken');

// Custom JWT Authentication Middleware
const checkAuth = (req, res, next) => {
  try {
    let token;

    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      return res.status(401).json({ error: 'Not authorized to access this route' });
    }

    const decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);

    // Attach the decoded MongoDB user ID to req.user
    req.user = { id: decoded.id };

    next();
  } catch (error) {
    console.error("Auth middleware error:", error);
    return res.status(401).json({ error: 'Unauthorized' });
  }
};

module.exports = { checkAuth };