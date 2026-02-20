import { motion, AnimatePresence } from 'framer-motion';
import { useState } from 'react';

export default function DownloadJSON({ data }) {
  const [isDownloading, setIsDownloading] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  if (!data) return null;

  const handleDownload = async () => {
    setIsDownloading(true);
    
    await new Promise(resolve => setTimeout(resolve, 800));
    
    const outputData = {
      suspicious_accounts: data.suspicious_accounts,
      fraud_rings: data.fraud_rings,
      summary: data.summary
    };
    
    const blob = new Blob([JSON.stringify(outputData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'fraud_detection_output.json';
    a.click();
    URL.revokeObjectURL(url);
    
    setIsDownloading(false);
    setShowSuccess(true);
    setTimeout(() => setShowSuccess(false), 3000);
  };

  return (
    <motion.div 
      className="bg-slate-900/80 backdrop-blur-xl border border-slate-700/50 rounded-2xl overflow-hidden"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <div className="p-4 border-b border-slate-700/50 flex items-center gap-2">
        <motion.div 
          className="w-3 h-3 bg-emerald-500 rounded-full"
          animate={{ scale: [1, 1.3, 1] }}
          transition={{ duration: 2, repeat: Infinity }}
        />
        <span className="font-mono text-emerald-400 font-bold">EXPORT_MODULE</span>
      </div>

      <div className="p-6">
        <p className="text-slate-400 mb-6 font-mono text-sm">
          {">"} Download complete analysis report in JSON format for automated evaluation systems.
        </p>

        <div className="bg-slate-950/50 rounded-xl p-4 mb-6 border border-slate-700 font-mono text-sm">
          <div className="flex items-center justify-between mb-3">
            <span className="text-slate-500 text-xs">OUTPUT_PREVIEW</span>
            <span className="text-cyan-400 text-xs">fraud_detection_output.json</span>
          </div>
          
          <div className="space-y-1 text-xs">
            <div className="text-slate-500">{'{'}</div>
            <div className="pl-4">
              <span className="text-emerald-400">"suspicious_accounts"</span>
              <span className="text-slate-500">: [</span>
              <span className="text-amber-400">{data.suspicious_accounts.length}</span>
              <span className="text-slate-500">],</span>
            </div>
            <div className="pl-4">
              <span className="text-emerald-400">"fraud_rings"</span>
              <span className="text-slate-500">: [</span>
              <span className="text-red-400">{data.fraud_rings.length}</span>
              <span className="text-slate-500">],</span>
            </div>
            <div className="pl-4">
              <span className="text-emerald-400">"summary"</span>
              <span className="text-slate-500">: {'{'}</span>
            </div>
            <div className="pl-8">
              <span className="text-cyan-400">"accounts_analyzed"</span>
              <span className="text-slate-500">: </span>
              <span className="text-white">{data.summary.total_accounts_analyzed}</span>
            </div>
            <div className="pl-8">
              <span className="text-cyan-400">"threats_found"</span>
              <span className="text-slate-500">: </span>
              <span className="text-amber-400">{data.summary.suspicious_accounts_flagged}</span>
            </div>
            <div className="pl-8">
              <span className="text-cyan-400">"false_positives_filtered"</span>
              <span className="text-slate-500">: </span>
              <span className="text-green-400">{data.summary.false_positives_filtered || 0}</span>
            </div>
            <div className="pl-8">
              <span className="text-cyan-400">"rings_detected"</span>
              <span className="text-slate-500">: </span>
              <span className="text-red-400">{data.summary.fraud_rings_detected}</span>
            </div>
            <div className="pl-4 text-slate-500">{'}'}</div>
            <div className="text-slate-500">{'}'}</div>
          </div>
        </div>

        <motion.button
          onClick={handleDownload}
          disabled={isDownloading}
          className="w-full py-4 rounded-xl font-mono text-white bg-gradient-to-r from-emerald-600 to-cyan-600 hover:from-emerald-500 hover:to-cyan-500 disabled:from-slate-700 disabled:to-slate-700 transition-all shadow-lg shadow-emerald-500/20 relative overflow-hidden"
          whileHover={{ scale: 1.01 }}
          whileTap={{ scale: 0.99 }}
        >
          <motion.div 
            className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/10 to-white/0"
            animate={{ x: ['-100%', '100%'] }}
            transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
          />
          
          <AnimatePresence mode="wait">
            {isDownloading ? (
              <motion.span
                key="loading"
                className="flex items-center justify-center gap-3"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                <motion.span 
                  className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full"
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                />
                [GENERATING...]
              </motion.span>
            ) : showSuccess ? (
              <motion.span
                key="success"
                className="flex items-center justify-center gap-2"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0 }}
              >
                <span>✓</span>
                [DOWNLOAD_COMPLETE]
              </motion.span>
            ) : (
              <motion.span
                key="download"
                className="flex items-center justify-center gap-2 relative z-10"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                <motion.span
                  animate={{ y: [0, 3, 0] }}
                  transition={{ duration: 1, repeat: Infinity }}
                >
                  ↓
                </motion.span>
                [DOWNLOAD_REPORT]
              </motion.span>
            )}
          </AnimatePresence>
        </motion.button>

        <div className="mt-4 text-center text-xs font-mono text-slate-600">
          RIFT 2026 // COMPATIBLE FORMAT
        </div>
      </div>
    </motion.div>
  );
}
