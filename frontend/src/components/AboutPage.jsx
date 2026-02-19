import { motion } from 'framer-motion';

export default function AboutPage() {
  return (
    <div className="min-h-screen pt-24 pb-12">
      <div className="max-w-4xl mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            <span className="text-white">About </span>
            <span className="bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent">CipherRing</span>
          </h1>
          <p className="text-slate-400 max-w-2xl mx-auto">
            A specialized tool designed to combat money muling and financial fraud through advanced pattern detection.
          </p>
        </motion.div>

        {/* Mission Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-slate-900/50 border border-slate-800 rounded-2xl p-8 mb-8"
        >
          <div className="flex items-center gap-4 mb-4">
            <div className="w-12 h-12 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-xl flex items-center justify-center">
              <span className="text-2xl">🎯</span>
            </div>
            <h2 className="text-2xl font-bold text-white">Our Mission</h2>
          </div>
          <p className="text-slate-400 leading-relaxed">
            Money muling is a critical step in laundering money from cyber crimes. Criminals recruit innocent 
            people or create fake accounts to move stolen funds through a complex network of transactions, 
            making it difficult to trace the origin. CipherRing aims to detect these patterns automatically 
            using graph-based algorithms, helping financial institutions protect their customers and comply 
            with anti-money laundering regulations.
          </p>
        </motion.div>

        {/* What We Detect */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-slate-900/50 border border-slate-800 rounded-2xl p-8 mb-8"
        >
          <div className="flex items-center gap-4 mb-6">
            <div className="w-12 h-12 bg-gradient-to-br from-red-500 to-orange-600 rounded-xl flex items-center justify-center">
              <span className="text-2xl">🔍</span>
            </div>
            <h2 className="text-2xl font-bold text-white">What We Detect</h2>
          </div>
          <div className="grid md:grid-cols-2 gap-4">
            {[
              {
                title: 'Circular Money Flows',
                desc: 'Detecting cycles where money moves in a loop between 3-5 accounts, returning to origin.',
                icon: '🔄'
              },
              {
                title: 'Smurfing Patterns',
                desc: 'Identifying when multiple small deposits aggregate to one account or disperse from one source.',
                icon: '🐜'
              },
              {
                title: 'Shell Networks',
                desc: 'Finding chains of low-activity accounts used as intermediaries to hide money trails.',
                icon: '🏢'
              },
              {
                title: 'Velocity Anomalies',
                desc: 'Flagging accounts with unusual transaction bursts within short time windows.',
                icon: '⚡'
              }
            ].map((item, index) => (
              <motion.div
                key={item.title}
                className="p-4 bg-slate-800/30 rounded-xl border border-slate-700/50"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 + index * 0.1 }}
              >
                <div className="flex items-center gap-3 mb-2">
                  <span className="text-xl">{item.icon}</span>
                  <h3 className="font-bold text-white">{item.title}</h3>
                </div>
                <p className="text-slate-400 text-sm">{item.desc}</p>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Technical Approach */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-slate-900/50 border border-slate-800 rounded-2xl p-8 mb-8"
        >
          <div className="flex items-center gap-4 mb-4">
            <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-600 rounded-xl flex items-center justify-center">
              <span className="text-2xl">⚙️</span>
            </div>
            <h2 className="text-2xl font-bold text-white">Technical Approach</h2>
          </div>
          <div className="space-y-4 text-slate-400">
            <p>
              <strong className="text-cyan-400">Graph Construction:</strong> We model transaction data as a 
              directed graph where accounts are nodes and transactions are edges with amount and timestamp attributes.
            </p>
            <p>
              <strong className="text-cyan-400">DFS Cycle Detection:</strong> Using depth-first search with 
              pruning optimizations, we efficiently find cycles of 3-5 nodes that indicate coordinated fraud.
            </p>
            <p>
              <strong className="text-cyan-400">Time-Window Analysis:</strong> Transactions are grouped into 
              72-hour windows to detect fan-in/fan-out patterns and velocity anomalies.
            </p>
            <p>
              <strong className="text-cyan-400">Legitimacy Scoring:</strong> We apply negative adjustments to 
              high-volume accounts without structural fraud patterns to reduce false positives on merchants/payroll.
            </p>
          </div>
        </motion.div>

        {/* Hackathon Info */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-gradient-to-r from-cyan-500/10 to-purple-500/10 border border-cyan-500/30 rounded-2xl p-8 text-center"
        >
          <span className="text-4xl mb-4 block">🏆</span>
          <h2 className="text-2xl font-bold text-white mb-2">RIFT 2026 Hackathon</h2>
          <p className="text-slate-400 max-w-lg mx-auto">
            This project was built in 24 hours for the RIFT 2026 Hackathon. Our goal was to create a 
            practical tool that addresses real-world financial crime detection challenges.
          </p>
        </motion.div>
      </div>
    </div>
  );
}
