# CipherRing 
### Graph-Based Money Muling Detection Engine

A real-time + batch financial forensics system that detects money mule networks using graph analytics and temporal pattern detection.

---

## 🚀 Overview

CipherRing analyzes transaction data from CSV uploads or live streams to uncover complex fraud structures such as circular fund routing, smurfing networks, and layered shell accounts.  
The system visualizes suspicious activity through an interactive graph and generates structured investigation-ready JSON output.

---

## 🔥 Core Features

🔄 Cycle Detection (3–5 Length Bounded DFS)  
💰 Smurfing Detection (72-Hour Temporal Window)  
🧩 Shell Network Detection (Layered Account Chains)  
📊 Suspicion Scoring Engine (0–100 Normalized)  
🆔 Fraud Ring Identification with Unique Ring IDs  
🛡️ False Positive Control Mechanism  
⚡ Live Detection Mode (WebSocket Streaming)  
📂 Batch CSV Analysis  
🌐 Interactive Graph Visualization (vis.js)  
✨ Animated Transaction Particles  
📦 Strict JSON Output Generation  
⏱️ Processing Time Measurement  

---

## 🏗 Tech Stack

Frontend: React.js, vis.js, WebSocket  
Backend: Node.js, Express.js, Graph Algorithms  

---

## 📊 Output

- Suspicious Accounts (Sorted by Score)  
- Fraud Rings Summary  
- Processing Metrics  
- Downloadable Structured JSON  

---

## 🔁 App Flow

CSV Upload / Live Stream → Graph Construction → Detection Engine → Suspicion Scoring → Visualization → JSON Export  

---

## 🏆 Hackathon Ready

Live Deployable  
Strict Output Format Compliance  
Graph-Theory Based Detection  
Real-Time + Batch Processing  
