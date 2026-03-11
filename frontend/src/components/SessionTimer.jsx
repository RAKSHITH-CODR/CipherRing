import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext.jsx';

export default function SessionTimer() {
  const { getRemainingTime, logout, isAuthenticated, user } = useAuth();
  const [remainingTime, setRemainingTime] = useState(getRemainingTime());
  const [showWarning, setShowWarning] = useState(false);
  const [showTimeoutModal, setShowTimeoutModal] = useState(false);

  useEffect(() => {
    if (!isAuthenticated) return;

    const interval = setInterval(() => {
      const time = getRemainingTime();
      setRemainingTime(time);
      
      // Show warning at 2 minutes
      if (time <= 2 * 60 * 1000 && time > 0) {
        setShowWarning(true);
      } else {
        setShowWarning(false);
      }
      
      // Session expired
      if (time <= 0) {
        setShowTimeoutModal(true);
      }
    }, 1000);

    // Listen for auth timeout event
    const handleTimeout = () => {
      setShowTimeoutModal(true);
    };
    window.addEventListener('auth:timeout', handleTimeout);

    return () => {
      clearInterval(interval);
      window.removeEventListener('auth:timeout', handleTimeout);
    };
  }, [isAuthenticated, getRemainingTime]);

  const formatTime = (ms) => {
    const minutes = Math.floor(ms / 60000);
    const seconds = Math.floor((ms % 60000) / 1000);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const handleStayLoggedIn = () => {
    // Activity will be tracked automatically, reset warning
    setShowWarning(false);
  };

  if (!isAuthenticated) return null;

  return (
    <>
      {/* Session indicator in header */}
      <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-800/50 rounded-lg border border-slate-700/50">
        <motion.div 
          className={`w-2 h-2 rounded-full ${
            remainingTime > 5 * 60 * 1000 ? 'bg-emerald-500' : 
            remainingTime > 2 * 60 * 1000 ? 'bg-amber-500' : 'bg-red-500'
          }`}
          animate={{ opacity: [1, 0.5, 1] }}
          transition={{ duration: 1, repeat: Infinity }}
        />
        <span className="text-slate-400 text-xs font-mono">
          {user?.name?.split(' ')[0] || 'User'}
        </span>
        <span className="text-slate-600">|</span>
        <span className={`text-xs font-mono ${
          remainingTime > 5 * 60 * 1000 ? 'text-slate-500' : 
          remainingTime > 2 * 60 * 1000 ? 'text-amber-400' : 'text-red-400'
        }`}>
          {formatTime(remainingTime)}
        </span>
      </div>

      {/* Warning popup */}
      <AnimatePresence>
        {showWarning && (
          <motion.div 
            className="fixed top-24 right-6 z-50 max-w-sm"
            initial={{ opacity: 0, x: 100 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 100 }}
          >
            <div className="relative">
              <motion.div 
                className="absolute -inset-1 bg-amber-500/30 rounded-xl blur-xl"
                animate={{ opacity: [0.3, 0.6, 0.3] }}
                transition={{ duration: 1.5, repeat: Infinity }}
              />
              <div className="relative bg-slate-900/95 backdrop-blur-xl border border-amber-500/50 rounded-xl p-4 shadow-2xl">
                <motion.div 
                  className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-amber-500 to-transparent"
                  animate={{ opacity: [0.5, 1, 0.5] }}
                  transition={{ duration: 1, repeat: Infinity }}
                />
                
                <div className="flex items-start gap-3">
                  <motion.div 
                    className="w-10 h-10 bg-amber-500/20 rounded-lg flex items-center justify-center"
                    animate={{ scale: [1, 1.1, 1] }}
                    transition={{ duration: 0.8, repeat: Infinity }}
                  >
                    <span className="text-xl">⏱️</span>
                  </motion.div>
                  
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <motion.div 
                        className="w-2 h-2 bg-amber-500 rounded-full"
                        animate={{ opacity: [1, 0.3, 1] }}
                        transition={{ duration: 0.5, repeat: Infinity }}
                      />
                      <span className="text-amber-400 text-xs font-mono font-bold">SESSION EXPIRING</span>
                    </div>
                    <p className="text-white text-sm font-medium">Your session will expire soon</p>
                    <p className="text-slate-400 text-xs font-mono mt-1">
                      Time remaining: <span className="text-amber-400">{formatTime(remainingTime)}</span>
                    </p>
                    
                    <motion.button
                      onClick={handleStayLoggedIn}
                      className="mt-3 px-4 py-2 bg-amber-500/20 border border-amber-500/50 rounded-lg text-amber-400 text-xs font-mono font-bold hover:bg-amber-500/30 transition-all"
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      🔄 STAY LOGGED IN
                    </motion.button>
                  </div>
                  
                  <motion.button
                    onClick={() => setShowWarning(false)}
                    className="text-slate-500 hover:text-white"
                    whileHover={{ scale: 1.2 }}
                  >
                    ✕
                  </motion.button>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Timeout modal */}
      <AnimatePresence>
        {showTimeoutModal && (
          <motion.div 
            className="fixed inset-0 bg-slate-950/95 backdrop-blur-xl z-[100] flex items-center justify-center p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div 
              className="relative max-w-md w-full"
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: 'spring', damping: 20 }}
            >
              <motion.div 
                className="absolute -inset-2 bg-red-500/20 rounded-2xl blur-2xl"
                animate={{ opacity: [0.3, 0.5, 0.3] }}
                transition={{ duration: 2, repeat: Infinity }}
              />
              
              <div className="relative bg-slate-900 border border-red-500/30 rounded-2xl p-8 text-center">
                <motion.div 
                  className="w-20 h-20 mx-auto mb-6 bg-red-500/20 rounded-full flex items-center justify-center border-2 border-red-500/50"
                  animate={{ scale: [1, 1.05, 1] }}
                  transition={{ duration: 1, repeat: Infinity }}
                >
                  <span className="text-4xl">🔒</span>
                </motion.div>
                
                <h2 className="text-2xl font-bold text-red-400 font-mono mb-2">SESSION EXPIRED</h2>
                <p className="text-slate-400 font-mono text-sm mb-6">
                  Your session has been terminated due to inactivity.
                  <br />Please log in again to continue.
                </p>
                
                <motion.button
                  onClick={() => {
                    logout('timeout');
                    setShowTimeoutModal(false);
                    window.location.reload();
                  }}
                  className="px-8 py-3 bg-gradient-to-r from-cyan-600 to-blue-600 rounded-lg text-white font-mono font-bold"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  🔑 LOG IN AGAIN
                </motion.button>
                
                <p className="text-slate-600 text-xs font-mono mt-4">
                  Security measure: Auto-logout after 15 minutes of inactivity
                </p>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
