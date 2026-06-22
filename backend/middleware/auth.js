// A custom middleware to replace requireAuth() from @clerk/express
// This works alongside clerkMiddleware() to ensure requests have a valid user
const checkAuth = (req, res, next) => {
  if (!req.auth || !req.auth.userId) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  next();
};

module.exports = { checkAuth };