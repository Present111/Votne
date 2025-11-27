// Role guard middleware that checks the JWT payload role
const roleMiddleware = (requiredRoles) => {
  const roles = Array.isArray(requiredRoles) ? requiredRoles : [requiredRoles];

  return (req, res, next) => {
    const payloadRole = req.tokenPayload?.role;

    if (!payloadRole) {
      return res.status(401).json({ message: 'User not authenticated' });
    }

    if (!roles.includes(payloadRole)) {
      return res.status(403).json({ message: 'Access denied: insufficient permissions' });
    }

    next(); // proceed when the user has the required role
  };
};

module.exports = roleMiddleware;
