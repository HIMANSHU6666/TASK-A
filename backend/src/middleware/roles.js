/**
 * Middleware factory: require the user to have one of the specified roles.
 * Must be used AFTER the `authenticate` middleware (req.user must exist).
 *
 * Usage: router.patch('/assign', authenticate, requireRole('admin'), assignLead)
 */
export const requireRole = (...roles) => (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ success: false, message: 'Authentication required.' });
  }

  if (!roles.includes(req.user.role)) {
    return res.status(403).json({
      success: false,
      message: `Access denied. Required role: ${roles.join(' or ')}. Your role: ${req.user.role}.`,
    });
  }

  next();
};

