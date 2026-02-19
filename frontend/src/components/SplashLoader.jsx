import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export default function SplashLoader({ onComplete }) {
  const [progress, setProgress] = useState(0);
  const [loadingText, setLoadingText] = useState('INITIALIZING SYSTEM');
  const [showLogo, setShowLogo] = useState(false);

  const loadingStages = [
    'INITIALIZING SYSTEM',
    'LOADING NEURAL NETWORKS',
    'CALIBRATING DETECTION ALGORITHMS',
    'ESTABLISHING SECURE CONNECTION',
    'SYSTEM READY'
  ];

  useEffect(() => {
    setTimeout(() => setShowLogo(true), 300);
    
    const progressInterval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 100) {
          clearInterval(progressInterval);
          setTimeout(() => onComplete(), 500);
          return 100;
        }
        return prev + 2;
      });
    }, 80);

    return () => clearInterval(progressInterval);
  }, [onComplete]);

  useEffect(() => {
    const stageIndex = Math.min(
      Math.floor(progress / 20),
      loadingStages.length - 1
    );
    setLoadingText(loadingStages[stageIndex]);
  }, [progress]);

  return (
    <motion.div 
      className="fixed inset-0 z-[100] bg-slate-950 flex items-center justify-center overflow-hidden"
      exit={{ opacity: 0 }}
      transition={{ duration: 0.5 }}
    >
      {/* Animated background grid */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(6,182,212,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(6,182,212,0.03)_1px,transparent_1px)] bg-[size:60px_60px]" />
      
      {/* Scanning lines */}
      <motion.div 
        className="absolute inset-0 overflow-hidden opacity-30"
        initial={{ opacity: 0 }}
        animate={{ opacity: 0.3 }}
      >
        {[...Array(5)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-full h-px bg-gradient-to-r from-transparent via-cyan-500 to-transparent"
            initial={{ top: '-10%' }}
            animate={{ top: '110%' }}
            transition={{ 
              duration: 3, 
              repeat: Infinity, 
              delay: i * 0.6,
              ease: 'linear'
            }}
          />
        ))}
      </motion.div>

      {/* Corner decorations */}
      <div className="absolute top-8 left-8 w-16 h-16 border-l-2 border-t-2 border-cyan-500/50" />
      <div className="absolute top-8 right-8 w-16 h-16 border-r-2 border-t-2 border-cyan-500/50" />
      <div className="absolute bottom-8 left-8 w-16 h-16 border-l-2 border-b-2 border-cyan-500/50" />
      <div className="absolute bottom-8 right-8 w-16 h-16 border-r-2 border-b-2 border-cyan-500/50" />

      {/* Glowing orbs */}
      <motion.div 
        className="absolute top-1/4 left-1/4 w-64 h-64 bg-cyan-500/20 rounded-full blur-3xl"
        animate={{ 
          scale: [1, 1.2, 1],
          opacity: [0.2, 0.4, 0.2]
        }}
        transition={{ duration: 3, repeat: Infinity }}
      />
      <motion.div 
        className="absolute bottom-1/4 right-1/4 w-64 h-64 bg-purple-500/20 rounded-full blur-3xl"
        animate={{ 
          scale: [1.2, 1, 1.2],
          opacity: [0.3, 0.2, 0.3]
        }}
        transition={{ duration: 4, repeat: Infinity }}
      />

      <div className="relative z-10 flex flex-col items-center">
        {/* Main Logo/Icon */}
        <AnimatePresence>
          {showLogo && (
            <motion.div
              initial={{ scale: 0, rotate: -180 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ type: 'spring', duration: 1 }}
              className="relative mb-8"
            >
              {/* Outer rotating ring */}
              <motion.div 
                className="absolute inset-0 w-40 h-40"
                animate={{ rotate: 360 }}
                transition={{ duration: 8, repeat: Infinity, ease: 'linear' }}
              >
                <svg viewBox="0 0 160 160" className="w-full h-full">
                  <circle cx="80" cy="80" r="75" fill="none" stroke="url(#gradient1)" strokeWidth="2" strokeDasharray="20 10" />
                  <defs>
                    <linearGradient id="gradient1" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#06b6d4" />
                      <stop offset="50%" stopColor="#8b5cf6" />
                      <stop offset="100%" stopColor="#06b6d4" />
                    </linearGradient>
                  </defs>
                </svg>
              </motion.div>

              {/* Middle rotating ring */}
              <motion.div 
                className="absolute inset-4 w-32 h-32"
                animate={{ rotate: -360 }}
                transition={{ duration: 6, repeat: Infinity, ease: 'linear' }}
              >
                <svg viewBox="0 0 128 128" className="w-full h-full">
                  <circle cx="64" cy="64" r="58" fill="none" stroke="#06b6d4" strokeWidth="1" strokeDasharray="10 5" opacity="0.5" />
                </svg>
              </motion.div>

              {/* Core icon */}
              <motion.div 
                className="w-40 h-40 bg-gradient-to-br from-cyan-500 via-blue-600 to-purple-600 rounded-3xl flex items-center justify-center relative overflow-hidden"
                animate={{ 
                  boxShadow: [
                    '0 0 30px rgba(6,182,212,0.3)',
                    '0 0 60px rgba(6,182,212,0.5)',
                    '0 0 30px rgba(6,182,212,0.3)'
                  ]
                }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                <motion.div 
                  className="absolute inset-0 bg-gradient-to-t from-transparent to-white/20"
                  animate={{ opacity: [0.3, 0.5, 0.3] }}
                  transition={{ duration: 2, repeat: Infinity }}
                />
                <svg className="w-20 h-20 text-white relative z-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Brand Name */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="text-center mb-8"
        >
          <h1 className="text-4xl md:text-5xl font-black mb-2">
            <span className="bg-gradient-to-r from-cyan-400 via-blue-400 to-purple-400 bg-clip-text text-transparent">
              CIPHER
            </span>
            <span className="text-white">RING</span>
          </h1>
          <p className="text-slate-500 font-mono text-sm tracking-widest">
            FINANCIAL THREAT INTELLIGENCE
          </p>
        </motion.div>

        {/* Progress bar container */}
        <motion.div
          initial={{ opacity: 0, width: 0 }}
          animate={{ opacity: 1, width: '300px' }}
          transition={{ delay: 0.7 }}
          className="mb-6"
        >
          <div className="relative h-2 bg-slate-800 rounded-full overflow-hidden border border-slate-700">
            <motion.div 
              className="absolute inset-0 bg-gradient-to-r from-cyan-500 via-blue-500 to-purple-500"
              style={{ width: `${progress}%` }}
              transition={{ duration: 0.1 }}
            />
            <motion.div 
              className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent"
              animate={{ x: ['-100%', '200%'] }}
              transition={{ duration: 1.5, repeat: Infinity, ease: 'linear' }}
            />
          </div>
        </motion.div>

        {/* Progress percentage */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
          className="flex items-center gap-4 mb-4"
        >
          <span className="text-3xl font-mono font-bold text-cyan-400">
            {Math.floor(progress)}%
          </span>
        </motion.div>

        {/* Loading text */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.9 }}
          className="flex items-center gap-2"
        >
          <motion.span 
            className="w-2 h-2 bg-cyan-500 rounded-full"
            animate={{ opacity: [1, 0.3, 1] }}
            transition={{ duration: 0.8, repeat: Infinity }}
          />
          <span className="font-mono text-sm text-slate-400 tracking-wider">
            {loadingText}
          </span>
          <motion.span
            animate={{ opacity: [0, 1, 0] }}
            transition={{ duration: 0.5, repeat: Infinity }}
            className="text-cyan-400"
          >
            _
          </motion.span>
        </motion.div>

        {/* Terminal-style log */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.2 }}
          className="mt-8 font-mono text-xs text-slate-600 space-y-1"
        >
          <motion.div
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: progress > 20 ? 0.5 : 0, x: 0 }}
          >
            [OK] Neural network modules loaded
          </motion.div>
          <motion.div
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: progress > 40 ? 0.5 : 0, x: 0 }}
          >
            [OK] Graph analysis engine initialized
          </motion.div>
          <motion.div
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: progress > 60 ? 0.5 : 0, x: 0 }}
          >
            [OK] Fraud detection algorithms ready
          </motion.div>
          <motion.div
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: progress > 80 ? 0.5 : 0, x: 0 }}
          >
            [OK] Secure connection established
          </motion.div>
        </motion.div>
      </div>

      {/* Bottom branding */}
      <motion.div 
        className="absolute bottom-8 text-center"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.5 }}
      >
        <p className="text-slate-600 text-xs font-mono">
          RIFT 2026 HACKATHON SUBMISSION
        </p>
      </motion.div>
    </motion.div>
  );
}
