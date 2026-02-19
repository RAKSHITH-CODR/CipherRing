import { motion } from 'framer-motion';
import { useState } from 'react';

export default function FraudTable({ data }) {
  const [sortBy, setSortBy] = useState('risk_score');
  const [sortOrder, setSortOrder] = useState('desc');
  const [expandedRing, setExpandedRing] = useState(null);

  if (!data || !data.fraud_rings.length) return null;

  const getPatternStyle = (type) => {
    if (type.includes('cycle')) return { bg: 'bg-red-500/20', text: 'text-red-400', border: 'border-red-500/30' };
    if (type.includes('smurfing')) return { bg: 'bg-amber-500/20', text: 'text-amber-400', border: 'border-amber-500/30' };
    if (type.includes('shell')) return { bg: 'bg-purple-500/20', text: 'text-purple-400', border: 'border-purple-500/30' };
    return { bg: 'bg-slate-500/20', text: 'text-slate-400', border: 'border-slate-500/30' };
  };

  const getRiskStyle = (score) => {
    if (score >= 80) return 'text-red-400';
    if (score >= 60) return 'text-amber-400';
    return 'text-emerald-400';
  };

  const sortedRings = [...data.fraud_rings].sort((a, b) => {
    let aVal = sortBy === 'member_accounts' ? a.member_accounts.length : a[sortBy];
    let bVal = sortBy === 'member_accounts' ? b.member_accounts.length : b[sortBy];
    return sortOrder === 'desc' ? bVal - aVal : aVal - bVal;
  });

  const handleSort = (col) => {
    if (sortBy === col) setSortOrder(sortOrder === 'desc' ? 'asc' : 'desc');
    else { setSortBy(col); setSortOrder('desc'); }
  };

  return (
    <motion.div 
      className="bg-slate-900/80 backdrop-blur-xl border border-slate-700/50 rounded-2xl overflow-hidden mb-8"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <div className="p-4 border-b border-slate-700/50 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <motion.div 
            className="w-3 h-3 bg-red-500 rounded-full"
            animate={{ scale: [1, 1.3, 1], opacity: [1, 0.5, 1] }}
            transition={{ duration: 1.5, repeat: Infinity }}
          />
          <span className="font-mono text-red-400 font-bold">THREAT_ANALYSIS</span>
          <span className="px-2 py-0.5 bg-red-500/20 text-red-400 rounded text-xs font-mono ml-2">
            {data.fraud_rings.length} RINGS
          </span>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-slate-700/50 bg-slate-800/30">
              {[
                { key: 'ring_id', label: 'RING_ID' },
                { key: 'pattern_type', label: 'PATTERN' },
                { key: 'member_accounts', label: 'MEMBERS' },
                { key: 'risk_score', label: 'RISK' },
                { key: 'accounts', label: 'ACCOUNTS' }
              ].map((col) => (
                <th 
                  key={col.key}
                  onClick={() => col.key !== 'accounts' && handleSort(col.key)}
                  className={`text-left py-3 px-4 text-slate-500 font-mono text-xs uppercase tracking-wider ${
                    col.key !== 'accounts' ? 'cursor-pointer hover:text-cyan-400' : ''
                  }`}
                >
                  <span className="flex items-center gap-1">
                    {col.label}
                    {sortBy === col.key && <span className="text-cyan-400">{sortOrder === 'desc' ? '↓' : '↑'}</span>}
                  </span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {sortedRings.map((ring, idx) => {
              const style = getPatternStyle(ring.pattern_type);
              return (
                <motion.tr 
                  key={ring.ring_id}
                  className={`border-b border-slate-800/50 hover:bg-slate-800/30 transition-colors cursor-pointer ${
                    expandedRing === ring.ring_id ? 'bg-slate-800/50' : ''
                  }`}
                  onClick={() => setExpandedRing(expandedRing === ring.ring_id ? null : ring.ring_id)}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: idx * 0.05 }}
                >
                  <td className="py-3 px-4">
                    <span className="font-mono text-cyan-400">{ring.ring_id}</span>
                  </td>
                  <td className="py-3 px-4">
                    <span className={`px-3 py-1 rounded-lg text-xs font-mono ${style.bg} ${style.text} border ${style.border}`}>
                      {ring.pattern_type.replace(/_/g, ' ').toUpperCase()}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <div className="w-10 h-10 bg-slate-800 rounded-lg flex items-center justify-center border border-slate-700">
                      <span className="text-white font-bold font-mono">{ring.member_accounts.length}</span>
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    <span className={`text-2xl font-bold font-mono ${getRiskStyle(ring.risk_score)}`}>
                      {ring.risk_score}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex flex-wrap gap-1.5 max-w-md">
                      {ring.member_accounts.slice(0, 3).map((acc, i) => (
                        <span key={i} className="px-2 py-1 bg-slate-800 text-slate-400 rounded text-xs font-mono border border-slate-700">
                          {acc.length > 10 ? acc.slice(0, 8) + '..' : acc}
                        </span>
                      ))}
                      {ring.member_accounts.length > 3 && (
                        <span className="px-2 py-1 bg-cyan-500/10 text-cyan-400 rounded text-xs font-mono">
                          +{ring.member_accounts.length - 3}
                        </span>
                      )}
                    </div>
                  </td>
                </motion.tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {data.suspicious_accounts.length > 0 && (
        <div className="p-4 border-t border-slate-700/50">
          <div className="flex items-center gap-2 mb-4">
            <motion.div 
              className="w-2 h-2 bg-amber-500 rounded-full"
              animate={{ scale: [1, 1.5, 1] }}
              transition={{ duration: 1, repeat: Infinity }}
            />
            <span className="font-mono text-amber-400 text-sm font-bold">TOP_THREATS</span>
            <span className="text-slate-500 text-xs font-mono">
              ({Math.min(6, data.suspicious_accounts.length)} of {data.suspicious_accounts.length})
            </span>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {data.suspicious_accounts.slice(0, 6).map((acc, idx) => (
              <motion.div 
                key={acc.account_id}
                className="bg-slate-800/50 rounded-xl p-4 border border-slate-700 hover:border-cyan-500/30 transition-all"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.05 }}
                whileHover={{ y: -2 }}
              >
                <div className="flex justify-between items-start mb-3">
                  <span className="font-mono text-xs text-slate-400 break-all">
                    {acc.account_id.length > 16 ? acc.account_id.slice(0, 14) + '..' : acc.account_id}
                  </span>
                  <span className={`text-xl font-bold font-mono ${getRiskStyle(acc.suspicion_score)}`}>
                    {acc.suspicion_score}
                  </span>
                </div>
                
                <div className="h-1 bg-slate-700 rounded-full overflow-hidden mb-3">
                  <motion.div 
                    className={`h-full ${
                      acc.suspicion_score >= 80 ? 'bg-red-500' : 
                      acc.suspicion_score >= 60 ? 'bg-amber-500' : 'bg-emerald-500'
                    }`}
                    initial={{ width: 0 }}
                    animate={{ width: `${acc.suspicion_score}%` }}
                    transition={{ duration: 0.5, delay: idx * 0.1 }}
                  />
                </div>
                
                <div className="flex flex-wrap gap-1">
                  {acc.detected_patterns.map((p, i) => (
                    <span key={i} className="px-2 py-0.5 bg-red-500/10 text-red-400 rounded text-xs font-mono">
                      {p.replace(/_/g, ' ')}
                    </span>
                  ))}
                </div>
                
                {acc.ring_id && (
                  <div className="mt-2 pt-2 border-t border-slate-700 text-xs font-mono">
                    <span className="text-slate-500">RING: </span>
                    <span className="text-amber-400">{acc.ring_id}</span>
                  </div>
                )}
              </motion.div>
            ))}
          </div>
        </div>
      )}
    </motion.div>
  );
}
