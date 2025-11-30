const jwt = require('jsonwebtoken');

// Role guard middleware that checks the JWT payload role
const roleMiddleware = (requiredRoles) => {
  const roles = Array.isArray(requiredRoles) ? requiredRoles : [requiredRoles];

  return (req, res, next) => {
    const authHeader = req.header('Authorization');
    if (!authHeader) {
      return res.status(401).json({ message: 'No token, authorization denied' });
    }

    const token = authHeader.replace('Bearer ', '').trim();

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      req.tokenPayload = decoded; // ensure payload comes from a verified signature
    } catch (err) {
      return res.status(401).json({ message: 'Invalid token signature' });
    }

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
