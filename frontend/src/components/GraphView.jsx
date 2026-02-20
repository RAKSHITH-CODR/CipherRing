import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { DataSet, Network } from 'vis-network/standalone';

// Risk Level Badge Component
const RiskBadge = ({ score, size = 'md' }) => {
  const getRiskLevel = (score) => {
    if (score >= 61) return { label: 'HIGH RISK', bg: 'bg-red-500/20', text: 'text-red-400', border: 'border-red-500/50', glow: 'shadow-red-500/20' };
    if (score >= 31) return { label: 'MEDIUM RISK', bg: 'bg-amber-500/20', text: 'text-amber-400', border: 'border-amber-500/50', glow: 'shadow-amber-500/20' };
    return { label: 'LOW RISK', bg: 'bg-emerald-500/20', text: 'text-emerald-400', border: 'border-emerald-500/50', glow: 'shadow-emerald-500/20' };
  };
  
  const risk = getRiskLevel(score);
  const sizeClasses = size === 'sm' ? 'px-2 py-0.5 text-[10px]' : size === 'lg' ? 'px-4 py-1.5 text-sm' : 'px-3 py-1 text-xs';
  
  return (
    <motion.span 
      className={`${sizeClasses} ${risk.bg} ${risk.text} ${risk.border} border rounded-full font-mono font-bold inline-flex items-center gap-1.5 shadow-lg ${risk.glow}`}
      initial={{ scale: 0.8, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      whileHover={{ scale: 1.05 }}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${risk.text.replace('text-', 'bg-')}`} />
      {risk.label}
    </motion.span>
  );
};

export default function GraphView({ data }) {
  const containerRef = useRef(null);
  const [selectedNode, setSelectedNode] = useState(null);
  const [graphReady, setGraphReady] = useState(false);
  const [nodeCount, setNodeCount] = useState(0);
  const [edgeCount, setEdgeCount] = useState(0);
  const [isolationMode, setIsolationMode] = useState(false);
  const networkRef = useRef(null);

  useEffect(() => {
    if (!data || !data.graph_data?.nodes || !data.graph_data?.edges || !containerRef.current) return;

    setGraphReady(false);
    const suspiciousIds = new Set((data.suspicious_accounts || []).map(a => a.account_id));
    const suspiciousMap = {};
    (data.suspicious_accounts || []).forEach(a => {
      suspiciousMap[a.account_id] = a;
    });

    const ringMembers = new Set();
    (data.fraud_rings || []).forEach(ring => {
      (ring.member_accounts || []).forEach(acc => ringMembers.add(acc));
    });

    // Filter nodes based on isolation mode
    const filteredNodes = isolationMode 
      ? data.graph_data.nodes.filter(node => suspiciousIds.has(node.id) || ringMembers.has(node.id))
      : data.graph_data.nodes;
    
    const filteredNodeIds = new Set(filteredNodes.map(n => n.id));

    const nodes = new DataSet(
      filteredNodes.map(node => {
        const isSuspicious = suspiciousIds.has(node.id);
        const isRingMember = ringMembers.has(node.id);
        const score = suspiciousMap[node.id]?.suspicion_score || 0;
        
        // Color nodes based on risk level thresholds
        let color = '#334155';
        let borderColor = '#475569';
        let borderWidth = 1;
        let shadow = false;
        
        if (isSuspicious || isRingMember) {
          shadow = true;
          if (score >= 61) {
            // HIGH RISK - Red
            color = '#dc2626';
            borderColor = '#ef4444';
            borderWidth = isRingMember ? 4 : 3;
          } else if (score >= 31) {
            // MEDIUM RISK - Amber
            color = '#f59e0b';
            borderColor = '#fbbf24';
            borderWidth = isRingMember ? 4 : 3;
          } else {
            // LOW RISK - Emerald
            color = '#10b981';
            borderColor = '#34d399';
            borderWidth = isRingMember ? 4 : 2;
          }
        }

        // Risk level for tooltip
        const getRiskLabel = (s) => s >= 61 ? '🔴 HIGH RISK' : s >= 31 ? '🟡 MEDIUM RISK' : '🟢 LOW RISK';
        
        // Shadow color matches risk level
        const shadowColor = score >= 61 ? 'rgba(239,68,68,0.5)' : score >= 31 ? 'rgba(245,158,11,0.5)' : (isSuspicious ? 'rgba(16,185,129,0.5)' : 'rgba(6,182,212,0.5)');
        
        return {
          id: node.id,
          label: (node.id?.length || 0) > 10 ? node.id.slice(0, 8) + '...' : (node.id || ''),
          color: {
            background: color,
            border: borderColor,
            highlight: { background: '#06b6d4', border: '#22d3ee' },
            hover: { background: '#0891b2', border: '#06b6d4' }
          },
          borderWidth,
          shadow: shadow ? { enabled: true, color: shadowColor, size: 15 } : false,
          size: isSuspicious ? Math.max(20, Math.min(45, score / 2.5)) : 15,
          font: { color: '#94a3b8', size: 10, face: 'monospace' },
          title: `ID: ${node.id}\nTX: ${node.transactionCount}${isSuspicious ? `\nSCORE: ${score}\n${getRiskLabel(score)}` : ''}`
        };
      })
    );

    // Filter edges to only include those connecting visible nodes
    const filteredEdges = isolationMode
      ? data.graph_data.edges.filter(edge => filteredNodeIds.has(edge.from) && filteredNodeIds.has(edge.to))
      : data.graph_data.edges;

    const edges = new DataSet(
      filteredEdges.map((edge, idx) => ({
        id: idx,
        from: edge.from,
        to: edge.to,
        arrows: { to: { enabled: true, scaleFactor: 0.6 } },
        color: { color: '#1e293b', highlight: '#06b6d4', hover: '#0891b2' },
        width: 1.5,
        smooth: { enabled: true, type: 'curvedCW', roundness: 0.15 }
      }))
    );

    setNodeCount(nodes.length);
    setEdgeCount(edges.length);

    const options = {
      nodes: {
        shape: 'dot',
        scaling: { min: 15, max: 50 }
      },
      edges: {
        smooth: { type: 'continuous' }
      },
      physics: {
        forceAtlas2Based: {
          gravitationalConstant: -60,
          centralGravity: 0.01,
          springLength: 100,
          springConstant: 0.08,
          damping: 0.4
        },
        maxVelocity: 50,
        solver: 'forceAtlas2Based',
        timestep: 0.35,
        stabilization: { iterations: 150, updateInterval: 25 }
      },
      interaction: {
        hover: true,
        tooltipDelay: 100,
        hideEdgesOnDrag: true,
        zoomView: true,
        dragView: true
      }
    };

    const network = new Network(containerRef.current, { nodes, edges }, options);
    networkRef.current = network;

    network.on('stabilizationIterationsDone', () => {
      setGraphReady(true);
      network.setOptions({ physics: { enabled: false } });
    });

    network.on('click', (params) => {
      if (params.nodes.length > 0) {
        const nodeId = params.nodes[0];
        const nodeData = data.graph_data.nodes.find(n => n.id === nodeId);
        const suspicionData = suspiciousMap[nodeId];
        setSelectedNode({
          ...nodeData,
          ...suspicionData,
          isRingMember: ringMembers.has(nodeId),
          patterns: suspicionData?.detected_patterns || []
        });
      } else {
        setSelectedNode(null);
      }
    });

    return () => {
      if (networkRef.current) networkRef.current.destroy();
    };
  }, [data, isolationMode]);

  const handleZoom = (dir) => {
    if (networkRef.current) {
      const scale = networkRef.current.getScale();
      networkRef.current.moveTo({
        scale: dir === 'in' ? scale * 1.3 : scale / 1.3,
        animation: { duration: 300, easingFunction: 'easeInOutQuad' }
      });
    }
  };

  const handleFit = () => {
    if (networkRef.current) {
      networkRef.current.fit({ animation: { duration: 400, easingFunction: 'easeInOutQuad' } });
    }
  };

  if (!data) return null;

  return (
    <motion.div 
      className="bg-slate-900/80 backdrop-blur-xl border border-slate-700/50 rounded-2xl overflow-hidden mb-8"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <div className="p-4 border-b border-slate-700/50 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <motion.div 
              className="w-3 h-3 bg-cyan-500 rounded-full"
              animate={{ scale: [1, 1.3, 1], opacity: [1, 0.5, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
            />
            <span className="font-mono text-cyan-400 font-bold">NETWORK_GRAPH</span>
          </div>
          <div className="hidden md:flex items-center gap-4 text-xs font-mono text-slate-500">
            <span>NODES: <span className="text-cyan-400">{nodeCount}</span></span>
            <span>EDGES: <span className="text-cyan-400">{edgeCount}</span></span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Ring Isolation Mode Toggle */}
          <motion.button
            onClick={() => setIsolationMode(!isolationMode)}
            className={`px-3 py-1.5 rounded-lg font-mono text-xs font-bold transition-all flex items-center gap-2 ${
              isolationMode 
                ? 'bg-red-500/20 border border-red-500/50 text-red-400 shadow-lg shadow-red-500/20' 
                : 'bg-slate-800 border border-slate-600 text-slate-400 hover:text-cyan-400 hover:border-cyan-500/50'
            }`}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <motion.div 
              className={`w-2 h-2 rounded-full ${isolationMode ? 'bg-red-400' : 'bg-slate-500'}`}
              animate={isolationMode ? { scale: [1, 1.3, 1], opacity: [1, 0.6, 1] } : {}}
              transition={{ duration: 1, repeat: Infinity }}
            />
            {isolationMode ? '🔴 RINGS ONLY' : '🕸️ ISOLATE RINGS'}
          </motion.button>
          
          <div className="w-px h-6 bg-slate-700" />
          
          {[
            { icon: '−', action: () => handleZoom('out') },
            { icon: '+', action: () => handleZoom('in') },
            { icon: '⊡', action: handleFit }
          ].map((btn, i) => (
            <motion.button
              key={i}
              onClick={btn.action}
              className="w-8 h-8 bg-slate-800 border border-slate-600 rounded-lg text-slate-400 hover:text-cyan-400 hover:border-cyan-500/50 transition-all font-mono"
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
            >
              {btn.icon}
            </motion.button>
          ))}
        </div>
      </div>

      <div className="p-4 border-b border-slate-700/50">
        <div className="flex items-center gap-2 mb-3">
          <span className="text-slate-500 text-xs font-mono">NODE_COLORS (BY RISK LEVEL):</span>
        </div>
        <div className="flex gap-4 flex-wrap">
          {[
            { color: 'bg-red-500', border: 'border-red-400', label: 'HIGH (61-100)', glow: 'shadow-red-500/30' },
            { color: 'bg-amber-500', border: 'border-amber-400', label: 'MEDIUM (31-60)', glow: 'shadow-amber-500/30' },
            { color: 'bg-emerald-500', border: 'border-emerald-400', label: 'LOW (0-30)', glow: 'shadow-emerald-500/30' },
            { color: 'bg-slate-600', border: 'border-slate-500', label: 'NORMAL', glow: '' }
          ].map((item, i) => (
            <motion.div 
              key={item.label}
              className={`flex items-center gap-2 px-3 py-1.5 bg-slate-800/50 rounded-lg border border-slate-700 ${item.glow ? `shadow-lg ${item.glow}` : ''}`}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.1 }}
            >
              <div className={`w-3 h-3 rounded-full ${item.color} border-2 ${item.border}`} />
              <span className="text-slate-400 text-xs font-mono">{item.label}</span>
            </motion.div>
          ))}
        </div>
      </div>

      <div className="flex">
        <div className="relative flex-1 h-[500px]">
          <div ref={containerRef} className="w-full h-full bg-slate-950/50" />
          
          <AnimatePresence>
            {!graphReady && (
              <motion.div 
                className="absolute inset-0 flex items-center justify-center bg-slate-950/90"
                initial={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                <div className="text-center">
                  <motion.div 
                    className="w-16 h-16 border-4 border-cyan-500/30 border-t-cyan-500 rounded-full mx-auto mb-4"
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                  />
                  <p className="text-cyan-400 font-mono">BUILDING_NETWORK...</p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="absolute bottom-4 left-4 text-xs font-mono text-slate-600">
            CLICK NODE FOR DETAILS
          </div>
          
          {/* Isolation Mode Indicator */}
          <AnimatePresence>
            {isolationMode && (
              <motion.div 
                className="absolute top-4 left-4 px-3 py-2 bg-red-500/10 border border-red-500/30 rounded-lg backdrop-blur-sm"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
              >
                <div className="flex items-center gap-2">
                  <motion.div 
                    className="w-2 h-2 bg-red-500 rounded-full"
                    animate={{ scale: [1, 1.5, 1], opacity: [1, 0.5, 1] }}
                    transition={{ duration: 1, repeat: Infinity }}
                  />
                  <span className="text-red-400 text-xs font-mono font-bold">ISOLATION MODE</span>
                </div>
                <p className="text-slate-500 text-[10px] font-mono mt-1">Showing fraud rings only</p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
        
        <AnimatePresence>
          {selectedNode && (
            <motion.div 
              className="w-80 bg-slate-900 border-l border-slate-700/50 p-5 overflow-y-auto"
              initial={{ width: 0, opacity: 0 }}
              animate={{ width: 320, opacity: 1 }}
              exit={{ width: 0, opacity: 0 }}
            >
              <div className="flex items-center justify-between mb-4">
                <span className="text-cyan-400 font-mono font-bold text-sm">NODE_DETAILS</span>
                <motion.button
                  onClick={() => setSelectedNode(null)}
                  className="text-slate-500 hover:text-white"
                  whileHover={{ scale: 1.1 }}
                >
                  ✕
                </motion.button>
              </div>

              <div className="space-y-4">
                <div className="p-3 bg-slate-800/50 rounded-lg border border-slate-700">
                  <div className="text-slate-500 text-xs font-mono mb-1">ACCOUNT_ID</div>
                  <div className="text-white font-mono text-sm break-all">{selectedNode.id}</div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3 bg-slate-800/50 rounded-lg border border-slate-700">
                    <div className="text-slate-500 text-xs font-mono mb-1">TX_COUNT</div>
                    <div className="text-2xl font-bold text-white">{selectedNode.transactionCount}</div>
                  </div>
                  {selectedNode.suspicion_score > 0 && (
                    <div className="p-3 bg-slate-800/50 rounded-lg border border-slate-700">
                      <div className="text-slate-500 text-xs font-mono mb-1">RISK_SCORE</div>
                      <div className={`text-2xl font-bold ${
                        selectedNode.suspicion_score >= 61 ? 'text-red-400' : 
                        selectedNode.suspicion_score >= 31 ? 'text-amber-400' : 'text-emerald-400'
                      }`}>
                        {selectedNode.suspicion_score}
                      </div>
                    </div>
                  )}
                </div>

                {selectedNode.suspicion_score > 0 && (
                  <div className="p-3 bg-slate-800/50 rounded-lg border border-slate-700">
                    <div className="text-slate-500 text-xs font-mono mb-2">RISK_LEVEL</div>
                    <RiskBadge score={selectedNode.suspicion_score} size="md" />
                  </div>
                )}

                {selectedNode.suspicion_score > 0 && (
                  <>
                    <div className="p-3 bg-slate-800/50 rounded-lg border border-slate-700">
                      <div className="text-slate-500 text-xs font-mono mb-2">RISK_METER</div>
                      <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
                        <motion.div 
                          className={`h-full ${
                            selectedNode.suspicion_score >= 61 ? 'bg-gradient-to-r from-red-500 to-orange-500' : 
                            selectedNode.suspicion_score >= 31 ? 'bg-gradient-to-r from-amber-500 to-yellow-500' : 
                            'bg-gradient-to-r from-emerald-500 to-teal-500'
                          }`}
                          initial={{ width: 0 }}
                          animate={{ width: `${selectedNode.suspicion_score}%` }}
                          transition={{ duration: 0.8 }}
                        />
                      </div>
                    </div>

                    <div className="p-3 bg-slate-800/50 rounded-lg border border-slate-700">
                      <div className="text-slate-500 text-xs font-mono mb-2">DETECTED_PATTERNS</div>
                      <div className="flex flex-wrap gap-2">
                        {selectedNode.patterns.map((p, i) => (
                          <motion.span 
                            key={i}
                            className="px-2 py-1 bg-red-500/20 text-red-400 rounded text-xs font-mono"
                            initial={{ opacity: 0, scale: 0 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: i * 0.1 }}
                          >
                            {p.replace(/_/g, ' ')}
                          </motion.span>
                        ))}
                      </div>
                    </div>

                    {selectedNode.ring_id && (
                      <div className="p-3 bg-red-500/10 rounded-lg border border-red-500/30">
                        <div className="text-slate-500 text-xs font-mono mb-1">RING_ASSOCIATION</div>
                        <div className="text-red-400 font-mono">{selectedNode.ring_id}</div>
                      </div>
                    )}
                  </>
                )}

                {selectedNode.isRingMember && (
                  <motion.div 
                    className="p-3 bg-red-500/10 border border-red-500/30 rounded-lg"
                    animate={{ borderColor: ['rgba(239,68,68,0.3)', 'rgba(239,68,68,0.6)', 'rgba(239,68,68,0.3)'] }}
                    transition={{ duration: 2, repeat: Infinity }}
                  >
                    <div className="flex items-center gap-2 text-red-400 font-mono text-sm">
                      <span>⚠</span>
                      <span>FRAUD_RING_MEMBER</span>
                    </div>
                  </motion.div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}
