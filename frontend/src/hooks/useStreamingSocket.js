import { useEffect, useRef, useState, useCallback } from 'react';
import { io } from 'socket.io-client';

const SOCKET_URL = 'http://localhost:5000';

/**
 * Custom hook for WebSocket streaming
 * @returns {Object} Streaming state and controls
 */
export function useStreamingSocket() {
  const socketRef = useRef(null);
  const [isConnected, setIsConnected] = useState(false);
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamProgress, setStreamProgress] = useState({ current: 0, total: 0 });
  const [nodes, setNodes] = useState([]);
  const [edges, setEdges] = useState([]);
  const [activeEdge, setActiveEdge] = useState(null);
  const [detections, setDetections] = useState([]);
  const [stats, setStats] = useState(null);
  const [finalResults, setFinalResults] = useState(null);
  const [error, setError] = useState(null);
  const [streamDelay, setStreamDelay] = useState(300);

  // Initialize socket connection
  useEffect(() => {
    socketRef.current = io(SOCKET_URL, {
      transports: ['websocket', 'polling']
    });

    socketRef.current.on('connect', () => {
      console.log('Connected to server');
      setIsConnected(true);
      setError(null);
    });

    socketRef.current.on('disconnect', () => {
      console.log('Disconnected from server');
      setIsConnected(false);
    });

    socketRef.current.on('connect_error', (err) => {
      console.error('Connection error:', err);
      setError('Failed to connect to server');
      setIsConnected(false);
    });

    socketRef.current.on('error', (data) => {
      setError(data.message);
      setIsStreaming(false);
    });

    socketRef.current.on('stream-start', (data) => {
      console.log('Stream started:', data);
      setStreamProgress({ current: 0, total: data.totalTransactions });
      setNodes([]);
      setEdges([]);
      setDetections([]);
      setFinalResults(null);
      setError(null);
    });

    socketRef.current.on('transaction', (data) => {
      const { index, total, transaction, newNodes, newEdge, detections: txDetections, stats: txStats } = data;

      setStreamProgress({ current: index + 1, total });
      setStats(txStats);

      // Add new nodes
      if (newNodes.length > 0) {
        setNodes(prev => [
          ...prev,
          ...newNodes.map(n => ({
            id: n.id,
            label: n.id,
            isNew: true,
            color: {
              background: '#1e40af',
              border: '#60a5fa',
              highlight: { background: '#3b82f6', border: '#93c5fd' }
            }
          }))
        ]);

        // Remove "new" flag after animation
        setTimeout(() => {
          setNodes(prev => prev.map(n => 
            newNodes.some(nn => nn.id === n.id) ? { ...n, isNew: false } : n
          ));
        }, 1000);
      }

      // Add new edge with animation
      const edgeWithMeta = {
        from: newEdge.from,
        to: newEdge.to,
        amount: newEdge.amount,
        timestamp: newEdge.timestamp,
        isActive: true,
        id: `${newEdge.from}_${newEdge.to}_${Date.now()}`
      };

      setEdges(prev => [...prev, edgeWithMeta]);
      setActiveEdge(edgeWithMeta);

      // Clear active edge after animation
      setTimeout(() => {
        setActiveEdge(null);
        setEdges(prev => prev.map(e => 
          e.id === edgeWithMeta.id ? { ...e, isActive: false } : e
        ));
      }, streamDelay - 50);

      // Handle detections
      if (txDetections.newCycles.length > 0 || txDetections.newSmurfing.length > 0) {
        setDetections(prev => [
          ...prev,
          ...txDetections.newCycles.map(c => ({ ...c, timestamp: Date.now() })),
          ...txDetections.newSmurfing.map(s => ({ ...s, timestamp: Date.now() }))
        ]);

        // Update node colors for detected accounts
        const detectedAccounts = new Set([
          ...txDetections.newCycles.flatMap(c => c.member_accounts),
          ...txDetections.newSmurfing.flatMap(s => s.member_accounts)
        ]);

        setNodes(prev => prev.map(n => 
          detectedAccounts.has(n.id) 
            ? {
                ...n,
                color: {
                  background: '#dc2626',
                  border: '#f87171',
                  highlight: { background: '#ef4444', border: '#fca5a5' }
                },
                isSuspicious: true
              }
            : n
        ));
      }
    });

    socketRef.current.on('stream-complete', (data) => {
      console.log('Stream complete:', data);
      setFinalResults(data.finalResults);
      setIsStreaming(false);
    });

    socketRef.current.on('stream-stopped', (data) => {
      console.log('Stream stopped:', data);
      setIsStreaming(false);
    });

    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
    };
  }, [streamDelay]);

  // Start streaming
  const startStream = useCallback(async (file) => {
    if (!socketRef.current || !isConnected) {
      setError('Not connected to server');
      return;
    }

    if (!file) {
      setError('No file selected');
      return;
    }

    setIsStreaming(true);
    setError(null);
    setNodes([]);
    setEdges([]);
    setDetections([]);
    setFinalResults(null);

    // Read file as base64
    const reader = new FileReader();
    reader.onload = () => {
      const base64 = reader.result.split(',')[1];
      socketRef.current.emit('start-stream', {
        fileData: base64,
        fileName: file.name,
        streamDelay
      });
    };
    reader.readAsDataURL(file);
  }, [isConnected, streamDelay]);

  // Stop streaming
  const stopStream = useCallback(() => {
    if (socketRef.current) {
      socketRef.current.emit('stop-stream');
    }
    setIsStreaming(false);
  }, []);

  // Reset state
  const reset = useCallback(() => {
    setNodes([]);
    setEdges([]);
    setDetections([]);
    setStats(null);
    setFinalResults(null);
    setStreamProgress({ current: 0, total: 0 });
    setError(null);
    setActiveEdge(null);
  }, []);

  return {
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
  };
}
