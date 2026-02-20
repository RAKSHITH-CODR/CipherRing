import { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useStreamingSocket } from '../hooks/useStreamingSocket';
import StreamingGraphView from './StreamingGraphView';

/**
 * LiveDetector - Real-time streaming fraud detection with animated visualization
 */
export default function LiveDetector() {
  const fileInputRef = useRef(null);
  const [selectedFile, setSelectedFile] = useState(null);
  const [showResults, setShowResults] = useState(false);
  
  const {
    isConnected,
    isStreaming,
    streamProgress,
    nodes,
    edges,
    activeEdge,
    detections,
    stats,
    finalResults,
    error,
    streamDelay,
    setStreamDelay,
    startStream,
    stopStream,
    reset
  } = useStreamingSocket();

  const handleFileSelect = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      reset();
    }
  };

  const handleStart = () => {
    if (selectedFile) {
      startStream(selectedFile);
    }
  };

  const progressPercent = streamProgress.total > 0 
    ? Math.round((streamProgress.current / streamProgress.total) * 100) 
    : 0;

  return (
    <div className="space-y-6">
      {/* Header Card */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-r from-purple-600/20 via-blue-600/20 to-emerald-600/20 backdrop-blur-sm border border-purple-500/30 rounded-2xl p-6"
      >
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h2 className="text-2xl font-bold text-white flex items-center gap-3">
              <span className="text-3xl">⚡</span>
              Live Detection Mode
            </h2>
            <p className="text-slate-300 mt-1">
              Watch transactions stream in real-time with animated money flow visualization
            </p>
          </div>
          
          {/* Connection Status */}
          <div className={`flex items-center gap-2 px-4 py-2 rounded-full ${
            isConnected 
              ? 'bg-emerald-500/20 border border-emerald-500/50' 
              : 'bg-red-500/20 border border-red-500/50'
          }`}>
            <div className={`w-2 h-2 rounded-full ${
              isConnected ? 'bg-emerald-400 animate-pulse' : 'bg-red-400'
            }`} />
            <span className={`text-sm font-medium ${
              isConnected ? 'text-emerald-400' : 'text-red-400'
            }`}>
              {isConnected ? 'Connected' : 'Disconnected'}
            </span>
          </div>
        </div>
      </motion.div>

      {/* Controls */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-xl p-6"
      >
        <div className="flex flex-wrap items-center gap-4">
          {/* File Input */}
          <div className="flex-1 min-w-[200px]">
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileSelect}
              accept=".csv"
              className="hidden"
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={isStreaming}
              className="w-full px-4 py-3 bg-slate-700/50 hover:bg-slate-700 border border-slate-600 rounded-lg text-white transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              <span className="text-xl">📁</span>
              {selectedFile ? selectedFile.name : 'Select CSV File'}
            </button>
          </div>

          {/* Speed Control */}
          <div className="flex items-center gap-3 bg-slate-700/30 rounded-lg px-4 py-2">
            <span className="text-slate-400 text-sm">Speed:</span>
            <select
              value={streamDelay}
              onChange={(e) => setStreamDelay(Number(e.target.value))}
              disabled={isStreaming}
              className="bg-slate-700 border border-slate-600 rounded px-3 py-1 text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value={100}>Fast (100ms)</option>
              <option value={200}>Medium (200ms)</option>
              <option value={300}>Normal (300ms)</option>
              <option value={500}>Slow (500ms)</option>
              <option value={1000}>Very Slow (1s)</option>
            </select>
          </div>

          {/* Action Buttons */}
          {!isStreaming ? (
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleStart}
              disabled={!selectedFile || !isConnected}
              className="px-6 py-3 bg-gradient-to-r from-emerald-500 to-blue-500 hover:from-emerald-400 hover:to-blue-400 text-white font-semibold rounded-lg shadow-lg shadow-emerald-500/25 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              <span>▶️</span>
              Start Streaming
            </motion.button>
          ) : (
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={stopStream}
              className="px-6 py-3 bg-gradient-to-r from-red-500 to-orange-500 hover:from-red-400 hover:to-orange-400 text-white font-semibold rounded-lg shadow-lg shadow-red-500/25 flex items-center gap-2"
            >
              <span>⏹️</span>
              Stop
            </motion.button>
          )}

          <button
            onClick={reset}
            disabled={isStreaming}
            className="px-4 py-3 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-all disabled:opacity-50"
          >
            🔄 Reset
          </button>
        </div>

        {/* Error Message */}
        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="mt-4 p-3 bg-red-500/20 border border-red-500/50 rounded-lg text-red-400 flex items-center gap-2"
            >
              <span>⚠️</span>
              {error}
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* Progress Bar */}
      <AnimatePresence>
        {isStreaming && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-xl p-4"
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-slate-300 text-sm">
                Processing transactions...
              </span>
              <span className="text-white font-mono text-sm">
                {streamProgress.current} / {streamProgress.total}
              </span>
            </div>
            <div className="relative h-3 bg-slate-700 rounded-full overflow-hidden">
              <motion.div
                className="absolute inset-y-0 left-0 bg-gradient-to-r from-emerald-500 to-blue-500 rounded-full"
                initial={{ width: 0 }}
                animate={{ width: `${progressPercent}%` }}
                transition={{ duration: 0.3 }}
              />
              <motion.div
                className="absolute inset-y-0 left-0 bg-white/20 rounded-full"
                animate={{ 
                  width: [`${progressPercent}%`, `${progressPercent + 5}%`, `${progressPercent}%`],
                  opacity: [0.5, 0.2, 0.5]
                }}
                transition={{ duration: 1, repeat: Infinity }}
              />
            </div>
            <div className="flex justify-between mt-2 text-xs text-slate-500">
              <span>{progressPercent}% complete</span>
              <span>{stats?.ringsDetected || 0} rings detected</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Stats Cards */}
      {stats && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="grid grid-cols-2 md:grid-cols-4 gap-4"
        >
          <StatCard 
            icon="👥" 
            label="Accounts" 
            value={stats.totalNodes} 
            color="blue" 
          />
          <StatCard 
            icon="💸" 
            label="Transactions" 
            value={stats.totalEdges} 
            color="emerald" 
          />
          <StatCard 
            icon="⚠️" 
            label="Suspicious" 
            value={stats.suspiciousCount} 
            color="amber" 
          />
          <StatCard 
            icon="🔴" 
            label="Fraud Rings" 
            value={stats.ringsDetected} 
            color="red" 
          />
        </motion.div>
      )}

      {/* Graph View */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
        className="bg-slate-800/30 backdrop-blur-sm border border-slate-700 rounded-xl overflow-hidden"
        style={{ height: '600px' }}
      >
        <StreamingGraphView
          nodes={nodes}
          edges={edges}
          activeEdge={activeEdge}
          detections={detections}
        />
      </motion.div>

      {/* Live Detections Feed */}
      {detections.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-xl p-6"
        >
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <span className="text-xl">🚨</span>
            Live Detection Feed
          </h3>
          <div className="space-y-3 max-h-[300px] overflow-y-auto">
            <AnimatePresence>
              {[...detections].reverse().slice(0, 10).map((detection, idx) => (
                <motion.div
                  key={detection.ring_id || idx}
                  initial={{ opacity: 0, x: -50 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 50 }}
                  className="flex items-center gap-4 p-3 bg-red-500/10 border border-red-500/30 rounded-lg"
                >
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center text-xl ${
                    detection.pattern_type === 'cycle' 
                      ? 'bg-red-500/20' 
                      : 'bg-orange-500/20'
                  }`}>
                    {detection.pattern_type === 'cycle' ? '🔁' : '🌊'}
                  </div>
                  <div className="flex-1">
                    <p className="text-white font-medium">
                      {detection.ring_id}: {detection.pattern_type.replace(/_/g, ' ')}
                    </p>
                    <p className="text-slate-400 text-sm">
                      {detection.member_accounts?.slice(0, 3).join(', ')}
                      {(detection.member_accounts?.length || 0) > 3 && '...'}
                    </p>
                  </div>
                  <div className={`px-3 py-1 rounded-full text-sm font-bold ${
                    detection.risk_score >= 80 
                      ? 'bg-red-500/30 text-red-400' 
                      : 'bg-orange-500/30 text-orange-400'
                  }`}>
                    {detection.risk_score}%
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </motion.div>
      )}

      {/* Final Results */}
      <AnimatePresence>
        {finalResults && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="bg-gradient-to-br from-emerald-500/10 via-blue-500/10 to-purple-500/10 backdrop-blur-sm border border-emerald-500/30 rounded-xl p-6"
          >
            <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
              <span className="text-2xl">✅</span>
              Analysis Complete
            </h3>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              <div className="bg-slate-800/50 rounded-lg p-4 text-center">
                <p className="text-2xl font-bold text-white">
                  {finalResults.summary?.total_accounts_analyzed || 0}
                </p>
                <p className="text-slate-400 text-xs">Accounts Analyzed</p>
              </div>
              <div className="bg-slate-800/50 rounded-lg p-4 text-center">
                <p className="text-2xl font-bold text-amber-400">
                  {finalResults.summary?.suspicious_accounts_flagged || 0}
                </p>
                <p className="text-slate-400 text-xs">Suspicious Accounts</p>
              </div>
              <div className="bg-slate-800/50 rounded-lg p-4 text-center">
                <p className="text-2xl font-bold text-green-400">
                  {finalResults.summary?.false_positives_filtered || 0}
                </p>
                <p className="text-slate-400 text-xs">🛡️ FP Filtered</p>
              </div>
              <div className="bg-slate-800/50 rounded-lg p-4 text-center">
                <p className="text-2xl font-bold text-red-400">
                  {finalResults.summary?.fraud_rings_detected || 0}
                </p>
                <p className="text-slate-400 text-xs">Fraud Rings</p>
              </div>
            </div>

            <div className="flex gap-4">
              <button
                onClick={() => setShowResults(true)}
                className="px-6 py-3 bg-blue-500 hover:bg-blue-400 text-white font-semibold rounded-lg transition-all"
              >
                View Detailed Results
              </button>
              <button
                onClick={() => {
                  const blob = new Blob([JSON.stringify(finalResults, null, 2)], { type: 'application/json' });
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement('a');
                  a.href = url;
                  a.download = 'fraud_detection_results.json';
                  a.click();
                  URL.revokeObjectURL(url);
                }}
                className="px-6 py-3 bg-emerald-500 hover:bg-emerald-400 text-white font-semibold rounded-lg transition-all"
              >
                Download JSON
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Detailed Results Modal */}
      <AnimatePresence>
        {showResults && finalResults && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
            onClick={() => setShowResults(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              transition={{ type: 'spring', stiffness: 300, damping: 25 }}
              className="bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl max-w-4xl w-full max-h-[85vh] overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Modal Header */}
              <div className="bg-gradient-to-r from-purple-600/30 to-blue-600/30 border-b border-slate-700 p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-2xl font-bold text-white flex items-center gap-3">
                      <span className="text-3xl">🔍</span>
                      Detection Results
                    </h2>
                    <p className="text-slate-400 mt-1">Detailed analysis from live streaming detection</p>
                  </div>
                  <button
                    onClick={() => setShowResults(false)}
                    className="p-2 hover:bg-slate-700 rounded-lg transition-colors text-slate-400 hover:text-white"
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              </div>

              {/* Modal Content - Scrollable */}
              <div className="p-6 overflow-y-auto max-h-[calc(85vh-120px)]">
                {/* Summary Stats */}
                <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-6">
                  <div className="bg-slate-800/50 rounded-xl p-3 text-center border border-slate-700">
                    <p className="text-2xl font-bold text-cyan-400">{finalResults.summary?.total_accounts_analyzed || 0}</p>
                    <p className="text-xs text-slate-400">Accounts</p>
                  </div>
                  <div className="bg-slate-800/50 rounded-xl p-3 text-center border border-slate-700">
                    <p className="text-2xl font-bold text-blue-400">{finalResults.graph_data?.edges?.length || 0}</p>
                    <p className="text-xs text-slate-400">Transactions</p>
                  </div>
                  <div className="bg-slate-800/50 rounded-xl p-3 text-center border border-slate-700">
                    <p className="text-2xl font-bold text-amber-400">{finalResults.summary?.suspicious_accounts_flagged || 0}</p>
                    <p className="text-xs text-slate-400">Suspicious</p>
                  </div>
                  <div className="bg-slate-800/50 rounded-xl p-3 text-center border border-slate-700">
                    <p className="text-2xl font-bold text-green-400">{finalResults.summary?.false_positives_filtered || 0}</p>
                    <p className="text-xs text-slate-400">🛡️ FP Filtered</p>
                  </div>
                  <div className="bg-slate-800/50 rounded-xl p-3 text-center border border-slate-700">
                    <p className="text-2xl font-bold text-red-400">{finalResults.summary?.fraud_rings_detected || 0}</p>
                    <p className="text-xs text-slate-400">Fraud Rings</p>
                  </div>
                </div>

                {/* Fraud Rings */}
                {finalResults.fraud_rings && finalResults.fraud_rings.length > 0 && (
                  <div className="mb-6">
                    <h3 className="text-lg font-bold text-white mb-3 flex items-center gap-2">
                      <span>🚨</span> Detected Fraud Rings
                    </h3>
                    <div className="space-y-3">
                      {finalResults.fraud_rings.map((ring, idx) => (
                        <motion.div
                          key={ring.ring_id || idx}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: idx * 0.05 }}
                          className="bg-red-500/10 border border-red-500/30 rounded-xl p-4"
                        >
                          <div className="flex items-center justify-between mb-2">
                            <span className="font-mono font-bold text-red-400">{ring.ring_id}</span>
                            <span className={`px-2 py-1 rounded text-xs font-bold ${
                              ring.risk_score >= 80 ? 'bg-red-500/30 text-red-300' :
                              ring.risk_score >= 60 ? 'bg-amber-500/30 text-amber-300' :
                              'bg-yellow-500/30 text-yellow-300'
                            }`}>
                              Risk: {ring.risk_score}%
                            </span>
                          </div>
                          <div className="flex items-center gap-2 mb-2">
                            <span className="text-xs text-slate-400">Pattern:</span>
                            <span className="px-2 py-0.5 bg-purple-500/20 text-purple-300 rounded text-xs">
                              {ring.pattern_type?.replace(/_/g, ' ').toUpperCase()}
                            </span>
                          </div>
                          <div className="flex flex-wrap gap-1">
                            {ring.member_accounts?.map((acc, i) => (
                              <span key={i} className="px-2 py-0.5 bg-slate-700 text-slate-300 rounded text-xs font-mono">
                                {acc}
                              </span>
                            ))}
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Suspicious Accounts */}
                {finalResults.suspicious_accounts && Object.keys(finalResults.suspicious_accounts).length > 0 && (
                  <div>
                    <h3 className="text-lg font-bold text-white mb-3 flex items-center gap-2">
                      <span>⚠️</span> Suspicious Accounts ({Object.keys(finalResults.suspicious_accounts).length})
                    </h3>
                    <div className="bg-slate-800/50 rounded-xl border border-slate-700 overflow-hidden">
                      <table className="w-full text-sm">
                        <thead className="bg-slate-800">
                          <tr>
                            <th className="px-4 py-3 text-left text-slate-400 font-medium">Account ID</th>
                            <th className="px-4 py-3 text-left text-slate-400 font-medium">Suspicion Score</th>
                            <th className="px-4 py-3 text-left text-slate-400 font-medium">Linked Rings</th>
                            <th className="px-4 py-3 text-left text-slate-400 font-medium">Patterns</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-700">
                          {Object.entries(finalResults.suspicious_accounts).slice(0, 20).map(([accId, data], idx) => (
                            <tr key={accId} className="hover:bg-slate-700/30 transition-colors">
                              <td className="px-4 py-3 font-mono text-white">{accId}</td>
                              <td className="px-4 py-3">
                                <div className="flex items-center gap-2">
                                  <div className="flex-1 h-2 bg-slate-700 rounded-full overflow-hidden max-w-[100px]">
                                    <div 
                                      className={`h-full rounded-full ${
                                        data.suspicion_score >= 80 ? 'bg-red-500' :
                                        data.suspicion_score >= 50 ? 'bg-amber-500' :
                                        'bg-yellow-500'
                                      }`}
                                      style={{ width: `${data.suspicion_score}%` }}
                                    />
                                  </div>
                                  <span className="text-white font-bold">{data.suspicion_score}</span>
                                </div>
                              </td>
                              <td className="px-4 py-3">
                                <div className="flex flex-wrap gap-1">
                                  {data.linked_rings?.map((ring, i) => (
                                    <span key={i} className="px-1.5 py-0.5 bg-red-500/20 text-red-300 rounded text-xs font-mono">
                                      {ring}
                                    </span>
                                  ))}
                                </div>
                              </td>
                              <td className="px-4 py-3">
                                <div className="flex flex-wrap gap-1">
                                  {data.patterns?.slice(0, 2).map((pat, i) => (
                                    <span key={i} className="px-1.5 py-0.5 bg-purple-500/20 text-purple-300 rounded text-xs">
                                      {pat.replace(/_/g, ' ')}
                                    </span>
                                  ))}
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                      {Object.keys(finalResults.suspicious_accounts).length > 20 && (
                        <div className="px-4 py-2 bg-slate-800 text-center text-slate-400 text-sm">
                          +{Object.keys(finalResults.suspicious_accounts).length - 20} more accounts
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* No Results State */}
                {(!finalResults.fraud_rings || finalResults.fraud_rings.length === 0) && 
                 (!finalResults.suspicious_accounts || Object.keys(finalResults.suspicious_accounts).length === 0) && (
                  <div className="text-center py-12">
                    <span className="text-6xl">✅</span>
                    <h3 className="text-xl font-bold text-white mt-4">No Suspicious Activity Detected</h3>
                    <p className="text-slate-400 mt-2">All transactions appear to be legitimate</p>
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function StatCard({ icon, label, value, color }) {
  const colors = {
    blue: 'from-blue-500/20 to-blue-600/10 border-blue-500/30',
    emerald: 'from-emerald-500/20 to-emerald-600/10 border-emerald-500/30',
    amber: 'from-amber-500/20 to-amber-600/10 border-amber-500/30',
    red: 'from-red-500/20 to-red-600/10 border-red-500/30'
  };

  return (
    <motion.div
      whileHover={{ scale: 1.02 }}
      className={`bg-gradient-to-br ${colors[color]} backdrop-blur-sm border rounded-xl p-4 text-center`}
    >
      <span className="text-2xl">{icon}</span>
      <p className="text-2xl font-bold text-white mt-1">{value}</p>
      <p className="text-slate-400 text-sm">{label}</p>
    </motion.div>
  );
}
