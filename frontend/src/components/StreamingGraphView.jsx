import { useEffect, useRef, useState, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

/**
 * StreamingGraphView - Network visualization with animated particle trails
 * Features: Zoom, Pan, Infinite canvas, Real-time money flow particles
 */
export default function StreamingGraphView({ 
  nodes, 
  edges, 
  activeEdge, 
  detections,
  onNodeClick 
}) {
  const canvasRef = useRef(null);
  const containerRef = useRef(null);
  const animationFrameRef = useRef(null);
  
  // Viewport dimensions
  const [dimensions, setDimensions] = useState({ width: 800, height: 600 });
  
  // Graph state
  const [nodePositions, setNodePositions] = useState({});
  const [particles, setParticles] = useState([]);
  const [hoveredNode, setHoveredNode] = useState(null);
  
  // Zoom and Pan state
  const [scale, setScale] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  
  // Virtual canvas size (much larger than viewport)
  const VIRTUAL_WIDTH = 4000;
  const VIRTUAL_HEIGHT = 3000;

  // Calculate node positions using force-directed layout with better spacing
  useEffect(() => {
    if (nodes.length === 0) return;

    const positions = { ...nodePositions };
    const centerX = VIRTUAL_WIDTH / 2;
    const centerY = VIRTUAL_HEIGHT / 2;

    // Add new nodes
    nodes.forEach((node, i) => {
      if (!positions[node.id]) {
        // Place new nodes in expanding spiral pattern for better distribution
        const existingCount = Object.keys(positions).length;
        const angle = existingCount * 0.7; // Golden angle approximation
        const radius = 150 + existingCount * 20; // Expanding spiral
        positions[node.id] = {
          x: centerX + radius * Math.cos(angle) + (Math.random() - 0.5) * 100,
          y: centerY + radius * Math.sin(angle) + (Math.random() - 0.5) * 100,
          vx: 0,
          vy: 0
        };
      }
    });

    // Force-directed layout with stronger repulsion for better spacing
    for (let iteration = 0; iteration < 80; iteration++) {
      const nodeIds = Object.keys(positions);
      
      // Strong repulsion between all nodes
      for (let i = 0; i < nodeIds.length; i++) {
        for (let j = i + 1; j < nodeIds.length; j++) {
          const a = positions[nodeIds[i]];
          const b = positions[nodeIds[j]];
          const dx = b.x - a.x;
          const dy = b.y - a.y;
          const dist = Math.sqrt(dx * dx + dy * dy) || 1;
          
          // Stronger repulsion force with minimum distance
          const minDist = 150; // Minimum distance between nodes
          const force = Math.max(0, (minDist - dist) * 0.8) + 5000 / (dist * dist);
          const fx = (dx / dist) * force;
          const fy = (dy / dist) * force;
          a.x -= fx;
          a.y -= fy;
          b.x += fx;
          b.y += fy;
        }
      }

      // Attraction along edges (keep connected nodes somewhat close)
      edges.forEach(edge => {
        const a = positions[edge.from];
        const b = positions[edge.to];
        if (a && b) {
          const dx = b.x - a.x;
          const dy = b.y - a.y;
          const dist = Math.sqrt(dx * dx + dy * dy) || 1;
          const idealDist = 250; // Ideal edge length
          const force = (dist - idealDist) * 0.015;
          const fx = (dx / dist) * force;
          const fy = (dy / dist) * force;
          a.x += fx;
          a.y += fy;
          b.x -= fx;
          b.y -= fy;
        }
      });

      // Gentle center gravity
      nodeIds.forEach(id => {
        const node = positions[id];
        node.x += (centerX - node.x) * 0.001;
        node.y += (centerY - node.y) * 0.001;
      });

      // Keep nodes within virtual bounds
      nodeIds.forEach(id => {
        const node = positions[id];
        const margin = 150;
        node.x = Math.max(margin, Math.min(VIRTUAL_WIDTH - margin, node.x));
        node.y = Math.max(margin, Math.min(VIRTUAL_HEIGHT - margin, node.y));
      });
    }

    setNodePositions(positions);
  }, [nodes.length, edges.length]);

  // Handle resize
  useEffect(() => {
    const updateDimensions = () => {
      if (containerRef.current) {
        setDimensions({
          width: containerRef.current.offsetWidth,
          height: containerRef.current.offsetHeight
        });
      }
    };

    updateDimensions();
    window.addEventListener('resize', updateDimensions);
    return () => window.removeEventListener('resize', updateDimensions);
  }, []);

  // Spawn particles for active edge
  useEffect(() => {
    if (!activeEdge) return;

    const from = nodePositions[activeEdge.from];
    const to = nodePositions[activeEdge.to];
    if (!from || !to) return;

    // Calculate curve points (same as edge drawing)
    const dx = to.x - from.x;
    const dy = to.y - from.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    if (dist < 1) return;
    
    const angle = Math.atan2(dy, dx);
    const nodeRadius = 30;
    
    const startX = from.x + nodeRadius * Math.cos(angle);
    const startY = from.y + nodeRadius * Math.sin(angle);
    const endX = to.x - nodeRadius * Math.cos(angle);
    const endY = to.y - nodeRadius * Math.sin(angle);
    
    const midX = (startX + endX) / 2;
    const midY = (startY + endY) / 2;
    const curvature = Math.min(30, dist * 0.1);
    const ctrlX = midX + curvature * Math.cos(angle + Math.PI / 2);
    const ctrlY = midY + curvature * Math.sin(angle + Math.PI / 2);

    // Determine if this edge involves suspicious accounts
    const suspiciousAccounts = new Set(detections.flatMap(d => d.member_accounts || []));
    const isSuspiciousEdge = activeEdge.isSuspicious || 
      suspiciousAccounts.has(activeEdge.from) || 
      suspiciousAccounts.has(activeEdge.to);
    
    const particleColor = isSuspiciousEdge ? '#ef4444' : '#10b981';

    const numParticles = 8; // More particles for visual impact
    const newParticles = [];

    for (let i = 0; i < numParticles; i++) {
      newParticles.push({
        id: `${activeEdge.id}_${i}_${Date.now()}`,
        startX, startY,
        ctrlX, ctrlY,
        endX, endY,
        progress: 0,
        delay: i * 30, // Tighter spacing
        speed: 0.02 + Math.random() * 0.015, // Variable speed for natural feel
        amount: activeEdge.amount,
        size: 4 + Math.random() * 4, // Variable size
        color: particleColor,
        showAmount: i === 0 // Only first particle shows amount
      });
    }

    setParticles(prev => [...prev, ...newParticles]);
  }, [activeEdge, nodePositions, detections]);

  // Animate particles
  useEffect(() => {
    const animate = () => {
      setParticles(prev => {
        const updated = prev
          .map(p => ({ ...p, progress: p.progress + (p.speed || 0.025) }))
          .filter(p => p.progress < 1.1); // Allow slight overshoot for burst effect
        return updated;
      });
      animationFrameRef.current = requestAnimationFrame(animate);
    };

    animationFrameRef.current = requestAnimationFrame(animate);
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, []);

  // Transform world coordinates to screen coordinates
  const worldToScreen = useCallback((x, y) => {
    return {
      x: (x - offset.x) * scale,
      y: (y - offset.y) * scale
    };
  }, [offset, scale]);

  // Transform screen coordinates to world coordinates
  const screenToWorld = useCallback((x, y) => {
    return {
      x: x / scale + offset.x,
      y: y / scale + offset.y
    };
  }, [offset, scale]);

  // Canvas drawing with zoom/pan transform
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, dimensions.width, dimensions.height);

    // Apply transform
    ctx.save();
    ctx.scale(scale, scale);
    ctx.translate(-offset.x, -offset.y);

    // Draw grid for reference
    ctx.strokeStyle = 'rgba(59, 130, 246, 0.08)';
    ctx.lineWidth = 1 / scale;
    const gridSize = 100;
    for (let x = 0; x < VIRTUAL_WIDTH; x += gridSize) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, VIRTUAL_HEIGHT);
      ctx.stroke();
    }
    for (let y = 0; y < VIRTUAL_HEIGHT; y += gridSize) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(VIRTUAL_WIDTH, y);
      ctx.stroke();
    }

    // Build suspicious nodes set for edge coloring
    const suspiciousNodeIds = new Set(detections.flatMap(d => d.member_accounts || []));

    // Draw edges with curved lines and proper arrows
    edges.forEach(edge => {
      const from = nodePositions[edge.from];
      const to = nodePositions[edge.to];
      if (!from || !to) return;

      // Calculate direction and distance
      const dx = to.x - from.x;
      const dy = to.y - from.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < 1) return; // Skip if nodes are at same position
      
      const angle = Math.atan2(dy, dx);
      
      // Node radius in world coordinates - must match visual node size
      // Visual node size: Math.max(36, 56 * scale) pixels on screen
      // World radius = screen_radius / scale = Math.max(18/scale, 28)
      const nodeRadius = Math.max(18 / scale, 28);
      
      // Calculate start and end points at node edges
      const startX = from.x + nodeRadius * Math.cos(angle);
      const startY = from.y + nodeRadius * Math.sin(angle);
      const endX = to.x - nodeRadius * Math.cos(angle);
      const endY = to.y - nodeRadius * Math.sin(angle);
      
      // Calculate control point for slight curve (perpendicular offset)
      const midX = (startX + endX) / 2;
      const midY = (startY + endY) / 2;
      const curvature = Math.min(30, dist * 0.1); // Adaptive curve
      const ctrlX = midX + curvature * Math.cos(angle + Math.PI / 2);
      const ctrlY = midY + curvature * Math.sin(angle + Math.PI / 2);
      
      // Determine if this edge involves suspicious accounts
      const isSuspiciousEdge = edge.isSuspicious || 
        suspiciousNodeIds.has(edge.from) || 
        suspiciousNodeIds.has(edge.to);
      
      // Draw curved edge with appropriate color
      ctx.beginPath();
      ctx.moveTo(startX, startY);
      ctx.quadraticCurveTo(ctrlX, ctrlY, endX, endY);
      
      if (edge.isActive) {
        // Active edge: red for suspicious, emerald for normal
        const activeColor = isSuspiciousEdge ? '#ef4444' : '#10b981';
        ctx.strokeStyle = activeColor;
        ctx.lineWidth = 3;
        ctx.shadowColor = activeColor;
        ctx.shadowBlur = 15;
      } else {
        // Inactive edge: light red for suspicious, blue for normal
        ctx.strokeStyle = isSuspiciousEdge ? 'rgba(239, 68, 68, 0.5)' : 'rgba(59, 130, 246, 0.5)';
        ctx.lineWidth = 1.5;
        ctx.shadowBlur = 0;
      }
      
      ctx.stroke();
      ctx.shadowBlur = 0;

      // Draw arrow at the end point
      // Calculate tangent angle at end of curve for proper arrow direction
      const t = 0.95; // Point near end of curve
      const tangentX = 2 * (1 - t) * (ctrlX - startX) + 2 * t * (endX - ctrlX);
      const tangentY = 2 * (1 - t) * (ctrlY - startY) + 2 * t * (endY - ctrlY);
      const arrowAngle = Math.atan2(tangentY, tangentX);
      
      const arrowLength = 12;
      const arrowWidth = Math.PI / 7; // Narrower arrow
      
      ctx.beginPath();
      ctx.moveTo(endX, endY);
      ctx.lineTo(
        endX - arrowLength * Math.cos(arrowAngle - arrowWidth),
        endY - arrowLength * Math.sin(arrowAngle - arrowWidth)
      );
      ctx.lineTo(
        endX - arrowLength * 0.6 * Math.cos(arrowAngle),
        endY - arrowLength * 0.6 * Math.sin(arrowAngle)
      );
      ctx.lineTo(
        endX - arrowLength * Math.cos(arrowAngle + arrowWidth),
        endY - arrowLength * Math.sin(arrowAngle + arrowWidth)
      );
      ctx.closePath();
      // Arrow color matches edge
      if (edge.isActive) {
        ctx.fillStyle = isSuspiciousEdge ? '#ef4444' : '#10b981';
      } else {
        ctx.fillStyle = isSuspiciousEdge ? 'rgba(239, 68, 68, 0.7)' : 'rgba(59, 130, 246, 0.7)';
      }
      ctx.fill();
    });

    // Draw particles with glow trail (following curved path)
    particles.forEach(particle => {
      if (particle.progress < particle.delay / 200) return;
      
      const effectiveProgress = Math.max(0, (particle.progress - particle.delay / 200) / (1 - particle.delay / 200));
      
      // Quadratic bezier interpolation for curved path
      const t = effectiveProgress;
      const mt = 1 - t;
      const x = mt * mt * particle.startX + 2 * mt * t * particle.ctrlX + t * t * particle.endX;
      const y = mt * mt * particle.startY + 2 * mt * t * particle.ctrlY + t * t * particle.endY;

      // Check if particle reached destination (burst effect)
      if (effectiveProgress >= 0.95) {
        const burstProgress = (effectiveProgress - 0.95) / 0.15;
        const burstRadius = 30 + burstProgress * 40;
        const burstAlpha = 1 - burstProgress;
        
        // Draw expanding ring burst
        ctx.beginPath();
        ctx.arc(particle.endX, particle.endY, burstRadius, 0, Math.PI * 2);
        ctx.strokeStyle = particle.color + Math.floor(burstAlpha * 100).toString(16).padStart(2, '0');
        ctx.lineWidth = 3 * (1 - burstProgress);
        ctx.stroke();
      }

      // Draw outer glow (larger, more dramatic)
      const glowSize = 35 * (particle.size || 6) / 6;
      const gradient = ctx.createRadialGradient(x, y, 0, x, y, glowSize);
      gradient.addColorStop(0, particle.color);
      gradient.addColorStop(0.3, particle.color + 'AA');
      gradient.addColorStop(0.6, particle.color + '40');
      gradient.addColorStop(1, 'transparent');

      ctx.beginPath();
      ctx.arc(x, y, glowSize, 0, Math.PI * 2);
      ctx.fillStyle = gradient;
      ctx.fill();

      // Draw core particle (pulsing)
      const pulseScale = 1 + Math.sin(effectiveProgress * Math.PI * 4) * 0.2;
      const coreSize = (particle.size || 6) * pulseScale;
      ctx.beginPath();
      ctx.arc(x, y, coreSize, 0, Math.PI * 2);
      ctx.fillStyle = '#ffffff';
      ctx.fill();

      // Draw money amount label for first particle
      if (particle.showAmount && particle.amount && effectiveProgress < 0.9) {
        ctx.save();
        ctx.font = 'bold 12px monospace';
        ctx.fillStyle = '#ffffff';
        ctx.strokeStyle = particle.color;
        ctx.lineWidth = 3;
        const text = `$${particle.amount.toLocaleString()}`;
        ctx.strokeText(text, x + 15, y - 10);
        ctx.fillText(text, x + 15, y - 10);
        ctx.restore();
      }

      // Draw enhanced trail along curve
      const trailLength = 8;
      for (let i = 1; i <= trailLength; i++) {
        const trailT = Math.max(0, effectiveProgress - (i * 0.025));
        if (trailT <= 0) continue;
        
        const trailMt = 1 - trailT;
        const tx = trailMt * trailMt * particle.startX + 2 * trailMt * trailT * particle.ctrlX + trailT * trailT * particle.endX;
        const ty = trailMt * trailMt * particle.startY + 2 * trailMt * trailT * particle.ctrlY + trailT * trailT * particle.endY;
        const alpha = (1 - (i / trailLength)) * 0.8;
        const trailSize = (particle.size || 5) * (1 - i / trailLength * 0.7);
        
        // Trail glow
        const trailGlow = ctx.createRadialGradient(tx, ty, 0, tx, ty, trailSize * 2);
        trailGlow.addColorStop(0, particle.color + Math.floor(alpha * 200).toString(16).padStart(2, '0'));
        trailGlow.addColorStop(1, 'transparent');
        ctx.beginPath();
        ctx.arc(tx, ty, trailSize * 2, 0, Math.PI * 2);
        ctx.fillStyle = trailGlow;
        ctx.fill();

        ctx.beginPath();
        ctx.arc(tx, ty, trailSize, 0, Math.PI * 2);
        ctx.fillStyle = particle.color + Math.floor(alpha * 255).toString(16).padStart(2, '0');
        ctx.fill();
      }
    });

    ctx.restore();
  }, [nodePositions, edges, particles, dimensions, scale, offset, detections]);

  // Get suspicious nodes
  const suspiciousNodes = useMemo(() => {
    return new Set(detections.flatMap(d => d.member_accounts || []));
  }, [detections]);

  // Zoom functions
  const zoomIn = () => setScale(s => Math.min(s * 1.3, 3));
  const zoomOut = () => setScale(s => Math.max(s / 1.3, 0.15));

  const fitToView = useCallback(() => {
    if (Object.keys(nodePositions).length === 0) {
      // Default view: center of virtual canvas
      setScale(0.5);
      setOffset({
        x: VIRTUAL_WIDTH / 2 - dimensions.width,
        y: VIRTUAL_HEIGHT / 2 - dimensions.height
      });
      return;
    }

    const positions = Object.values(nodePositions);
    const minX = Math.min(...positions.map(p => p.x)) - 150;
    const maxX = Math.max(...positions.map(p => p.x)) + 150;
    const minY = Math.min(...positions.map(p => p.y)) - 150;
    const maxY = Math.max(...positions.map(p => p.y)) + 150;

    const graphWidth = maxX - minX;
    const graphHeight = maxY - minY;

    const scaleX = dimensions.width / graphWidth;
    const scaleY = dimensions.height / graphHeight;
    const newScale = Math.min(scaleX, scaleY, 1.2) * 0.85;

    const centerX = (minX + maxX) / 2;
    const centerY = (minY + maxY) / 2;

    setScale(newScale);
    setOffset({
      x: centerX - dimensions.width / (2 * newScale),
      y: centerY - dimensions.height / (2 * newScale)
    });
  }, [nodePositions, dimensions]);

  // Auto-fit initially and when first nodes appear
  useEffect(() => {
    if (nodes.length > 0 && nodes.length <= 5) {
      setTimeout(fitToView, 100);
    }
  }, [nodes.length > 0]);

  // Mouse wheel zoom
  const handleWheel = (e) => {
    e.preventDefault();
    const rect = containerRef.current.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    const worldBefore = screenToWorld(mouseX, mouseY);
    const delta = e.deltaY > 0 ? 0.9 : 1.1;
    const newScale = Math.max(0.15, Math.min(3, scale * delta));
    
    const newOffset = {
      x: worldBefore.x - mouseX / newScale,
      y: worldBefore.y - mouseY / newScale
    };

    setScale(newScale);
    setOffset(newOffset);
  };

  // Pan handlers
  const handleMouseDown = (e) => {
    if (e.button === 0) {
      setIsDragging(true);
      setDragStart({ x: e.clientX, y: e.clientY });
    }
  };

  const handleMouseMove = (e) => {
    if (isDragging) {
      const dx = (e.clientX - dragStart.x) / scale;
      const dy = (e.clientY - dragStart.y) / scale;
      setOffset(prev => ({ x: prev.x - dx, y: prev.y - dy }));
      setDragStart({ x: e.clientX, y: e.clientY });
    } else {
      // Handle node hover
      const rect = containerRef.current.getBoundingClientRect();
      const mouseX = e.clientX - rect.left;
      const mouseY = e.clientY - rect.top;
      const world = screenToWorld(mouseX, mouseY);

      // Hover radius in world coordinates - matches visual node size
      // Visual node size: Math.max(36, 56 * scale) pixels
      // World radius = screen radius / scale = Math.max(18/scale, 28)
      const hoverRadius = Math.max(18 / scale, 28) + 5; // +5 for easier targeting

      let found = null;
      for (const node of nodes) {
        const pos = nodePositions[node.id];
        if (pos) {
          const dist = Math.sqrt((world.x - pos.x) ** 2 + (world.y - pos.y) ** 2);
          if (dist < hoverRadius) {
            found = node;
            break;
          }
        }
      }
      setHoveredNode(found);
    }
  };

  const handleMouseUp = () => setIsDragging(false);
  const handleMouseLeave = () => {
    setIsDragging(false);
    setHoveredNode(null);
  };

  return (
    <div 
      ref={containerRef} 
      className="relative w-full h-full min-h-[500px] bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 rounded-xl overflow-hidden select-none"
      onWheel={handleWheel}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseLeave}
      style={{ cursor: isDragging ? 'grabbing' : 'grab' }}
    >
      {/* Canvas for edges, grid, and particles */}
      <canvas
        ref={canvasRef}
        width={dimensions.width}
        height={dimensions.height}
        className="absolute inset-0"
      />

      {/* Nodes */}
      <AnimatePresence>
        {nodes.map(node => {
          const pos = nodePositions[node.id];
          if (!pos) return null;

          const screen = worldToScreen(pos.x, pos.y);
          const isSuspicious = suspiciousNodes.has(node.id) || node.isSuspicious;
          const nodeSize = Math.max(36, 56 * scale);

          // Only render if visible
          if (screen.x < -nodeSize || screen.x > dimensions.width + nodeSize ||
              screen.y < -nodeSize || screen.y > dimensions.height + nodeSize) {
            return null;
          }

          return (
            <motion.div
              key={node.id}
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 500, damping: 30 }}
              className={`absolute rounded-full flex items-center justify-center cursor-pointer transition-colors duration-300 ${
                isSuspicious 
                  ? 'bg-red-500/20 border-2 border-red-500 shadow-lg shadow-red-500/50' 
                  : 'bg-blue-500/20 border-2 border-blue-500 shadow-lg shadow-blue-500/30'
              } ${node.isNew ? 'ring-4 ring-emerald-400 ring-opacity-75' : ''}`}
              style={{ 
                left: screen.x, 
                top: screen.y,
                width: nodeSize,
                height: nodeSize,
                transform: 'translate(-50%, -50%)',
                fontSize: Math.max(9, 13 * scale)
              }}
              onClick={() => onNodeClick?.(node)}
              whileHover={{ scale: 1.15 }}
              whileTap={{ scale: 0.95 }}
            >
              <span className="font-mono text-white truncate px-1">
                {node.label?.slice(-4) || node.id.slice(-4)}
              </span>
              
              {node.isNew && (
                <motion.div
                  className="absolute inset-0 rounded-full bg-emerald-400"
                  initial={{ scale: 1, opacity: 0.6 }}
                  animate={{ scale: 2, opacity: 0 }}
                  transition={{ duration: 1, repeat: 2 }}
                />
              )}
            </motion.div>
          );
        })}
      </AnimatePresence>

      {/* Zoom Controls */}
      <div className="absolute top-4 right-4 flex flex-col gap-2 z-20">
        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          onClick={zoomIn}
          className="w-10 h-10 bg-slate-800/90 hover:bg-slate-700 border border-slate-600 rounded-lg flex items-center justify-center text-white text-xl font-bold shadow-lg"
          title="Zoom In"
        >
          +
        </motion.button>
        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          onClick={zoomOut}
          className="w-10 h-10 bg-slate-800/90 hover:bg-slate-700 border border-slate-600 rounded-lg flex items-center justify-center text-white text-xl font-bold shadow-lg"
          title="Zoom Out"
        >
          −
        </motion.button>
        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          onClick={fitToView}
          className="w-10 h-10 bg-slate-800/90 hover:bg-slate-700 border border-slate-600 rounded-lg flex items-center justify-center text-white shadow-lg"
          title="Fit to View"
        >
          ⊡
        </motion.button>
      </div>

      {/* Zoom Level Indicator */}
      <div className="absolute top-4 left-4 px-3 py-1.5 bg-slate-800/80 rounded-lg border border-slate-700 text-xs font-mono text-slate-300 z-20">
        {Math.round(scale * 100)}%
      </div>

      {/* Hover tooltip */}
      <AnimatePresence>
        {hoveredNode && nodePositions[hoveredNode.id] && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className="absolute z-50 bg-slate-800/95 backdrop-blur-sm border border-slate-600 rounded-lg px-3 py-2 pointer-events-none"
            style={{
              left: worldToScreen(nodePositions[hoveredNode.id].x, nodePositions[hoveredNode.id].y).x + 35,
              top: worldToScreen(nodePositions[hoveredNode.id].x, nodePositions[hoveredNode.id].y).y - 10
            }}
          >
            <p className="text-sm font-mono text-white">{hoveredNode.id}</p>
            {(hoveredNode.isSuspicious || suspiciousNodes.has(hoveredNode.id)) && (
              <p className="text-xs text-red-400 mt-1">⚠️ Suspicious Activity</p>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Empty state */}
      {nodes.length === 0 && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center text-slate-400">
            <div className="text-6xl mb-4">📊</div>
            <p className="text-lg">Waiting for data...</p>
            <p className="text-sm opacity-75">Start streaming to see the network graph</p>
          </div>
        </div>
      )}

      {/* Legend */}
      <div className="absolute bottom-4 left-4 bg-slate-800/90 backdrop-blur-sm rounded-lg p-3 text-xs text-white border border-slate-700 z-20">
        <p className="font-bold text-slate-300 mb-2 text-[10px] uppercase tracking-wider">Nodes</p>
        <div className="flex items-center gap-2 mb-1.5">
          <div className="w-3 h-3 rounded-full bg-blue-500/30 border-2 border-blue-500"></div>
          <span>Normal Account</span>
        </div>
        <div className="flex items-center gap-2 mb-3">
          <div className="w-3 h-3 rounded-full bg-red-500/30 border-2 border-red-500 shadow-sm shadow-red-500/50"></div>
          <span>Suspicious Account</span>
        </div>
        
        <p className="font-bold text-slate-300 mb-2 text-[10px] uppercase tracking-wider">Money Flow</p>
        <div className="flex items-center gap-2 mb-1.5">
          <div className="w-3 h-3 rounded-full bg-emerald-400 shadow-sm shadow-emerald-400/50"></div>
          <span className="text-emerald-400">Normal Transaction</span>
        </div>
        <div className="flex items-center gap-2 mb-3">
          <div className="w-3 h-3 rounded-full bg-red-500 shadow-sm shadow-red-500/50"></div>
          <span className="text-red-400">Suspicious Transaction</span>
        </div>
        
        <div className="pt-2 border-t border-slate-600 text-slate-400">
          <p>🖱️ Scroll to zoom</p>
          <p>✋ Drag to pan</p>
        </div>
      </div>
    </div>
  );
}
