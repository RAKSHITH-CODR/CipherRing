import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import UploadCSV from './components/UploadCSV.jsx';
import GraphView from './components/GraphView.jsx';
import FraudTable from './components/FraudTable.jsx';
import DownloadJSON from './components/DownloadJSON.jsx';

function GlitchText({ text, className }) {
  const [glitch, setGlitch] = useState(false);
  
  useEffect(() => {
    const interval = setInterval(() => {
      setGlitch(true);
      setTimeout(() => setGlitch(false), 200);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  return (
    <span className={`relative ${className}`}>
      {glitch && (
        <>
          <span className="absolute inset-0 text-cyan-400 -translate-x-0.5 translate-y-0.5 opacity-70">{text}</span>
          <span className="absolute inset-0 text-red-400 translate-x-0.5 -translate-y-0.5 opacity-70">{text}</span>
        </>
      )}
      {text}
    </span>
  );
}

function MatrixRain() {
  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden opacity-20">
      {[...Array(20)].map((_, i) => (
        <motion.div 
          key={i}
          className="absolute text-emerald-500 text-xs font-mono whitespace-nowrap"
          style={{ left: `${i * 5}%` }}
          initial={{ y: '-100%', opacity: 0 }}
          animate={{ y: '100vh', opacity: [0, 1, 1, 0] }}
          transition={{ duration: 8 + Math.random() * 5, repeat: Infinity, delay: Math.random() * 3, ease: 'linear' }}
        >
          {[...Array(30)].map((_, j) => (
            <div key={j}>{Math.random() > 0.5 ? '1' : '0'}</div>
          ))}
        </motion.div>
      ))}
    </div>
  );
}

function CyberGrid() {
  return (
    <div className="fixed inset-0 pointer-events-none">
      <div className="absolute inset-0 bg-[linear-gradient(rgba(6,182,212,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(6,182,212,0.03)_1px,transparent_1px)] bg-[size:50px_50px]" />
      <div className="absolute bottom-0 left-0 right-0 h-96 bg-gradient-to-t from-cyan-900/10 to-transparent" />
      <motion.div 
        className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-cyan-500 to-transparent"
        animate={{ opacity: [0.3, 0.8, 0.3] }}
        transition={{ duration: 2, repeat: Infinity }}
      />
    </div>
  );
}

function PulsingDot({ color = 'bg-cyan-500', size = 'w-2 h-2' }) {
  return (
    <span className="relative flex">
      <motion.span 
        className={`${size} ${color} rounded-full`}
        animate={{ scale: [1, 1.5, 1], opacity: [1, 0.5, 1] }}
        transition={{ duration: 1.5, repeat: Infinity }}
      />
      <span className={`absolute inset-0 ${size} ${color} rounded-full`} />
    </span>
  );
}

function StatCard({ label, value, icon, color, delay }) {
  const [count, setCount] = useState(0);
  
  useEffect(() => {
    let start = 0;
    const increment = value / 60;
    const timer = setInterval(() => {
      start += increment;
      if (start >= value) {
        setCount(value);
        clearInterval(timer);
      } else {
        setCount(Math.floor(start));
      }
    }, 16);
    return () => clearInterval(timer);
  }, [value]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 30, scale: 0.9 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ delay, type: 'spring', stiffness: 100 }}
      whileHover={{ scale: 1.05, y: -10 }}
      className="relative group cursor-pointer"
    >
      <motion.div 
        className={`absolute -inset-0.5 bg-gradient-to-r ${color} rounded-2xl blur opacity-30 group-hover:opacity-60 transition-opacity duration-500`}
        animate={{ opacity: [0.2, 0.4, 0.2] }}
        transition={{ duration: 3, repeat: Infinity }}
      />
      <div className="relative bg-slate-900/90 backdrop-blur-xl border border-slate-700/50 rounded-2xl p-6 overflow-hidden">
        <motion.div 
          className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-current to-transparent"
          style={{ color: color.includes('cyan') ? '#06b6d4' : color.includes('red') ? '#ef4444' : color.includes('amber') ? '#f59e0b' : '#10b981' }}
          animate={{ x: ['-100%', '100%'] }}
          transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
        />
        <div className="flex items-start justify-between mb-4">
          <span className="text-3xl">{icon}</span>
          <div className={`px-2 py-1 rounded text-xs font-mono ${color.includes('red') ? 'bg-red-500/20 text-red-400' : 'bg-cyan-500/20 text-cyan-400'}`}>
            LIVE
          </div>
        </div>
        <div className="text-slate-400 text-sm mb-1 font-mono uppercase tracking-wider">{label}</div>
        <motion.div 
          className="text-4xl font-bold text-white font-mono"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          {typeof value === 'number' && value % 1 !== 0 ? count.toFixed(2) : count}
        </motion.div>
      </div>
    </motion.div>
  );
}

export default function App() {
  const [output, setOutput] = useState(null);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('graph');
  const [currentTime, setCurrentTime] = useState(new Date());
  const [systemStatus, setSystemStatus] = useState('SCANNING');

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (loading) setSystemStatus('ANALYZING');
    else if (output) setSystemStatus('THREAT_DETECTED');
    else setSystemStatus('READY');
  }, [loading, output]);

  return (
    <div className="min-h-screen bg-slate-950 text-white overflow-hidden">
      <CyberGrid />
      <MatrixRain />
      
      <div className="fixed inset-0 bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 -z-20" />
      <motion.div 
        className="fixed top-0 right-0 w-1/2 h-1/2 bg-cyan-500/5 blur-3xl -z-10"
        animate={{ opacity: [0.3, 0.5, 0.3], scale: [1, 1.1, 1] }}
        transition={{ duration: 5, repeat: Infinity }}
      />
      <motion.div 
        className="fixed bottom-0 left-0 w-1/2 h-1/2 bg-purple-500/5 blur-3xl -z-10"
        animate={{ opacity: [0.2, 0.4, 0.2], scale: [1.1, 1, 1.1] }}
        transition={{ duration: 6, repeat: Infinity }}
      />

      <nav className="fixed top-0 left-0 right-0 z-50 bg-slate-900/80 backdrop-blur-xl border-b border-cyan-500/20">
        <div className="max-w-7xl mx-auto px-6 py-3 flex items-center justify-between">
          <motion.div 
            className="flex items-center gap-4"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
          >
            <motion.div 
              className="relative w-10 h-10 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-xl flex items-center justify-center"
              animate={{ rotate: [0, 360] }}
              transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
            >
              <motion.div 
                className="absolute inset-0 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-xl"
                animate={{ opacity: [1, 0.5, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
              />
              <svg className="w-6 h-6 text-white relative z-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </motion.div>
            <div>
              <GlitchText text="MULE_DETECT" className="text-lg font-bold font-mono text-cyan-400" />
              <div className="text-[10px] text-slate-500 font-mono tracking-widest">FINANCIAL THREAT INTELLIGENCE</div>
            </div>
          </motion.div>
          
          <div className="flex items-center gap-6">
            <motion.div 
              className="hidden md:flex items-center gap-2 px-4 py-2 bg-slate-800/50 rounded-lg border border-slate-700"
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <PulsingDot color={systemStatus === 'THREAT_DETECTED' ? 'bg-red-500' : systemStatus === 'ANALYZING' ? 'bg-amber-500' : 'bg-emerald-500'} />
              <span className="text-xs font-mono text-slate-300">STATUS:</span>
              <span className={`text-xs font-mono font-bold ${
                systemStatus === 'THREAT_DETECTED' ? 'text-red-400' : 
                systemStatus === 'ANALYZING' ? 'text-amber-400' : 'text-emerald-400'
              }`}>
                {systemStatus}
              </span>
            </motion.div>
            
            <motion.div 
              className="hidden lg:block text-right"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
            >
              <div className="text-2xl font-mono text-cyan-400">
                {currentTime.toLocaleTimeString('en-US', { hour12: false })}
              </div>
              <div className="text-[10px] text-slate-500 font-mono">
                {currentTime.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' }).toUpperCase()}
              </div>
            </motion.div>
          </div>
        </div>
      </nav>

      <main className="pt-24 pb-12 px-6 max-w-7xl mx-auto relative z-10">
        <motion.div 
          className="text-center mb-12"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <motion.div 
            className="inline-flex items-center gap-2 px-4 py-2 bg-cyan-500/10 border border-cyan-500/30 rounded-full mb-6"
            animate={{ borderColor: ['rgba(6,182,212,0.3)', 'rgba(6,182,212,0.6)', 'rgba(6,182,212,0.3)'] }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            <motion.span 
              className="w-2 h-2 bg-cyan-400 rounded-full"
              animate={{ scale: [1, 1.5, 1] }}
              transition={{ duration: 1, repeat: Infinity }}
            />
            <span className="text-cyan-400 text-sm font-mono">RIFT 2026 HACKATHON</span>
          </motion.div>
          
          <h1 className="text-5xl md:text-7xl font-black mb-4 relative">
            <GlitchText 
              text="MONEY MULING" 
              className="bg-gradient-to-r from-cyan-400 via-blue-400 to-purple-400 bg-clip-text text-transparent"
            />
            <br />
            <span className="text-white">DETECTION</span>
            <motion.span 
              className="absolute -right-4 top-0 text-cyan-500 text-6xl"
              animate={{ opacity: [0, 1, 0] }}
              transition={{ duration: 1, repeat: Infinity }}
            >
              _
            </motion.span>
          </h1>
          
          <motion.p 
            className="text-slate-400 text-lg max-w-2xl mx-auto font-mono"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
          >
            {">"} Advanced graph-based threat intelligence system for identifying 
            <span className="text-red-400"> suspicious financial networks</span> and 
            <span className="text-amber-400"> money laundering patterns</span>
          </motion.p>

          <motion.div 
            className="flex justify-center gap-3 mt-6"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
          >
            {['CYCLE_DETECTION', 'SMURFING_ANALYSIS', 'SHELL_NETWORKS'].map((tag, i) => (
              <motion.span 
                key={tag}
                className="px-3 py-1 bg-slate-800/80 border border-slate-700 rounded text-xs font-mono text-slate-400"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6 + i * 0.1 }}
                whileHover={{ borderColor: '#06b6d4', color: '#06b6d4' }}
              >
                {tag}
              </motion.span>
            ))}
          </motion.div>
        </motion.div>

        <motion.div 
          className="mb-12"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <UploadCSV setOutput={setOutput} setLoading={setLoading} />
        </motion.div>

        <AnimatePresence mode="wait">
          {loading && (
            <motion.div 
              className="flex flex-col items-center justify-center py-24"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              key="loader"
            >
              <div className="relative w-32 h-32">
                <motion.div 
                  className="absolute inset-0 border-4 border-cyan-500/20 rounded-full"
                />
                <motion.div 
                  className="absolute inset-0 border-4 border-transparent border-t-cyan-500 rounded-full"
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                />
                <motion.div 
                  className="absolute inset-4 border-4 border-transparent border-t-purple-500 border-b-purple-500 rounded-full"
                  animate={{ rotate: -360 }}
                  transition={{ duration: 1.5, repeat: Infinity, ease: 'linear' }}
                />
                <motion.div 
                  className="absolute inset-8 border-4 border-transparent border-t-pink-500 rounded-full"
                  animate={{ rotate: 360 }}
                  transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
                />
                <motion.div 
                  className="absolute inset-0 flex items-center justify-center"
                  animate={{ scale: [1, 1.1, 1] }}
                  transition={{ duration: 1, repeat: Infinity }}
                >
                  <span className="text-3xl">🔍</span>
                </motion.div>
              </div>
              <motion.div 
                className="mt-8 text-xl font-mono text-cyan-400"
                animate={{ opacity: [0.5, 1, 0.5] }}
                transition={{ duration: 1.5, repeat: Infinity }}
              >
                SCANNING TRANSACTIONS...
              </motion.div>
              <motion.div className="flex gap-1 mt-4">
                {[0, 1, 2, 3, 4].map(i => (
                  <motion.div
                    key={i}
                    className="w-3 h-3 bg-cyan-500 rounded-sm"
                    animate={{ scaleY: [1, 2, 1], opacity: [0.5, 1, 0.5] }}
                    transition={{ duration: 0.5, repeat: Infinity, delay: i * 0.1 }}
                  />
                ))}
              </motion.div>
              <div className="mt-6 font-mono text-sm text-slate-500">
                <motion.span animate={{ opacity: [0, 1] }} transition={{ duration: 0.5, repeat: Infinity, repeatType: 'reverse' }}>▋</motion.span>
                {' '}Running detection algorithms...
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {output && !loading && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <motion.div 
                className="mb-8 p-4 bg-red-500/10 border border-red-500/30 rounded-xl flex items-center gap-4"
                initial={{ opacity: 0, x: -50 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ type: 'spring', stiffness: 100 }}
              >
                <motion.div 
                  className="w-12 h-12 bg-red-500/20 rounded-full flex items-center justify-center"
                  animate={{ scale: [1, 1.1, 1] }}
                  transition={{ duration: 1, repeat: Infinity }}
                >
                  <span className="text-2xl">⚠️</span>
                </motion.div>
                <div className="flex-1">
                  <div className="text-red-400 font-bold font-mono">THREAT ALERT</div>
                  <div className="text-slate-300 text-sm">
                    Detected {output.summary.fraud_rings_detected} fraud rings involving {output.summary.suspicious_accounts_flagged} suspicious accounts
                  </div>
                </div>
                <motion.div 
                  className="px-4 py-2 bg-red-500/20 rounded-lg text-red-400 font-mono text-sm"
                  animate={{ opacity: [0.5, 1, 0.5] }}
                  transition={{ duration: 1.5, repeat: Infinity }}
                >
                  HIGH RISK
                </motion.div>
              </motion.div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
                <StatCard 
                  label="Accounts Scanned" 
                  value={output.summary.total_accounts_analyzed} 
                  icon="📊" 
                  color="from-cyan-500 to-blue-500"
                  delay={0.1}
                />
                <StatCard 
                  label="Threats Found" 
                  value={output.summary.suspicious_accounts_flagged} 
                  icon="🚨" 
                  color="from-red-500 to-pink-500"
                  delay={0.2}
                />
                <StatCard 
                  label="Fraud Networks" 
                  value={output.summary.fraud_rings_detected} 
                  icon="🕸️" 
                  color="from-amber-500 to-orange-500"
                  delay={0.3}
                />
                <StatCard 
                  label="Analysis Time" 
                  value={output.summary.processing_time_seconds} 
                  icon="⚡" 
                  color="from-emerald-500 to-teal-500"
                  delay={0.4}
                />
              </div>

              <motion.div 
                className="flex justify-center mb-8"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
              >
                <div className="inline-flex p-1 bg-slate-800/80 rounded-xl border border-slate-700">
                  {[
                    { id: 'graph', label: 'NETWORK GRAPH', icon: '🔗' },
                    { id: 'table', label: 'THREAT TABLE', icon: '📋' }
                  ].map((tab) => (
                    <motion.button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`px-6 py-3 rounded-lg font-mono text-sm transition-all ${
                        activeTab === tab.id 
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
              </motion.div>

              <AnimatePresence mode="wait">
                <motion.div
                  key={activeTab}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.3 }}
                >
                  {activeTab === 'graph' ? <GraphView data={output} /> : <FraudTable data={output} />}
                </motion.div>
              </AnimatePresence>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.7 }}
              >
                <DownloadJSON data={output} />
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {!output && !loading && (
          <motion.div 
            className="text-center py-16"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
          >
            <motion.div 
              className="inline-block p-8 bg-slate-800/30 rounded-2xl border border-dashed border-slate-700"
              animate={{ borderColor: ['rgba(100,116,139,0.5)', 'rgba(6,182,212,0.5)', 'rgba(100,116,139,0.5)'] }}
              transition={{ duration: 3, repeat: Infinity }}
            >
              <motion.span 
                className="text-6xl block mb-4"
                animate={{ y: [0, -10, 0] }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                📁
              </motion.span>
              <p className="text-slate-400 font-mono">Upload a transaction CSV file to begin analysis</p>
            </motion.div>
          </motion.div>
        )}
      </main>

      <motion.footer 
        className="relative z-10 py-6 border-t border-slate-800"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1 }}
      >
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="text-slate-500 text-sm font-mono">
            © 2026 MULE_DETECT // RIFT HACKATHON
          </div>
          <div className="flex items-center gap-6">
            <span className="text-slate-600 text-xs font-mono">GRAPH_THEORY_TRACK</span>
            <div className="flex items-center gap-2">
              <PulsingDot color="bg-emerald-500" size="w-1.5 h-1.5" />
              <span className="text-slate-500 text-xs font-mono">ALL_SYSTEMS_OPERATIONAL</span>
            </div>
          </div>
        </div>
      </motion.footer>
    </div>
  );
}
