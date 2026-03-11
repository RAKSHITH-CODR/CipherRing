import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext.jsx';

// Animated background particles
function SecurityParticles() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {[...Array(30)].map((_, i) => (
        <motion.div
          key={i}
          className="absolute w-1 h-1 bg-cyan-500/30 rounded-full"
          initial={{ 
            x: Math.random() * window.innerWidth,
            y: Math.random() * window.innerHeight,
            scale: Math.random() * 0.5 + 0.5
          }}
          animate={{ 
            y: [null, Math.random() * window.innerHeight],
            opacity: [0.2, 0.8, 0.2]
          }}
          transition={{
            duration: 10 + Math.random() * 10,
            repeat: Infinity,
            ease: 'linear'
          }}
        />
      ))}
    </div>
  );
}

// Hexagon grid background
function HexGrid() {
  return (
    <div className="absolute inset-0 opacity-5">
      <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <pattern id="hexagons" width="50" height="43.4" patternUnits="userSpaceOnUse" patternTransform="scale(2)">
            <polygon fill="none" stroke="currentColor" strokeWidth="0.5" points="24.8,22 37.3,29.2 37.3,43.7 24.8,50.9 12.3,43.7 12.3,29.2" className="text-cyan-500"/>
            <polygon fill="none" stroke="currentColor" strokeWidth="0.5" points="0,0 12.5,7.2 12.5,21.7 0,28.9 -12.5,21.7 -12.5,7.2" className="text-cyan-500"/>
            <polygon fill="none" stroke="currentColor" strokeWidth="0.5" points="49.6,0 62.1,7.2 62.1,21.7 49.6,28.9 37.1,21.7 37.1,7.2" className="text-cyan-500"/>
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#hexagons)"/>
      </svg>
    </div>
  );
}

// Scanning line effect
function ScanLine() {
  return (
    <motion.div 
      className="absolute left-0 right-0 h-px bg-gradient-to-r from-transparent via-cyan-500 to-transparent"
      animate={{ top: ['0%', '100%', '0%'] }}
      transition={{ duration: 8, repeat: Infinity, ease: 'linear' }}
    />
  );
}

// Input field component
function AuthInput({ label, type, value, onChange, icon, error, placeholder }) {
  const [focused, setFocused] = useState(false);
  
  return (
    <div className="relative">
      <label className="block text-xs font-mono text-slate-500 mb-2 uppercase tracking-wider">
        {label}
      </label>
      <div className={`relative group ${error ? 'animate-shake' : ''}`}>
        <motion.div 
          className={`absolute -inset-0.5 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300 ${
            error ? 'bg-red-500/20' : 'bg-gradient-to-r from-cyan-500/20 via-purple-500/20 to-cyan-500/20'
          }`}
          animate={focused ? { opacity: 0.5 } : {}}
        />
        <div className="relative flex items-center">
          <span className="absolute left-4 text-slate-500 group-focus-within:text-cyan-400 transition-colors">
            {icon}
          </span>
          <input
            type={type}
            value={value}
            onChange={onChange}
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}
            placeholder={placeholder}
            className={`w-full bg-slate-800/80 border ${
              error ? 'border-red-500/50' : focused ? 'border-cyan-500/50' : 'border-slate-700'
            } rounded-lg pl-12 pr-4 py-3.5 text-white font-mono text-sm placeholder:text-slate-600 focus:outline-none transition-all`}
          />
          {focused && (
            <motion.div 
              className="absolute right-3 w-2 h-2 bg-cyan-500 rounded-full"
              animate={{ opacity: [1, 0.3, 1] }}
              transition={{ duration: 1, repeat: Infinity }}
            />
          )}
        </div>
      </div>
      <AnimatePresence>
        {error && (
          <motion.p 
            className="text-red-400 text-xs font-mono mt-1.5 flex items-center gap-1"
            initial={{ opacity: 0, y: -5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -5 }}
          >
            <span>⚠</span> {error}
          </motion.p>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function AuthPage({ onAuthSuccess }) {
  const [mode, setMode] = useState('login'); // 'login' or 'signup'
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  
  const { login, signup } = useAuth();

  // Clear errors when switching modes
  useEffect(() => {
    setError('');
    setFieldErrors({});
  }, [mode]);

  const validateForm = () => {
    const errors = {};
    
    if (!email) {
      errors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      errors.email = 'Invalid email format';
    }
    
    if (!password) {
      errors.password = 'Password is required';
    } else if (password.length < 6) {
      errors.password = 'Minimum 6 characters';
    }
    
    if (mode === 'signup' && !name) {
      errors.name = 'Name is required';
    }
    
    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    if (!validateForm()) return;
    
    setLoading(true);
    
    try {
      let result;
      if (mode === 'login') {
        result = await login(email, password);
      } else {
        result = await signup(email, password, name);
      }
      
      if (result.success) {
        setShowSuccess(true);
        setTimeout(() => {
          onAuthSuccess?.();
        }, 1500);
      } else {
        setError(result.error);
      }
    } catch (err) {
      setError('An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  const fillDemoCredentials = () => {
    setEmail('demo@cipherring.com');
    setPassword('demo123');
    setFieldErrors({});
    setError('');
  };

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background effects */}
      <div className="absolute inset-0 bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950" />
      <HexGrid />
      <SecurityParticles />
      <ScanLine />
      
      {/* Radial glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-cyan-500/5 rounded-full blur-3xl" />
      
      {/* Success overlay */}
      <AnimatePresence>
        {showSuccess && (
          <motion.div 
            className="fixed inset-0 bg-slate-950/90 backdrop-blur-xl z-50 flex items-center justify-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div 
              className="text-center"
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: 'spring', damping: 15 }}
            >
              <motion.div 
                className="w-24 h-24 mx-auto mb-6 bg-emerald-500/20 rounded-full flex items-center justify-center border-2 border-emerald-500/50"
                animate={{ scale: [1, 1.1, 1] }}
                transition={{ duration: 0.5, repeat: 2 }}
              >
                <span className="text-5xl">✓</span>
              </motion.div>
              <h2 className="text-2xl font-bold text-emerald-400 font-mono mb-2">ACCESS GRANTED</h2>
              <p className="text-slate-400 font-mono text-sm">Initializing secure session...</p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main card */}
      <motion.div 
        className="relative w-full max-w-md"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        {/* Card glow */}
        <motion.div 
          className="absolute -inset-1 bg-gradient-to-r from-cyan-500/20 via-purple-500/20 to-cyan-500/20 rounded-2xl blur-xl"
          animate={{ opacity: [0.3, 0.5, 0.3] }}
          transition={{ duration: 3, repeat: Infinity }}
        />
        
        {/* Card */}
        <div className="relative bg-slate-900/90 backdrop-blur-xl border border-slate-700/50 rounded-2xl overflow-hidden">
          {/* Header scan line */}
          <motion.div 
            className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-cyan-500 to-transparent"
            animate={{ opacity: [0.5, 1, 0.5] }}
            transition={{ duration: 2, repeat: Infinity }}
          />
          
          {/* Header */}
          <div className="p-6 pb-4 text-center border-b border-slate-800">
            <motion.div 
              className="w-16 h-16 mx-auto mb-4 relative"
              whileHover={{ scale: 1.05 }}
            >
              <motion.div 
                className="absolute inset-0 bg-cyan-500/20 rounded-full"
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
              />
              <div className="relative w-full h-full bg-slate-800 rounded-full flex items-center justify-center border border-cyan-500/30">
                <img 
                  src={`${import.meta.env.BASE_URL}logo.png`}
                  alt="CipherRing" 
                  className="w-10 h-10 object-contain"
                />
              </div>
            </motion.div>
            
            <h1 className="text-xl font-bold font-mono">
              <span className="text-cyan-400">CIPHER</span>
              <span className="text-white">RING</span>
            </h1>
            <p className="text-slate-500 text-xs font-mono mt-1 tracking-widest">SECURE ACCESS PORTAL</p>
          </div>

          {/* Mode toggle */}
          <div className="p-4 pb-0">
            <div className="flex bg-slate-800/50 rounded-lg p-1 border border-slate-700/50">
              {[
                { id: 'login', label: 'LOGIN', icon: '🔐' },
                { id: 'signup', label: 'SIGNUP', icon: '🔑' }
              ].map((tab) => (
                <motion.button
                  key={tab.id}
                  onClick={() => setMode(tab.id)}
                  className={`flex-1 py-2.5 px-4 rounded-md font-mono text-sm transition-all ${
                    mode === tab.id 
                      ? 'bg-gradient-to-r from-cyan-600 to-blue-600 text-white shadow-lg' 
                      : 'text-slate-400 hover:text-white'
                  }`}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <span className="mr-2">{tab.icon}</span>
                  {tab.label}
                </motion.button>
              ))}
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            <AnimatePresence mode="wait">
              {mode === 'signup' && (
                <motion.div
                  key="name"
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <AuthInput
                    label="Full Name"
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    icon="👤"
                    error={fieldErrors.name}
                    placeholder="Enter your name"
                  />
                </motion.div>
              )}
            </AnimatePresence>

            <AuthInput
              label="Email Address"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              icon="📧"
              error={fieldErrors.email}
              placeholder="agent@cipherring.com"
            />

            <AuthInput
              label="Password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              icon="🔒"
              error={fieldErrors.password}
              placeholder="••••••••"
            />

            {/* Error message */}
            <AnimatePresence>
              {error && (
                <motion.div 
                  className="p-3 bg-red-500/10 border border-red-500/30 rounded-lg"
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                >
                  <p className="text-red-400 text-sm font-mono flex items-center gap-2">
                    <span>⚠️</span> {error}
                  </p>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Submit button */}
            <motion.button
              type="submit"
              disabled={loading}
              className="w-full relative group overflow-hidden"
              whileHover={{ scale: loading ? 1 : 1.02 }}
              whileTap={{ scale: loading ? 1 : 0.98 }}
            >
              <motion.div 
                className="absolute inset-0 bg-gradient-to-r from-cyan-600 via-blue-600 to-purple-600"
                animate={{ x: loading ? ['0%', '100%', '0%'] : '0%' }}
                transition={{ duration: 1.5, repeat: loading ? Infinity : 0 }}
              />
              <div className={`relative py-4 px-6 font-mono font-bold text-white rounded-lg ${
                loading ? 'opacity-80' : ''
              }`}>
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <motion.span
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                    >
                      ⟳
                    </motion.span>
                    {mode === 'login' ? 'AUTHENTICATING...' : 'CREATING ACCOUNT...'}
                  </span>
                ) : (
                  <span className="flex items-center justify-center gap-2">
                    {mode === 'login' ? '🔓 AUTHENTICATE' : '🚀 CREATE ACCOUNT'}
                  </span>
                )}
              </div>
            </motion.button>

            {/* Demo credentials button */}
            {mode === 'login' && (
              <motion.button
                type="button"
                onClick={fillDemoCredentials}
                className="w-full py-2 text-slate-500 hover:text-cyan-400 text-xs font-mono transition-colors"
                whileHover={{ scale: 1.02 }}
              >
                🎮 Use Demo Credentials
              </motion.button>
            )}
          </form>

          {/* Footer */}
          <div className="px-6 pb-6 text-center">
            <p className="text-slate-600 text-xs font-mono">
              {mode === 'login' ? (
                <>Don't have an account? <button onClick={() => setMode('signup')} className="text-cyan-400 hover:underline">Sign up</button></>
              ) : (
                <>Already have an account? <button onClick={() => setMode('login')} className="text-cyan-400 hover:underline">Login</button></>
              )}
            </p>
          </div>

          {/* Security badge */}
          <div className="px-6 pb-4">
            <div className="flex items-center justify-center gap-2 py-2 px-4 bg-slate-800/50 rounded-lg border border-slate-700/30">
              <motion.div 
                className="w-2 h-2 bg-emerald-500 rounded-full"
                animate={{ opacity: [1, 0.5, 1] }}
                transition={{ duration: 1.5, repeat: Infinity }}
              />
              <span className="text-slate-500 text-[10px] font-mono tracking-wider">
                256-BIT ENCRYPTED • JWT SECURED • SESSION MONITORED
              </span>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Version info */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 text-slate-700 text-xs font-mono">
        CIPHERRING v2.0 • SECURE ACCESS SYSTEM
      </div>
    </div>
  );
}
