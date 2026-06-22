const { getAuth } = require('@clerk/express');

// According to Clerk v1 docs for @clerk/express, getAuth(req) should be used
// to extract the session securely from the request object.
const checkAuth = (req, res, next) => {
  try {
    const auth = getAuth(req);

    if (!auth || !auth.userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Attach auth back to req so routes can use req.auth.userId
    req.auth = auth;
    next();
  } catch (error) {
    console.error("Auth middleware error:", error);
    return res.status(401).json({ error: 'Unauthorized' });
  }
};

module.exports = { checkAuth };