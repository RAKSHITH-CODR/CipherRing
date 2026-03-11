import jwt from 'jsonwebtoken';

// Secret keys (in production, use environment variables)
export const JWT_SECRET = 'cipher-ring-jwt-secret-2026-hackathon';
export const JWT_REFRESH_SECRET = 'cipher-ring-refresh-secret-2026';

// Token expiration times
export const ACCESS_TOKEN_EXPIRY = '15m';  // 15 minutes
export const REFRESH_TOKEN_EXPIRY = '7d';  // 7 days
export const INACTIVITY_TIMEOUT = 15 * 60 * 1000; // 15 minutes in ms

// In-memory session cache (tracks active sessions and last activity)
export const sessionCache = new Map();

// Generate tokens
export const generateTokens = (user) => {
  const payload = { id: user.id, email: user.email, name: user.name };
  
  const accessToken = jwt.sign(payload, JWT_SECRET, { expiresIn: ACCESS_TOKEN_EXPIRY });
  const refreshToken = jwt.sign({ id: user.id }, JWT_REFRESH_SECRET, { expiresIn: REFRESH_TOKEN_EXPIRY });
  
  return { accessToken, refreshToken };
};

// Verify access token middleware
export const verifyToken = (req, res, next) => {
  try {
    // Get token from cookie or header
    const token = req.cookies?.accessToken || req.headers.authorization?.split(' ')[1];
    
    if (!token) {
      return res.status(401).json({ error: 'Access denied. No token provided.' });
    }

    const decoded = jwt.verify(token, JWT_SECRET);
    
    // Check session cache for activity timeout
    const session = sessionCache.get(decoded.id);
    if (session) {
      const timeSinceLastActivity = Date.now() - session.lastActivity;
      if (timeSinceLastActivity > INACTIVITY_TIMEOUT) {
        sessionCache.delete(decoded.id);
        return res.status(401).json({ error: 'Session expired due to inactivity.', code: 'INACTIVITY_TIMEOUT' });
      }
      // Update last activity
      session.lastActivity = Date.now();
    }
    
    req.user = decoded;
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Token expired.', code: 'TOKEN_EXPIRED' });
    }
    return res.status(401).json({ error: 'Invalid token.' });
  }
};

// Verify refresh token
export const verifyRefreshToken = (refreshToken) => {
  try {
    return jwt.verify(refreshToken, JWT_REFRESH_SECRET);
  } catch (error) {
    return null;
  }
};

// Clean up expired sessions periodically
setInterval(() => {
  const now = Date.now();
  for (const [userId, session] of sessionCache.entries()) {
    if (now - session.lastActivity > INACTIVITY_TIMEOUT) {
      sessionCache.delete(userId);
      console.log(`Session cleaned up for user: ${userId}`);
    }
  }
}, 60000); // Check every minute
