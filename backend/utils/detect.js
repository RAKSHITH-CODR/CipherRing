export function detectFraud(transactions) {
  const startTime = Date.now();
  
  const graph = {};
  const reverseGraph = {};
  const accountTransactionCount = {};
  const accountTimestamps = {}; // Track timestamps per account for velocity detection
  const allAccounts = new Set();
  
  // FALSE POSITIVE SHIELD: Track account behavior metadata for legitimacy analysis
  const accountMetadata = {}; // Track pattern participation per account
  const initAccountMetadata = (acc) => {
    if (!accountMetadata[acc]) {
      accountMetadata[acc] = {
        inCycle: false,
        inShell: false,
        hasFanIn: false,
        hasFanOut: false,
        ringCount: 0,
        uniquePartners: new Set()
      };
    }
  };
  
  transactions.forEach(tx => {
    const sender = tx.sender_id;
    const receiver = tx.receiver_id;
    const timestamp = new Date(tx.timestamp).getTime();
    
    allAccounts.add(sender);
    allAccounts.add(receiver);
    
    // Initialize metadata tracking
    initAccountMetadata(sender);
    initAccountMetadata(receiver);
    
    // Track unique transaction partners for topology analysis
    accountMetadata[sender].uniquePartners.add(receiver);
    accountMetadata[receiver].uniquePartners.add(sender);
    
    if (!graph[sender]) graph[sender] = [];
    graph[sender].push({ to: receiver, amount: tx.amount, timestamp });
    
    if (!reverseGraph[receiver]) reverseGraph[receiver] = [];
    reverseGraph[receiver].push({ from: sender, amount: tx.amount, timestamp });
    
    accountTransactionCount[sender] = (accountTransactionCount[sender] || 0) + 1;
    accountTransactionCount[receiver] = (accountTransactionCount[receiver] || 0) + 1;
    
    // Track timestamps for velocity detection
    if (!accountTimestamps[sender]) accountTimestamps[sender] = [];
    accountTimestamps[sender].push(timestamp);
    if (!accountTimestamps[receiver]) accountTimestamps[receiver] = [];
    accountTimestamps[receiver].push(timestamp);
  });

  const fraudRings = [];
  const suspiciousAccountsMap = {};
  let ringCounter = 0;

  // IMPROVEMENT 1: Efficient cycle detection with degree filtering
  function findCycles() {
    const cycles = [];
    const cycleKeys = new Set(); // Faster duplicate check
    
    function dfs(start, current, path, depth) {
      if (depth > 5) return;
      
      const neighbors = graph[current] || [];
      for (const edge of neighbors) {
        const neighbor = edge.to;
        
        if (neighbor === start && path.length >= 3 && path.length <= 5) {
          const cycleKey = [...path].sort().join(',');
          if (!cycleKeys.has(cycleKey)) {
            cycleKeys.add(cycleKey);
            cycles.push([...path]);
          }
          continue;
        }
        
        if (!path.includes(neighbor)) {
          path.push(neighbor);
          dfs(start, neighbor, path, depth + 1);
          path.pop();
        }
      }
    }
    
    // OPTIMIZATION: Only start DFS from nodes with both in AND out edges
    for (const account of allAccounts) {
      // Prune: Skip nodes that can't possibly form cycles
      if (!graph[account] || !reverseGraph[account]) continue;
      if (graph[account].length === 0 || reverseGraph[account].length === 0) continue;
      
      dfs(account, account, [account], 1);
    }
    
    return cycles;
  }

  // IMPROVEMENT 4: Enhanced smurfing with aggregation-dispersion linking
  function findSmurfingPatterns() {
    const patterns = [];
    const HOUR_72 = 72 * 60 * 60 * 1000;
    const aggregatorDispersionMap = {}; // Track aggregators that also disperse
    
    for (const account of allAccounts) {
      const incoming = reverseGraph[account] || [];
      const outgoing = graph[account] || [];
      
      // Group incoming by 72-hour windows
      const windowedIncoming = {};
      incoming.forEach(tx => {
        const windowKey = Math.floor(tx.timestamp / HOUR_72);
        if (!windowedIncoming[windowKey]) windowedIncoming[windowKey] = [];
        windowedIncoming[windowKey].push(tx);
      });
      
      // Group outgoing by 72-hour windows  
      const windowedOutgoing = {};
      outgoing.forEach(tx => {
        const windowKey = Math.floor(tx.timestamp / HOUR_72);
        if (!windowedOutgoing[windowKey]) windowedOutgoing[windowKey] = [];
        windowedOutgoing[windowKey].push(tx);
      });
      
      // Detect fan-in patterns
      for (const [windowKey, window] of Object.entries(windowedIncoming)) {
        const uniqueSenders = new Set(window.map(tx => tx.from));
        const totalAmount = window.reduce((sum, tx) => sum + parseFloat(tx.amount), 0);
        const avgAmount = totalAmount / window.length;
        
        // Check for small amount clustering (smurfing indicator)
        const smallAmounts = window.filter(tx => parseFloat(tx.amount) < avgAmount * 1.5);
        const isSmallAmountClustering = smallAmounts.length > window.length * 0.7;
        
        if (uniqueSenders.size >= 3) {
          // IMPROVEMENT: Check if aggregator disperses within same/next window
          const dispersesQuickly = windowedOutgoing[windowKey]?.length >= 2 || 
                                   windowedOutgoing[parseInt(windowKey) + 1]?.length >= 2;
          
          patterns.push({
            type: 'fan_in',
            aggregator: account,
            senders: [...uniqueSenders],
            count: uniqueSenders.size,
            totalAmount,
            smallAmountClustering: isSmallAmountClustering,
            dispersesQuickly // NEW: Flag for aggregator-dispersion pattern
          });
          
          if (dispersesQuickly) {
            aggregatorDispersionMap[account] = true;
          }
        }
      }
      
      // Detect fan-out patterns
      for (const [windowKey, window] of Object.entries(windowedOutgoing)) {
        const uniqueReceivers = new Set(window.map(tx => tx.to));
        const totalAmount = window.reduce((sum, tx) => sum + parseFloat(tx.amount), 0);
        
        if (uniqueReceivers.size >= 3) {
          // Check if this disperser received aggregation first
          const receivedAggregation = windowedIncoming[windowKey]?.length >= 2 ||
                                      windowedIncoming[parseInt(windowKey) - 1]?.length >= 2;
          
          patterns.push({
            type: 'fan_out',
            disperser: account,
            receivers: [...uniqueReceivers],
            count: uniqueReceivers.size,
            totalAmount,
            receivedAggregation // NEW: Flag for dispersion after aggregation
          });
        }
      }
    }
    
    return { patterns, aggregatorDispersionMap };
  }

  function findShellNetworks() {
    const shells = [];
    const isShellAccount = (acc) => {
      const count = accountTransactionCount[acc] || 0;
      return count >= 2 && count <= 3;
    };
    
    const processedChains = new Set();
    
    function findChains(startNode, path, visited) {
      if (path.length >= 3) {
        const intermediates = path.slice(1, -1);
        if (intermediates.length > 0 && intermediates.every(isShellAccount)) {
          const chainKey = path.join('->');
          if (!processedChains.has(chainKey)) {
            processedChains.add(chainKey);
            shells.push([...path]);
          }
        }
      }
      
      if (path.length >= 5) return;
      
      const neighbors = graph[startNode] || [];
      for (const edge of neighbors) {
        const neighbor = edge.to;
        if (!visited.has(neighbor)) {
          visited.add(neighbor);
          path.push(neighbor);
          findChains(neighbor, path, visited);
          path.pop();
          visited.delete(neighbor);
        }
      }
    }
    
    for (const account of allAccounts) {
      const visited = new Set([account]);
      findChains(account, [account], visited);
    }
    
    return shells.slice(0, 20);
  }

  const cycles = findCycles();
  cycles.forEach(cycle => {
    ringCounter++;
    const ringId = `RING_${String(ringCounter).padStart(3, '0')}`;
    const patternName = `cycle_length_${cycle.length}`;
    
    const riskScore = Math.min(100, 70 + cycle.length * 5);
    
    fraudRings.push({
      ring_id: ringId,
      member_accounts: cycle,
      pattern_type: 'cycle',
      risk_score: parseFloat(riskScore.toFixed(1))
    });
    
    cycle.forEach(acc => {
      // FALSE POSITIVE SHIELD: Mark as cycle participant
      initAccountMetadata(acc);
      accountMetadata[acc].inCycle = true;
      accountMetadata[acc].ringCount++;
      
      if (!suspiciousAccountsMap[acc]) {
        suspiciousAccountsMap[acc] = {
          account_id: acc,
          suspicion_score: 0,
          detected_patterns: [],
          ring_ids: []
        };
      }
      suspiciousAccountsMap[acc].suspicion_score += 30;
      if (!suspiciousAccountsMap[acc].detected_patterns.includes(patternName)) {
        suspiciousAccountsMap[acc].detected_patterns.push(patternName);
      }
      suspiciousAccountsMap[acc].ring_ids.push(ringId);
    });
  });

  // Updated to use new return format with aggregator-dispersion tracking
  const { patterns: smurfPatterns, aggregatorDispersionMap } = findSmurfingPatterns();
  smurfPatterns.forEach(pattern => {
    ringCounter++;
    const ringId = `RING_${String(ringCounter).padStart(3, '0')}`;
    
    let members = [];
    if (pattern.type === 'fan_in') {
      members = [pattern.aggregator, ...pattern.senders.slice(0, 5)];
    } else {
      members = [pattern.disperser, ...pattern.receivers.slice(0, 5)];
    }
    
    // IMPROVEMENT 4: Higher risk for aggregation-dispersion patterns
    let baseRisk = 65 + pattern.count * 2;
    if (pattern.dispersesQuickly) baseRisk += 15; // Aggregator disperses quickly = very suspicious
    if (pattern.receivedAggregation) baseRisk += 15; // Disperser received aggregation first = very suspicious
    if (pattern.smallAmountClustering) baseRisk += 10; // Small amounts = smurfing indicator
    const riskScore = Math.min(100, baseRisk);
    
    fraudRings.push({
      ring_id: ringId,
      member_accounts: members,
      pattern_type: pattern.type === 'fan_in' ? 'smurfing_fan_in' : 'smurfing_fan_out',
      risk_score: parseFloat(riskScore.toFixed(1))
    });
    
    const patternName = pattern.type === 'fan_in' ? 'fan_in_aggregation' : 'fan_out_dispersion';
    
    if (pattern.type === 'fan_in') {
      // FALSE POSITIVE SHIELD: Mark aggregator as having fan_in pattern
      initAccountMetadata(pattern.aggregator);
      accountMetadata[pattern.aggregator].hasFanIn = true;
      accountMetadata[pattern.aggregator].ringCount++;
      
      if (!suspiciousAccountsMap[pattern.aggregator]) {
        suspiciousAccountsMap[pattern.aggregator] = {
          account_id: pattern.aggregator,
          suspicion_score: 0,
          detected_patterns: [],
          ring_ids: []
        };
      }
      // IMPROVEMENT 4: Extra score for aggregator-dispersion pattern
      let fanInScore = 40;
      if (pattern.dispersesQuickly) fanInScore += 20;
      if (pattern.smallAmountClustering) fanInScore += 10;
      suspiciousAccountsMap[pattern.aggregator].suspicion_score += fanInScore;
      suspiciousAccountsMap[pattern.aggregator].detected_patterns.push(patternName);
      if (pattern.dispersesQuickly) {
        suspiciousAccountsMap[pattern.aggregator].detected_patterns.push('aggregation_dispersion_link');
      }
      suspiciousAccountsMap[pattern.aggregator].ring_ids.push(ringId);
      
      pattern.senders.forEach(sender => {
        if (!suspiciousAccountsMap[sender]) {
          suspiciousAccountsMap[sender] = {
            account_id: sender,
            suspicion_score: 0,
            detected_patterns: [],
            ring_ids: []
          };
        }
        suspiciousAccountsMap[sender].suspicion_score += 20;
        if (!suspiciousAccountsMap[sender].detected_patterns.includes('smurfing_contributor')) {
          suspiciousAccountsMap[sender].detected_patterns.push('smurfing_contributor');
        }
        suspiciousAccountsMap[sender].ring_ids.push(ringId);
        // FALSE POSITIVE SHIELD: Mark contributors
        initAccountMetadata(sender);
        accountMetadata[sender].hasFanOut = true; // They send out
        accountMetadata[sender].ringCount++;
      });
    } else {
      // FALSE POSITIVE SHIELD: Mark disperser as having fan_out pattern
      initAccountMetadata(pattern.disperser);
      accountMetadata[pattern.disperser].hasFanOut = true;
      accountMetadata[pattern.disperser].ringCount++;
      
      if (!suspiciousAccountsMap[pattern.disperser]) {
        suspiciousAccountsMap[pattern.disperser] = {
          account_id: pattern.disperser,
          suspicion_score: 0,
          detected_patterns: [],
          ring_ids: []
        };
      }
      // IMPROVEMENT 4: Extra score for dispersion after aggregation
      let fanOutScore = 40;
      if (pattern.receivedAggregation) fanOutScore += 20;
      suspiciousAccountsMap[pattern.disperser].suspicion_score += fanOutScore;
      suspiciousAccountsMap[pattern.disperser].detected_patterns.push(patternName);
      if (pattern.receivedAggregation) {
        suspiciousAccountsMap[pattern.disperser].detected_patterns.push('dispersion_after_aggregation');
      }
      suspiciousAccountsMap[pattern.disperser].ring_ids.push(ringId);
      
      pattern.receivers.forEach(receiver => {
        if (!suspiciousAccountsMap[receiver]) {
          suspiciousAccountsMap[receiver] = {
            account_id: receiver,
            suspicion_score: 0,
            detected_patterns: [],
            ring_ids: []
          };
        }
        suspiciousAccountsMap[receiver].suspicion_score += 20;
        if (!suspiciousAccountsMap[receiver].detected_patterns.includes('smurfing_recipient')) {
          suspiciousAccountsMap[receiver].detected_patterns.push('smurfing_recipient');
        }
        suspiciousAccountsMap[receiver].ring_ids.push(ringId);
        // FALSE POSITIVE SHIELD: Mark recipients
        initAccountMetadata(receiver);
        accountMetadata[receiver].hasFanIn = true; // They receive
        accountMetadata[receiver].ringCount++;
      });
    }
  });

  const shellNetworks = findShellNetworks();
  shellNetworks.forEach(chain => {
    ringCounter++;
    const ringId = `RING_${String(ringCounter).padStart(3, '0')}`;
    
    const riskScore = Math.min(100, 60 + chain.length * 8);
    
    fraudRings.push({
      ring_id: ringId,
      member_accounts: chain,
      pattern_type: 'shell_network',
      risk_score: parseFloat(riskScore.toFixed(1))
    });
    
    chain.forEach((acc, idx) => {
      // FALSE POSITIVE SHIELD: Mark as shell network participant
      initAccountMetadata(acc);
      accountMetadata[acc].inShell = true;
      accountMetadata[acc].ringCount++;
      
      if (!suspiciousAccountsMap[acc]) {
        suspiciousAccountsMap[acc] = {
          account_id: acc,
          suspicion_score: 0,
          detected_patterns: [],
          ring_ids: []
        };
      }
      
      if (idx > 0 && idx < chain.length - 1) {
        suspiciousAccountsMap[acc].suspicion_score += 35;
        if (!suspiciousAccountsMap[acc].detected_patterns.includes('shell_intermediary')) {
          suspiciousAccountsMap[acc].detected_patterns.push('shell_intermediary');
        }
      } else {
        suspiciousAccountsMap[acc].suspicion_score += 15;
        if (!suspiciousAccountsMap[acc].detected_patterns.includes('shell_endpoint')) {
          suspiciousAccountsMap[acc].detected_patterns.push('shell_endpoint');
        }
      }
      suspiciousAccountsMap[acc].ring_ids.push(ringId);
    });
  });

  // IMPROVEMENT 2: High velocity detection using time windows (1 hour)
  // Instead of simple count > 50, detect bursts within short time windows
  const HOUR_1 = 60 * 60 * 1000; // 1 hour in milliseconds
  const highVelocityAccounts = new Set();
  
  for (const acc of allAccounts) {
    const timestamps = accountTimestamps[acc] || [];
    if (timestamps.length < 10) continue; // Need minimum activity
    
    // Sort timestamps and check for bursts
    const sortedTs = [...timestamps].sort((a, b) => a - b);
    
    // Sliding window: count transactions in any 1-hour period
    let maxInHour = 0;
    for (let i = 0; i < sortedTs.length; i++) {
      const windowEnd = sortedTs[i] + HOUR_1;
      let count = 0;
      for (let j = i; j < sortedTs.length && sortedTs[j] <= windowEnd; j++) {
        count++;
      }
      maxInHour = Math.max(maxInHour, count);
    }
    
    // Flag if more than 15 transactions in any 1-hour window (fraud-like burst)
    if (maxInHour >= 15) {
      highVelocityAccounts.add(acc);
      if (!suspiciousAccountsMap[acc]) {
        suspiciousAccountsMap[acc] = {
          account_id: acc,
          suspicion_score: 0,
          detected_patterns: [],
          ring_ids: []
        };
      }
      suspiciousAccountsMap[acc].suspicion_score += 15;
      if (!suspiciousAccountsMap[acc].detected_patterns.includes('high_velocity_burst')) {
        suspiciousAccountsMap[acc].detected_patterns.push('high_velocity_burst');
      }
    }
  }

  // IMPROVEMENT 3: Legitimacy penalty - reduce false positives for legitimate high-volume accounts
  // If account has high transaction count but NO suspicious patterns (cycles, shell, smurfing),
  // it's likely a legitimate merchant/payroll account
  for (const acc of allAccounts) {
    const txCount = accountTransactionCount[acc] || 0;
    
    if (suspiciousAccountsMap[acc] && txCount > 100) {
      const patterns = suspiciousAccountsMap[acc].detected_patterns;
      
      // Check if only flagged for volume-based patterns, not structural patterns
      const structuralPatterns = ['cycle_length_3', 'cycle_length_4', 'cycle_length_5', 
        'shell_intermediary', 'fan_in_aggregation', 'fan_out_dispersion', 
        'aggregation_dispersion_link', 'dispersion_after_aggregation'];
      
      const hasStructuralPattern = patterns.some(p => 
        structuralPatterns.includes(p) || p.startsWith('cycle_length')
      );
      
      // High-volume + no structural patterns = likely legitimate
      if (!hasStructuralPattern) {
        suspiciousAccountsMap[acc].suspicion_score -= 25;
        suspiciousAccountsMap[acc].detected_patterns.push('legitimacy_adjustment');
      }
    }
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // FALSE POSITIVE SHIELD LAYER - Enterprise-grade precision filtering
  // Reduces false positives by analyzing behavioral legitimacy signals
  // ═══════════════════════════════════════════════════════════════════════════
  
  function applyFalsePositiveShield(acc) {
    if (!suspiciousAccountsMap[acc]) return;
    
    const meta = accountMetadata[acc] || {
      inCycle: false, inShell: false, hasFanIn: false, hasFanOut: false, 
      ringCount: 0, uniquePartners: new Set()
    };
    const txCount = accountTransactionCount[acc] || 0;
    const patterns = suspiciousAccountsMap[acc].detected_patterns;
    const currentScore = suspiciousAccountsMap[acc].suspicion_score;
    const sendCount = (graph[acc] || []).length;
    const receiveCount = (reverseGraph[acc] || []).length;
    
    let shieldAdjustment = 0;
    const shieldReasons = [];
    
    // ═══════════════════════════════════════════════════════════════════════
    // SHIELD 1: Low Score Already (Minor Involvement)
    // Accounts with low scores are peripheral participants
    // ═══════════════════════════════════════════════════════════════════════
    if (currentScore <= 25) {
      shieldAdjustment -= 15;
      shieldReasons.push('shield_low_risk');
    }
    
    // ═══════════════════════════════════════════════════════════════════════
    // SHIELD 2: Edge Participants (Contributors/Recipients Only)
    // These are edge nodes, not central to fraud operation
    // ═══════════════════════════════════════════════════════════════════════
    const edgePatterns = ['smurfing_contributor', 'smurfing_recipient', 'shell_endpoint'];
    const hasOnlyEdgePatterns = patterns.filter(p => !p.startsWith('shield_') && !p.startsWith('legitimacy')).every(p => edgePatterns.includes(p));
    
    if (hasOnlyEdgePatterns && patterns.length >= 1) {
      shieldAdjustment -= 20;
      shieldReasons.push('shield_edge_node');
    }
    
    // ═══════════════════════════════════════════════════════════════════════
    // SHIELD 3: Single Ring Participation (Not a Hub)
    // In only 1 fraud ring = peripheral, not orchestrator
    // ═══════════════════════════════════════════════════════════════════════
    if (meta.ringCount === 1) {
      shieldAdjustment -= 10;
      shieldReasons.push('shield_single_ring');
    }
    
    // ═══════════════════════════════════════════════════════════════════════
    // SHIELD 4: Low Transaction Volume (Unlikely Active Mule)
    // Few transactions = probably innocent bystander
    // ═══════════════════════════════════════════════════════════════════════
    if (txCount <= 2) {
      shieldAdjustment -= 15;
      shieldReasons.push('shield_minimal_activity');
    } else if (txCount <= 4) {
      shieldAdjustment -= 10;
      shieldReasons.push('shield_low_activity');
    }
    
    // ═══════════════════════════════════════════════════════════════════════
    // SHIELD 5: One-Way Flow (Not Layering Money)
    // Only sends OR only receives = not actively laundering
    // ═══════════════════════════════════════════════════════════════════════
    if ((sendCount > 0 && receiveCount === 0) || (receiveCount > 0 && sendCount === 0)) {
      shieldAdjustment -= 10;
      shieldReasons.push('shield_one_way_flow');
    }
    
    // ═══════════════════════════════════════════════════════════════════════
    // SHIELD 6: Not in Both Cycle AND Smurfing (Limited Involvement)
    // If not participating in multiple fraud types, less suspicious
    // ═══════════════════════════════════════════════════════════════════════
    const hasCyclePattern = patterns.some(p => p.startsWith('cycle_'));
    const hasSmurfPattern = patterns.some(p => p.includes('smurf') || p.includes('fan_'));
    const hasShellPattern = patterns.some(p => p.includes('shell'));
    
    const patternTypeCount = [hasCyclePattern, hasSmurfPattern, hasShellPattern].filter(Boolean).length;
    if (patternTypeCount === 1) {
      shieldAdjustment -= 10;
      shieldReasons.push('shield_single_pattern_type');
    }
    
    // ═══════════════════════════════════════════════════════════════════════
    // Apply shield adjustments
    // ═══════════════════════════════════════════════════════════════════════
    if (shieldAdjustment < 0) {
      const newScore = Math.max(5, currentScore + shieldAdjustment);
      suspiciousAccountsMap[acc].suspicion_score = newScore;
      suspiciousAccountsMap[acc].detected_patterns.push(...shieldReasons);
      
      // Mark as cleared if score dropped to threshold
      if (newScore <= 20) {
        suspiciousAccountsMap[acc].detected_patterns.push('shield_cleared');
      }
    }
  }
  
  // Apply False Positive Shield to all flagged accounts
  for (const acc of Object.keys(suspiciousAccountsMap)) {
    applyFalsePositiveShield(acc);
  }
  
  // Filter out accounts cleared by shield (score <= 20)
  const filteredSuspiciousMap = {};
  let shieldedCount = 0;
  for (const [acc, data] of Object.entries(suspiciousAccountsMap)) {
    if (data.suspicion_score > 20) {
      filteredSuspiciousMap[acc] = data;
    } else {
      shieldedCount++;
    }
  }

  // Use filtered map for final suspicious accounts list (excludes cleared accounts)
  const suspiciousAccounts = Object.values(filteredSuspiciousMap)
    .map(acc => ({
      account_id: acc.account_id,
      suspicion_score: Math.min(100, parseFloat(acc.suspicion_score.toFixed(1))),
      detected_patterns: acc.detected_patterns,
      ring_id: acc.ring_ids[0] || null
    }))
    .sort((a, b) => b.suspicion_score - a.suspicion_score);

  const endTime = Date.now();
  const processingTime = (endTime - startTime) / 1000;

  const graphData = {
    nodes: [...allAccounts].map(acc => {
      const wasShielded = suspiciousAccountsMap[acc]?.detected_patterns?.includes('shield_cleared');
      const isStillSuspicious = !!filteredSuspiciousMap[acc];
      return {
        id: acc,
        isSuspicious: isStillSuspicious,
        wasShielded: wasShielded,
        suspicionScore: isStillSuspicious ? (filteredSuspiciousMap[acc]?.suspicion_score || 0) : 0,
        transactionCount: accountTransactionCount[acc] || 0
      };
    }),
    edges: transactions.map(tx => ({
      from: tx.sender_id,
      to: tx.receiver_id,
      amount: tx.amount
    }))
  };

  return {
    suspicious_accounts: suspiciousAccounts,
    fraud_rings: fraudRings,
    summary: {
      total_accounts_analyzed: allAccounts.size,
      suspicious_accounts_flagged: suspiciousAccounts.length,
      false_positives_filtered: shieldedCount,
      fraud_rings_detected: fraudRings.length,
      processing_time_seconds: parseFloat(processingTime.toFixed(2))
    },
    graph_data: graphData
  };
}
