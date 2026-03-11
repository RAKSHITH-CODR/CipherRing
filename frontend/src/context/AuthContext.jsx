import { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import axios from 'axios';

const AuthContext = createContext(null);

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
const INACTIVITY_TIMEOUT = 15 * 60 * 1000; // 15 minutes
const ACTIVITY_CHECK_INTERVAL = 60 * 1000; // Check every minute
const TOKEN_REFRESH_BUFFER = 2 * 60 * 1000; // Refresh 2 minutes before expiry

// Configure axios defaults
axios.defaults.withCredentials = true;

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [sessionExpiry, setSessionExpiry] = useState(null);
  const lastActivityRef = useRef(Date.now());
  const refreshTimeoutRef = useRef(null);
  const activityCheckRef = useRef(null);

  // Store tokens
  const [tokens, setTokens] = useState(() => {
    const stored = localStorage.getItem('auth_tokens');
    return stored ? JSON.parse(stored) : null;
  });

  // Update last activity on user actions
  const updateActivity = useCallback(() => {
    lastActivityRef.current = Date.now();
  }, []);

  // Refresh tokens
  const refreshTokens = useCallback(async () => {
    try {
      const refreshToken = tokens?.refreshToken || localStorage.getItem('refresh_token');
      if (!refreshToken) return false;

      const res = await axios.post(`${API_URL}/auth/refresh`, { refreshToken });
      
      if (res.data.success) {
        const newTokens = {
          accessToken: res.data.accessToken,
          refreshToken: res.data.refreshToken
        };
        setTokens(newTokens);
        localStorage.setItem('auth_tokens', JSON.stringify(newTokens));
        localStorage.setItem('refresh_token', res.data.refreshToken);
        
        // Schedule next refresh
        const expiresIn = res.data.expiresIn * 1000;
        clearTimeout(refreshTimeoutRef.current);
        refreshTimeoutRef.current = setTimeout(refreshTokens, expiresIn - TOKEN_REFRESH_BUFFER);
        
        return true;
      }
      return false;
    } catch (error) {
      console.error('Token refresh failed:', error);
      return false;
    }
  }, [tokens]);

  // Check session validity
  const checkSession = useCallback(async () => {
    try {
      const accessToken = tokens?.accessToken;
      if (!accessToken) return false;

      const res = await axios.get(`${API_URL}/auth/verify`, {
        headers: { Authorization: `Bearer ${accessToken}` }
      });

      if (res.data.success) {
        setUser(res.data.user);
        setSessionExpiry(res.data.session.expiresAt);
        return true;
      }
      return false;
    } catch (error) {
      if (error.response?.data?.code === 'TOKEN_EXPIRED') {
        // Try to refresh
        return await refreshTokens();
      }
      return false;
    }
  }, [tokens, refreshTokens]);

  // Logout function
  const logout = useCallback(async (reason = 'manual') => {
    try {
      await axios.post(`${API_URL}/auth/logout`);
    } catch (error) {
      // Continue with local logout even if server call fails
    }
    
    setUser(null);
    setTokens(null);
    setSessionExpiry(null);
    localStorage.removeItem('auth_tokens');
    localStorage.removeItem('refresh_token');
    clearTimeout(refreshTimeoutRef.current);
    clearInterval(activityCheckRef.current);
    
    return reason;
  }, []);

  // Login function
  const login = useCallback(async (email, password) => {
    try {
      const res = await axios.post(`${API_URL}/auth/login`, { email, password });
      
      if (res.data.success) {
        setUser(res.data.user);
        const newTokens = {
          accessToken: res.data.accessToken,
          refreshToken: res.data.refreshToken
        };
        setTokens(newTokens);
        localStorage.setItem('auth_tokens', JSON.stringify(newTokens));
        localStorage.setItem('refresh_token', res.data.refreshToken);
        lastActivityRef.current = Date.now();
        
        // Schedule token refresh
        const expiresIn = res.data.expiresIn * 1000;
        refreshTimeoutRef.current = setTimeout(refreshTokens, expiresIn - TOKEN_REFRESH_BUFFER);
        
        return { success: true };
      }
      return { success: false, error: 'Login failed' };
    } catch (error) {
      return { 
        success: false, 
        error: error.response?.data?.error || 'Login failed. Please try again.' 
      };
    }
  }, [refreshTokens]);

  // Signup function
  const signup = useCallback(async (email, password, name) => {
    try {
      const res = await axios.post(`${API_URL}/auth/signup`, { email, password, name });
      
      if (res.data.success) {
        setUser(res.data.user);
        const newTokens = {
          accessToken: res.data.accessToken,
          refreshToken: res.data.refreshToken
        };
        setTokens(newTokens);
        localStorage.setItem('auth_tokens', JSON.stringify(newTokens));
        localStorage.setItem('refresh_token', res.data.refreshToken);
        lastActivityRef.current = Date.now();
        
        // Schedule token refresh
        const expiresIn = res.data.expiresIn * 1000;
        refreshTimeoutRef.current = setTimeout(refreshTokens, expiresIn - TOKEN_REFRESH_BUFFER);
        
        return { success: true };
      }
      return { success: false, error: 'Signup failed' };
    } catch (error) {
      return { 
        success: false, 
        error: error.response?.data?.error || 'Signup failed. Please try again.' 
      };
    }
  }, [refreshTokens]);

  // Initialize auth state
  useEffect(() => {
    const initAuth = async () => {
      if (tokens?.accessToken) {
        const isValid = await checkSession();
        if (!isValid) {
          const refreshed = await refreshTokens();
          if (!refreshed) {
            await logout('session_invalid');
          }
        }
      }
      setLoading(false);
    };
    initAuth();
  }, []);

  // Activity tracking for auto-logout
  useEffect(() => {
    if (!user) return;

    // Track user activity
    const events = ['mousedown', 'keydown', 'scroll', 'touchstart', 'mousemove'];
    const handleActivity = () => {
      updateActivity();
    };

    events.forEach(event => window.addEventListener(event, handleActivity, { passive: true }));

    // Periodic inactivity check
    activityCheckRef.current = setInterval(async () => {
      const timeSinceActivity = Date.now() - lastActivityRef.current;
      
      if (timeSinceActivity >= INACTIVITY_TIMEOUT) {
        await logout('inactivity');
        window.dispatchEvent(new CustomEvent('auth:timeout'));
      } else {
        // Update server about activity
        try {
          await axios.post(`${API_URL}/auth/activity`, {}, {
            headers: { Authorization: `Bearer ${tokens?.accessToken}` }
          });
        } catch (error) {
          // Ignore activity update errors
        }
      }
    }, ACTIVITY_CHECK_INTERVAL);

    return () => {
      events.forEach(event => window.removeEventListener(event, handleActivity));
      clearInterval(activityCheckRef.current);
    };
  }, [user, updateActivity, logout, tokens]);

  // Get remaining session time
  const getRemainingTime = useCallback(() => {
    const timeSinceActivity = Date.now() - lastActivityRef.current;
    return Math.max(0, INACTIVITY_TIMEOUT - timeSinceActivity);
  }, []);

  // Get auth header for API calls
  const getAuthHeader = useCallback(() => {
    return tokens?.accessToken ? { Authorization: `Bearer ${tokens.accessToken}` } : {};
  }, [tokens]);

  const value = {
    user,
    loading,
    login,
    signup,
    logout,
    tokens,
    sessionExpiry,
    getRemainingTime,
    getAuthHeader,
    isAuthenticated: !!user
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

export default AuthContext;
