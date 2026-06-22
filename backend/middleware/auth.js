// According to Clerk docs for the latest standard integration
// If you don't use requireAuth(), you can just check req.auth.userId manually
// This avoids the deprecation warning
const checkAuth = (req, res, next) => {
  if (!req.auth || !req.auth.userId) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  next();
};

module.exports = { checkAuth };