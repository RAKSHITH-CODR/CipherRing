import multer from 'multer';
import fs from 'fs';
import csv from 'csv-parser';
import { validateCsv } from '../utils/validateCSV.js';

const upload = multer({ dest: 'uploads/' });

/**
 * Setup WebSocket streaming for real-time transaction analysis
 * @param {Server} io - Socket.io server instance
 */
export function setupStreamingSocket(io) {
  io.on('connection', (socket) => {
    console.log(`Client connected: ${socket.id}`);
    
    let isStreaming = false;
    let shouldStop = false;

    // Handle file upload for streaming
    socket.on('start-stream', async (data) => {
      if (isStreaming) {
        socket.emit('error', { message: 'Stream already in progress' });
        return;
      }

      const { fileData, fileName, streamDelay = 300 } = data;
      
      if (!fileData) {
        socket.emit('error', { message: 'No file data provided' });
        return;
      }

      isStreaming = true;
      shouldStop = false;

      try {
        // Decode base64 file data
        const buffer = Buffer.from(fileData, 'base64');
        const tempPath = `uploads/stream_${socket.id}_${Date.now()}.csv`;
        fs.writeFileSync(tempPath, buffer);

        // Parse CSV and collect transactions
        const transactions = [];
        let headerError = null;

        await new Promise((resolve, reject) => {
          fs.createReadStream(tempPath)
            .pipe(csv())
            .on('headers', (headers) => {
              const missing = validateCsv(headers);
              if (missing.length > 0) {
                headerError = `Missing columns: ${missing.join(', ')}`;
              }
            })
            .on('data', (row) => {
              if (!headerError) {
                row.amount = parseFloat(row.amount) || 0;
                transactions.push(row);
              }
            })
            .on('end', resolve)
            .on('error', reject);
        });

        // Cleanup temp file
        try { fs.unlinkSync(tempPath); } catch (e) {}

        if (headerError) {
          socket.emit('error', { message: headerError });
          isStreaming = false;
          return;
        }

        if (transactions.length === 0) {
          socket.emit('error', { message: 'No valid transactions found' });
          isStreaming = false;
          return;
        }

        // Emit stream start
        socket.emit('stream-start', {
          totalTransactions: transactions.length,
          fileName
        });

        // Initialize incremental detector
        const detector = new IncrementalDetector();

        // Stream transactions one by one
        for (let i = 0; i < transactions.length; i++) {
          if (shouldStop) {
            socket.emit('stream-stopped', { processedCount: i });
            break;
          }

          const tx = transactions[i];
          
          // Add transaction to detector
          const result = detector.addTransaction(tx);

          // Emit transaction with detection results
          socket.emit('transaction', {
            index: i,
            total: transactions.length,
            transaction: tx,
            newNodes: result.newNodes,
            newEdge: result.newEdge,
            detections: result.detections,
            stats: result.stats
          });

          // Wait before next transaction
          if (i < transactions.length - 1) {
            await sleep(streamDelay);
          }
        }

        // Emit final results
        if (!shouldStop) {
          socket.emit('stream-complete', {
            finalResults: detector.getFinalResults(),
            totalProcessed: transactions.length
          });
        }

      } catch (error) {
        console.error('Stream error:', error);
        socket.emit('error', { message: 'Error processing stream' });
      } finally {
        isStreaming = false;
      }
    });

    // Handle stream stop request
    socket.on('stop-stream', () => {
      shouldStop = true;
    });

    socket.on('disconnect', () => {
      console.log(`Client disconnected: ${socket.id}`);
      shouldStop = true;
    });
  });
}

/**
 * Incremental fraud detector for real-time streaming
 */
class IncrementalDetector {
  constructor() {
    this.graph = {};           // sender -> [{to, amount, timestamp}]
    this.reverseGraph = {};    // receiver -> [{from, amount, timestamp}]
    this.allAccounts = new Set();
    this.transactions = [];
    this.txCount = {};
    this.timestamps = {};      // FALSE POSITIVE SHIELD: Track timestamps per account
    this.accountMetadata = {}; // FALSE POSITIVE SHIELD: Track pattern metadata
    this.detectedCycles = new Set();
    this.detectedSmurfing = new Set();
    this.suspiciousAccounts = {};
    this.fraudRings = [];
    this.ringCounter = 0;
  }

  initAccountMetadata(acc) {
    if (!this.accountMetadata[acc]) {
      this.accountMetadata[acc] = {
        inCycle: false,
        inShell: false,
        hasFanIn: false,
        hasFanOut: false,
        ringCount: 0,
        uniquePartners: new Set()
      };
    }
  }

  addTransaction(tx) {
    const sender = tx.sender_id;
    const receiver = tx.receiver_id;
    const timestamp = new Date(tx.timestamp).getTime();
    const amount = parseFloat(tx.amount);

    // Track new nodes
    const newNodes = [];
    if (!this.allAccounts.has(sender)) {
      this.allAccounts.add(sender);
      newNodes.push({ id: sender, type: 'sender' });
    }
    if (!this.allAccounts.has(receiver)) {
      this.allAccounts.add(receiver);
      newNodes.push({ id: receiver, type: 'receiver' });
    }

    // FALSE POSITIVE SHIELD: Initialize metadata and track relationships
    this.initAccountMetadata(sender);
    this.initAccountMetadata(receiver);
    this.accountMetadata[sender].uniquePartners.add(receiver);
    this.accountMetadata[receiver].uniquePartners.add(sender);
    
    // Track timestamps for time-spread analysis
    if (!this.timestamps[sender]) this.timestamps[sender] = [];
    this.timestamps[sender].push(timestamp);
    if (!this.timestamps[receiver]) this.timestamps[receiver] = [];
    this.timestamps[receiver].push(timestamp);

    // Build graph
    if (!this.graph[sender]) this.graph[sender] = [];
    this.graph[sender].push({ to: receiver, amount, timestamp });

    if (!this.reverseGraph[receiver]) this.reverseGraph[receiver] = [];
    this.reverseGraph[receiver].push({ from: sender, amount, timestamp });

    // Update transaction counts
    this.txCount[sender] = (this.txCount[sender] || 0) + 1;
    this.txCount[receiver] = (this.txCount[receiver] || 0) + 1;

    this.transactions.push(tx);

    // Create edge info
    const newEdge = {
      from: sender,
      to: receiver,
      amount,
      timestamp
    };

    // Run incremental detection
    const detections = this.detectIncremental(sender, receiver);

    return {
      newNodes,
      newEdge,
      detections,
      stats: {
        totalNodes: this.allAccounts.size,
        totalEdges: this.transactions.length,
        suspiciousCount: Object.keys(this.suspiciousAccounts).length,
        ringsDetected: this.fraudRings.length
      }
    };
  }

  detectIncremental(sender, receiver) {
    const detections = {
      newCycles: [],
      newSmurfing: [],
      suspicionUpdates: []
    };

    // Check for cycles involving the new edge
    const cycles = this.findCyclesFrom(receiver, sender, [receiver], 1);
    
    cycles.forEach(cycle => {
      const cycleKey = [...cycle].sort().join(',');
      if (!this.detectedCycles.has(cycleKey)) {
        this.detectedCycles.add(cycleKey);
        
        this.ringCounter++;
        const ringId = `RING_${String(this.ringCounter).padStart(3, '0')}`;
        const riskScore = Math.min(100, 70 + cycle.length * 5);
        
        const ring = {
          ring_id: ringId,
          member_accounts: cycle,
          pattern_type: 'cycle',
          risk_score: riskScore
        };
        
        this.fraudRings.push(ring);
        detections.newCycles.push(ring);

        // Update suspicion scores
        cycle.forEach(acc => {
          this.updateSuspicion(acc, 30, `cycle_length_${cycle.length}`, ringId);
          detections.suspicionUpdates.push({
            account: acc,
            score: this.suspiciousAccounts[acc].suspicion_score,
            pattern: `cycle_length_${cycle.length}`
          });
        });
      }
    });

    // Check for fan-in (smurfing aggregation)
    const incoming = this.reverseGraph[receiver] || [];
    if (incoming.length >= 3) {
      const uniqueSenders = new Set(incoming.map(t => t.from));
      const smurfKey = `fan_in_${receiver}`;
      
      if (!this.detectedSmurfing.has(smurfKey) && uniqueSenders.size >= 3) {
        this.detectedSmurfing.add(smurfKey);
        
        this.ringCounter++;
        const ringId = `RING_${String(this.ringCounter).padStart(3, '0')}`;
        
        const ring = {
          ring_id: ringId,
          member_accounts: [receiver, ...Array.from(uniqueSenders).slice(0, 5)],
          pattern_type: 'smurfing_fan_in',
          risk_score: Math.min(100, 65 + uniqueSenders.size * 2)
        };
        
        this.fraudRings.push(ring);
        detections.newSmurfing.push(ring);

        this.updateSuspicion(receiver, 40, 'fan_in_aggregation', ringId);
        detections.suspicionUpdates.push({
          account: receiver,
          score: this.suspiciousAccounts[receiver].suspicion_score,
          pattern: 'fan_in_aggregation'
        });
      }
    }

    // Check for fan-out (smurfing dispersion)
    const outgoing = this.graph[sender] || [];
    if (outgoing.length >= 3) {
      const uniqueReceivers = new Set(outgoing.map(t => t.to));
      const smurfKey = `fan_out_${sender}`;
      
      if (!this.detectedSmurfing.has(smurfKey) && uniqueReceivers.size >= 3) {
        this.detectedSmurfing.add(smurfKey);
        
        this.ringCounter++;
        const ringId = `RING_${String(this.ringCounter).padStart(3, '0')}`;
        
        const ring = {
          ring_id: ringId,
          member_accounts: [sender, ...Array.from(uniqueReceivers).slice(0, 5)],
          pattern_type: 'smurfing_fan_out',
          risk_score: Math.min(100, 65 + uniqueReceivers.size * 2)
        };
        
        this.fraudRings.push(ring);
        detections.newSmurfing.push(ring);

        this.updateSuspicion(sender, 40, 'fan_out_dispersion', ringId);
        detections.suspicionUpdates.push({
          account: sender,
          score: this.suspiciousAccounts[sender].suspicion_score,
          pattern: 'fan_out_dispersion'
        });
      }
    }

    return detections;
  }

  findCyclesFrom(current, target, path, depth) {
    if (depth > 5) return [];
    
    const cycles = [];
    const neighbors = this.graph[current] || [];
    
    for (const edge of neighbors) {
      if (edge.to === target && path.length >= 2 && path.length <= 4) {
        cycles.push([...path, target]);
      } else if (!path.includes(edge.to) && depth < 5) {
        const subCycles = this.findCyclesFrom(edge.to, target, [...path, edge.to], depth + 1);
        cycles.push(...subCycles);
      }
    }
    
    return cycles;
  }

  updateSuspicion(account, scoreAdd, pattern, ringId) {
    if (!this.suspiciousAccounts[account]) {
      this.suspiciousAccounts[account] = {
        account_id: account,
        suspicion_score: 0,
        detected_patterns: [],
        ring_ids: []
      };
    }
    
    // FALSE POSITIVE SHIELD: Track pattern metadata
    this.initAccountMetadata(account);
    if (pattern.startsWith('cycle_length')) {
      this.accountMetadata[account].inCycle = true;
    } else if (pattern === 'fan_in_aggregation') {
      this.accountMetadata[account].hasFanIn = true;
    } else if (pattern === 'fan_out_dispersion') {
      this.accountMetadata[account].hasFanOut = true;
    }
    if (ringId) {
      this.accountMetadata[account].ringCount++;
    }
    
    this.suspiciousAccounts[account].suspicion_score += scoreAdd;
    if (!this.suspiciousAccounts[account].detected_patterns.includes(pattern)) {
      this.suspiciousAccounts[account].detected_patterns.push(pattern);
    }
    if (ringId && !this.suspiciousAccounts[account].ring_ids.includes(ringId)) {
      this.suspiciousAccounts[account].ring_ids.push(ringId);
    }
  }

  // FALSE POSITIVE SHIELD: Apply legitimacy adjustments to reduce false positives
  applyFalsePositiveShield(acc) {
    if (!this.suspiciousAccounts[acc]) return;
    
    const meta = this.accountMetadata[acc] || {
      inCycle: false, inShell: false, hasFanIn: false, hasFanOut: false,
      ringCount: 0, uniquePartners: new Set()
    };
    const txCount = this.txCount[acc] || 0;
    const patterns = this.suspiciousAccounts[acc].detected_patterns;
    const currentScore = this.suspiciousAccounts[acc].suspicion_score;
    const sendCount = (this.graph[acc] || []).length;
    const receiveCount = (this.reverseGraph[acc] || []).length;
    
    let shieldAdjustment = 0;
    const shieldReasons = [];
    
    // SHIELD 1: Low Score Already (Minor Involvement)
    if (currentScore <= 25) {
      shieldAdjustment -= 15;
      shieldReasons.push('shield_low_risk');
    }
    
    // SHIELD 2: Edge Participants Only
    const edgePatterns = ['smurfing_contributor', 'smurfing_recipient', 'shell_endpoint'];
    const hasOnlyEdgePatterns = patterns.filter(p => !p.startsWith('shield_') && !p.startsWith('legitimacy')).every(p => edgePatterns.includes(p));
    if (hasOnlyEdgePatterns && patterns.length >= 1) {
      shieldAdjustment -= 20;
      shieldReasons.push('shield_edge_node');
    }
    
    // SHIELD 3: Single Ring Participation
    if (meta.ringCount === 1) {
      shieldAdjustment -= 10;
      shieldReasons.push('shield_single_ring');
    }
    
    // SHIELD 4: Low Transaction Volume
    if (txCount <= 2) {
      shieldAdjustment -= 15;
      shieldReasons.push('shield_minimal_activity');
    } else if (txCount <= 4) {
      shieldAdjustment -= 10;
      shieldReasons.push('shield_low_activity');
    }
    
    // SHIELD 5: One-Way Flow
    if ((sendCount > 0 && receiveCount === 0) || (receiveCount > 0 && sendCount === 0)) {
      shieldAdjustment -= 10;
      shieldReasons.push('shield_one_way_flow');
    }
    
    // SHIELD 6: Single Pattern Type
    const hasCyclePattern = patterns.some(p => p.startsWith('cycle_'));
    const hasSmurfPattern = patterns.some(p => p.includes('smurf') || p.includes('fan_'));
    const hasShellPattern = patterns.some(p => p.includes('shell'));
    const patternTypeCount = [hasCyclePattern, hasSmurfPattern, hasShellPattern].filter(Boolean).length;
    if (patternTypeCount === 1) {
      shieldAdjustment -= 10;
      shieldReasons.push('shield_single_pattern_type');
    }
    
    // Apply adjustments
    if (shieldAdjustment < 0) {
      const newScore = Math.max(5, currentScore + shieldAdjustment);
      this.suspiciousAccounts[acc].suspicion_score = newScore;
      this.suspiciousAccounts[acc].detected_patterns.push(...shieldReasons);
      
      if (newScore <= 20) {
        this.suspiciousAccounts[acc].detected_patterns.push('shield_cleared');
      }
    }
  }

  getFinalResults() {
    // Apply False Positive Shield to all flagged accounts
    for (const acc of Object.keys(this.suspiciousAccounts)) {
      this.applyFalsePositiveShield(acc);
    }
    
    // Filter out accounts cleared by shield (score <= 20)
    let shieldedCount = 0;
    const filteredAccounts = {};
    for (const [acc, data] of Object.entries(this.suspiciousAccounts)) {
      if (data.suspicion_score > 20) {
        filteredAccounts[acc] = data;
      } else {
        shieldedCount++;
      }
    }
    
    const suspiciousArray = Object.values(filteredAccounts)
      .map(acc => ({
        account_id: acc.account_id,
        suspicion_score: Math.min(100, acc.suspicion_score),
        detected_patterns: acc.detected_patterns,
        ring_id: acc.ring_ids[0] || null
      }))
      .sort((a, b) => b.suspicion_score - a.suspicion_score);

    return {
      suspicious_accounts: suspiciousArray,
      fraud_rings: this.fraudRings,
      summary: {
        total_accounts_analyzed: this.allAccounts.size,
        suspicious_accounts_flagged: suspiciousArray.length,
        false_positives_filtered: shieldedCount,
        fraud_rings_detected: this.fraudRings.length
      },
      graph_data: {
        nodes: Array.from(this.allAccounts).map(id => {
          const wasShielded = this.suspiciousAccounts[id]?.detected_patterns?.includes('shield_cleared');
          const isStillSuspicious = !!filteredAccounts[id];
          return {
            id,
            isSuspicious: isStillSuspicious,
            wasShielded: wasShielded,
            suspicionScore: isStillSuspicious ? (filteredAccounts[id]?.suspicion_score || 0) : 0,
            transactionCount: this.txCount[id] || 0
          };
        }),
        edges: this.transactions.map(tx => ({
          from: tx.sender_id,
          to: tx.receiver_id,
          amount: tx.amount
        }))
      }
    };
  }
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}
