import express from 'express';
import bcrypt from 'bcryptjs';
import { 
  generateTokens, 
  verifyToken, 
  verifyRefreshToken, 
  sessionCache,
  JWT_SECRET,
  INACTIVITY_TIMEOUT
} from '../middleware/auth.js';

const router = express.Router();

// In-memory user store (in production, use a database)
const users = new Map();

// Initialize with a demo user
const initDemoUser = async () => {
  const hashedPassword = await bcrypt.hash('demo123', 10);
  users.set('demo@cipherring.com', {
    id: 'user_001',
    email: 'demo@cipherring.com',
    name: 'Demo User',
    password: hashedPassword,
    createdAt: new Date().toISOString()
  });
  console.log('Demo user initialized: demo@cipherring.com / demo123');
};
initDemoUser();

// ============ SIGNUP ============
router.post('/signup', async (req, res) => {
  try {
    const { email, password, name } = req.body;

    // Validation
    if (!email || !password || !name) {
      return res.status(400).json({ error: 'All fields are required' });
    }

    if (password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters' });
    }

    // Check if user exists
    if (users.has(email.toLowerCase())) {
      return res.status(409).json({ error: 'User already exists with this email' });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);

    // Create user
    const userId = `user_${Date.now()}`;
    const user = {
      id: userId,
      email: email.toLowerCase(),
      name,
      password: hashedPassword,
      createdAt: new Date().toISOString()
    };

    users.set(email.toLowerCase(), user);

    // Generate tokens
    const { accessToken, refreshToken } = generateTokens(user);

    // Create session
    sessionCache.set(userId, {
      refreshToken,
      lastActivity: Date.now(),
      createdAt: Date.now()
    });

    // Set cookies
    res.cookie('accessToken', accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 15 * 60 * 1000 // 15 minutes
    });

    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
    });

    res.status(201).json({
      success: true,
      message: 'Account created successfully',
      user: { id: user.id, email: user.email, name: user.name },
      accessToken,
      refreshToken,
      expiresIn: 15 * 60 // 15 minutes in seconds
    });

  } catch (error) {
    console.error('Signup error:', error);
    res.status(500).json({ error: 'Server error during signup' });
  }
});

// ============ LOGIN ============
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validation
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    // Find user
    const user = users.get(email.toLowerCase());
    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Verify password
    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Generate tokens
    const { accessToken, refreshToken } = generateTokens(user);

    // Create/update session
    sessionCache.set(user.id, {
      refreshToken,
      lastActivity: Date.now(),
      createdAt: Date.now()
    });

    // Set cookies
    res.cookie('accessToken', accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 15 * 60 * 1000
    });

    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000
    });

    res.json({
      success: true,
      message: 'Login successful',
      user: { id: user.id, email: user.email, name: user.name },
      accessToken,
      refreshToken,
      expiresIn: 15 * 60
    });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Server error during login' });
  }
});

// ============ LOGOUT ============
router.post('/logout', async (req, res) => {
  try {
    const token = req.cookies?.accessToken || req.headers.authorization?.split(' ')[1];
    
    if (token) {
      try {
        const jwt = await import('jsonwebtoken');
        const decoded = jwt.default.verify(token, JWT_SECRET);
        sessionCache.delete(decoded.id);
      } catch (e) {
        // Token invalid, continue with logout
      }
    }

    // Clear cookies
    res.clearCookie('accessToken');
    res.clearCookie('refreshToken');

    res.json({ success: true, message: 'Logged out successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Server error during logout' });
  }
});

// ============ REFRESH TOKEN ============
router.post('/refresh', async (req, res) => {
  try {
    const refreshToken = req.cookies?.refreshToken || req.body.refreshToken;

    if (!refreshToken) {
      return res.status(401).json({ error: 'Refresh token required' });
    }

    // Verify refresh token
    const decoded = verifyRefreshToken(refreshToken);
    if (!decoded) {
      return res.status(401).json({ error: 'Invalid refresh token' });
    }

    // Find user by id
    let foundUser = null;
    for (const user of users.values()) {
      if (user.id === decoded.id) {
        foundUser = user;
        break;
      }
    }

    if (!foundUser) {
      return res.status(401).json({ error: 'User not found' });
    }

    // Check session
    const session = sessionCache.get(foundUser.id);
    if (!session || session.refreshToken !== refreshToken) {
      return res.status(401).json({ error: 'Invalid session' });
    }

    // Generate new tokens
    const tokens = generateTokens(foundUser);

    // Update session
    session.refreshToken = tokens.refreshToken;
    session.lastActivity = Date.now();

    // Set cookies
    res.cookie('accessToken', tokens.accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 15 * 60 * 1000
    });

    res.cookie('refreshToken', tokens.refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000
    });

    res.json({
      success: true,
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      expiresIn: 15 * 60
    });

  } catch (error) {
    console.error('Refresh error:', error);
    res.status(500).json({ error: 'Server error during token refresh' });
  }
});

// ============ VERIFY SESSION ============
router.get('/verify', verifyToken, (req, res) => {
  const session = sessionCache.get(req.user.id);
  const remainingTime = session 
    ? Math.max(0, INACTIVITY_TIMEOUT - (Date.now() - session.lastActivity))
    : 0;

  res.json({
    success: true,
    user: req.user,
    session: {
      remainingTime,
      expiresAt: session ? session.lastActivity + INACTIVITY_TIMEOUT : 0
    }
  });
});

// ============ UPDATE ACTIVITY ============
router.post('/activity', verifyToken, (req, res) => {
  const session = sessionCache.get(req.user.id);
  if (session) {
    session.lastActivity = Date.now();
    res.json({ 
      success: true, 
      lastActivity: session.lastActivity,
      expiresAt: session.lastActivity + INACTIVITY_TIMEOUT
    });
  } else {
    res.status(401).json({ error: 'Session not found' });
  }
});

export default router;
