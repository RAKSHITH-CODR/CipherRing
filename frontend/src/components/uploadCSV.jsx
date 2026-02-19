import { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';

// Use environment variable or fallback to localhost
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

export default function UploadCSV({ setOutput, setLoading }) {
  const [file, setFile] = useState(null);
  const [dragOver, setDragOver] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState('');
  const inputRef = useRef(null);

  const handleFile = (f) => {
    if (f && f.name.endsWith('.csv')) {
      setFile(f);
      setError('');
    } else {
      setError('Invalid file format. Please upload a CSV file.');
    }
  };

  const handleUpload = async () => {
    if (!file) return;
    
    setLoading(true);
    setIsUploading(true);
    setUploadProgress(0);
    setError('');
    
    const formData = new FormData();
    formData.append('file', file);
    
    try {
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return prev;
          }
          return prev + Math.random() * 15;
        });
      }, 200);

      const res = await axios.post(`${API_URL}/upload`, formData);
      
      clearInterval(progressInterval);
      setUploadProgress(100);
      
      setTimeout(() => {
        setOutput(res.data);
        setLoading(false);
        setIsUploading(false);
      }, 500);
    } catch (err) {
      console.error(err);
      // Better error message
      let errorMsg = 'Analysis failed. ';
      if (err.code === 'ERR_NETWORK') {
        errorMsg += 'Backend server not reachable. Make sure backend is running on port 5000.';
      } else if (err.response?.data?.error) {
        errorMsg += err.response.data.error;
      } else {
        errorMsg += 'Please try again.';
      }
      setError(errorMsg);
      setLoading(false);
      setIsUploading(false);
    }
  };

  return (
    <motion.div 
      className="relative"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <motion.div 
        className={`relative border-2 border-dashed rounded-2xl p-8 transition-all duration-300 overflow-hidden ${
          dragOver 
            ? 'border-cyan-500 bg-cyan-500/10' 
            : file 
              ? 'border-emerald-500/50 bg-emerald-500/5' 
              : 'border-slate-700 hover:border-cyan-500/50 bg-slate-900/50'
        }`}
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => { e.preventDefault(); setDragOver(false); handleFile(e.dataTransfer.files[0]); }}
      >
        <motion.div 
          className="absolute inset-0 bg-gradient-to-r from-cyan-500/0 via-cyan-500/5 to-cyan-500/0"
          animate={{ x: ['-100%', '100%'] }}
          transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}
        />

        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-cyan-500/50 to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-cyan-500/50 to-transparent" />

        <input
          ref={inputRef}
          type="file"
          accept=".csv"
          className="hidden"
          onChange={(e) => handleFile(e.target.files[0])}
        />

        <div className="relative z-10">
          <AnimatePresence mode="wait">
            {!file ? (
              <motion.div 
                key="upload"
                className="text-center"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
              >
                <motion.div 
                  className="w-20 h-20 mx-auto mb-6 relative"
                  animate={{ y: dragOver ? -10 : 0 }}
                >
                  <motion.div 
                    className="absolute inset-0 bg-cyan-500/20 rounded-2xl"
                    animate={{ scale: [1, 1.1, 1], opacity: [0.5, 0.8, 0.5] }}
                    transition={{ duration: 2, repeat: Infinity }}
                  />
                  <div className="relative w-full h-full bg-slate-800 rounded-2xl flex items-center justify-center border border-cyan-500/30">
                    <motion.svg 
                      className="w-10 h-10 text-cyan-400" 
                      fill="none" 
                      stroke="currentColor" 
                      viewBox="0 0 24 24"
                      animate={{ y: [0, -5, 0] }}
                      transition={{ duration: 1.5, repeat: Infinity }}
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                    </motion.svg>
                  </div>
                </motion.div>

                <h3 className="text-xl font-bold text-white mb-2 font-mono">
                  <span className="text-cyan-400">{">"}</span> UPLOAD_TRANSACTION_DATA
                </h3>
                <p className="text-slate-400 mb-6 font-mono text-sm">
                  Drag & drop CSV file or click to browse
                </p>
                
                <motion.button
                  onClick={() => inputRef.current?.click()}
                  className="px-8 py-3 bg-slate-800 border border-cyan-500/50 rounded-xl font-mono text-cyan-400 hover:bg-cyan-500/10 transition-all"
                  whileHover={{ scale: 1.02, borderColor: '#06b6d4' }}
                  whileTap={{ scale: 0.98 }}
                >
                  [SELECT_FILE]
                </motion.button>

                <div className="flex flex-wrap justify-center gap-2 mt-6">
                  {['sender_id', 'receiver_id', 'amount', 'timestamp'].map((col, i) => (
                    <motion.span 
                      key={col}
                      className="px-3 py-1 bg-slate-800/80 border border-slate-700 rounded text-xs font-mono text-slate-500"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.5 + i * 0.1 }}
                    >
                      {col}
                    </motion.span>
                  ))}
                </div>
              </motion.div>
            ) : (
              <motion.div 
                key="selected"
                className="text-center"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
              >
                <motion.div 
                  className="w-20 h-20 mx-auto mb-6 bg-emerald-500/20 rounded-2xl flex items-center justify-center border border-emerald-500/50"
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: 'spring', stiffness: 200 }}
                >
                  <motion.svg 
                    className="w-10 h-10 text-emerald-400" 
                    fill="none" 
                    stroke="currentColor" 
                    viewBox="0 0 24 24"
                    initial={{ pathLength: 0 }}
                    animate={{ pathLength: 1 }}
                    transition={{ duration: 0.5 }}
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </motion.svg>
                </motion.div>

                <div className="mb-4">
                  <div className="text-emerald-400 font-mono font-bold mb-1">FILE_LOADED</div>
                  <div className="inline-flex items-center gap-2 px-4 py-2 bg-slate-800 rounded-lg border border-slate-700">
                    <svg className="w-4 h-4 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    <span className="text-white font-mono text-sm">{file.name}</span>
                    <span className="text-slate-500 text-xs font-mono">({(file.size / 1024).toFixed(1)} KB)</span>
                  </div>
                </div>

                <div className="flex justify-center gap-3">
                  <motion.button
                    onClick={() => setFile(null)}
                    className="px-6 py-2.5 bg-slate-800 border border-slate-600 rounded-xl font-mono text-slate-400 hover:text-white transition-all"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    [CLEAR]
                  </motion.button>
                  <motion.button
                    onClick={handleUpload}
                    disabled={isUploading}
                    className="px-8 py-2.5 bg-gradient-to-r from-cyan-600 to-blue-600 rounded-xl font-mono text-white shadow-lg shadow-cyan-500/25 disabled:opacity-50 relative overflow-hidden"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <motion.div 
                      className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0"
                      animate={{ x: ['-100%', '100%'] }}
                      transition={{ duration: 1.5, repeat: Infinity, repeatDelay: 0.5 }}
                    />
                    <span className="relative">
                      {isUploading ? '[ANALYZING...]' : '[INITIATE_SCAN]'}
                    </span>
                  </motion.button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <AnimatePresence>
          {isUploading && (
            <motion.div 
              className="absolute bottom-0 left-0 right-0 h-1 bg-slate-800"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <motion.div 
                className="h-full bg-gradient-to-r from-cyan-500 to-blue-500"
                initial={{ width: 0 }}
                animate={{ width: `${uploadProgress}%` }}
                transition={{ duration: 0.3 }}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      <AnimatePresence>
        {error && (
          <motion.div 
            className="mt-4 p-4 bg-red-500/10 border border-red-500/30 rounded-xl flex items-center gap-3"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
          >
            <svg className="w-5 h-5 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span className="text-red-400 font-mono text-sm">{error}</span>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex justify-center gap-6 mt-4 text-xs font-mono text-slate-600">
        <span>FORMAT: CSV</span>
        <span>|</span>
        <span>REQUIRED: sender_id, receiver_id, amount, timestamp</span>
      </div>
    </motion.div>
  );
}
