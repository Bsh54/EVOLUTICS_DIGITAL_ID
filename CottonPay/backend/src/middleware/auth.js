/**
 * Authentication Middleware
 */

/**
 * Vérifier si l'utilisateur est authentifié
 */
function requireAuth(req, res, next) {
  if (!req.session.user) {
    return res.status(401).json({
      error: 'Unauthorized',
      message: 'Authentication required'
    });
  }
  next();
}

/**
 * Vérifier si l'utilisateur est un administrateur
 */
function requireAdmin(req, res, next) {
  if (!req.session.user || !req.session.user.isAdmin) {
    return res.status(403).json({
      error: 'Forbidden',
      message: 'Admin access required'
    });
  }
  next();
}

module.exports = {
  requireAuth,
  requireAdmin
};
