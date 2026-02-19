export function detectFraud(transactions) {
  const startTime = Date.now();
  
  const graph = {};
  const reverseGraph = {};
  const accountTransactionCount = {};
  const allAccounts = new Set();
  
  transactions.forEach(tx => {
    const sender = tx.sender_id;
    const receiver = tx.receiver_id;
    const timestamp = new Date(tx.timestamp).getTime();
    
    allAccounts.add(sender);
    allAccounts.add(receiver);
    
    if (!graph[sender]) graph[sender] = [];
    graph[sender].push({ to: receiver, amount: tx.amount, timestamp });
    
    if (!reverseGraph[receiver]) reverseGraph[receiver] = [];
    reverseGraph[receiver].push({ from: sender, amount: tx.amount, timestamp });
    
    accountTransactionCount[sender] = (accountTransactionCount[sender] || 0) + 1;
    accountTransactionCount[receiver] = (accountTransactionCount[receiver] || 0) + 1;
  });

  const fraudRings = [];
  const suspiciousAccountsMap = {};
  let ringCounter = 0;

  function findCycles() {
    const cycles = [];
    const visited = new Set();
    
    function dfs(start, current, path, depth) {
      if (depth > 5) return;
      
      const neighbors = graph[current] || [];
      for (const edge of neighbors) {
        const neighbor = edge.to;
        
        if (neighbor === start && path.length >= 3 && path.length <= 5) {
          const cycleKey = [...path].sort().join(',');
          if (!cycles.find(c => [...c].sort().join(',') === cycleKey)) {
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
    
    for (const account of allAccounts) {
      dfs(account, account, [account], 1);
    }
    
    return cycles;
  }

  function findSmurfingPatterns() {
    const patterns = [];
    const HOUR_72 = 72 * 60 * 60 * 1000;
    
    for (const account of allAccounts) {
      const incoming = reverseGraph[account] || [];
      const outgoing = graph[account] || [];
      
      const windowedIncoming = {};
      incoming.forEach(tx => {
        const windowKey = Math.floor(tx.timestamp / HOUR_72);
        if (!windowedIncoming[windowKey]) windowedIncoming[windowKey] = [];
        windowedIncoming[windowKey].push(tx);
      });
      
      for (const window of Object.values(windowedIncoming)) {
        const uniqueSenders = new Set(window.map(tx => tx.from));
        if (uniqueSenders.size >= 10) {
          patterns.push({
            type: 'fan_in',
            aggregator: account,
            senders: [...uniqueSenders],
            count: uniqueSenders.size
          });
        }
      }
      
      const windowedOutgoing = {};
      outgoing.forEach(tx => {
        const windowKey = Math.floor(tx.timestamp / HOUR_72);
        if (!windowedOutgoing[windowKey]) windowedOutgoing[windowKey] = [];
        windowedOutgoing[windowKey].push(tx);
      });
      
      for (const window of Object.values(windowedOutgoing)) {
        const uniqueReceivers = new Set(window.map(tx => tx.to));
        if (uniqueReceivers.size >= 10) {
          patterns.push({
            type: 'fan_out',
            disperser: account,
            receivers: [...uniqueReceivers],
            count: uniqueReceivers.size
          });
        }
      }
    }
    
    return patterns;
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

  const smurfPatterns = findSmurfingPatterns();
  smurfPatterns.forEach(pattern => {
    ringCounter++;
    const ringId = `RING_${String(ringCounter).padStart(3, '0')}`;
    
    let members = [];
    if (pattern.type === 'fan_in') {
      members = [pattern.aggregator, ...pattern.senders.slice(0, 5)];
    } else {
      members = [pattern.disperser, ...pattern.receivers.slice(0, 5)];
    }
    
    const riskScore = Math.min(100, 65 + pattern.count * 2);
    
    fraudRings.push({
      ring_id: ringId,
      member_accounts: members,
      pattern_type: pattern.type === 'fan_in' ? 'smurfing_fan_in' : 'smurfing_fan_out',
      risk_score: parseFloat(riskScore.toFixed(1))
    });
    
    const patternName = pattern.type === 'fan_in' ? 'fan_in_aggregation' : 'fan_out_dispersion';
    
    if (pattern.type === 'fan_in') {
      if (!suspiciousAccountsMap[pattern.aggregator]) {
        suspiciousAccountsMap[pattern.aggregator] = {
          account_id: pattern.aggregator,
          suspicion_score: 0,
          detected_patterns: [],
          ring_ids: []
        };
      }
      suspiciousAccountsMap[pattern.aggregator].suspicion_score += 40;
      suspiciousAccountsMap[pattern.aggregator].detected_patterns.push(patternName);
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
      });
    } else {
      if (!suspiciousAccountsMap[pattern.disperser]) {
        suspiciousAccountsMap[pattern.disperser] = {
          account_id: pattern.disperser,
          suspicion_score: 0,
          detected_patterns: [],
          ring_ids: []
        };
      }
      suspiciousAccountsMap[pattern.disperser].suspicion_score += 40;
      suspiciousAccountsMap[pattern.disperser].detected_patterns.push(patternName);
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

  for (const acc of allAccounts) {
    if (suspiciousAccountsMap[acc]) {
      const txCount = accountTransactionCount[acc] || 0;
      if (txCount > 50) {
        suspiciousAccountsMap[acc].suspicion_score += 10;
        if (!suspiciousAccountsMap[acc].detected_patterns.includes('high_velocity')) {
          suspiciousAccountsMap[acc].detected_patterns.push('high_velocity');
        }
      }
    }
  }

  const suspiciousAccounts = Object.values(suspiciousAccountsMap)
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
    nodes: [...allAccounts].map(acc => ({
      id: acc,
      isSuspicious: !!suspiciousAccountsMap[acc],
      suspicionScore: suspiciousAccountsMap[acc]?.suspicion_score || 0,
      transactionCount: accountTransactionCount[acc] || 0
    })),
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
      fraud_rings_detected: fraudRings.length,
      processing_time_seconds: parseFloat(processingTime.toFixed(2))
    },
    graph_data: graphData
  };
}
