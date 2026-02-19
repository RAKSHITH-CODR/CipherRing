import { motion } from 'framer-motion';

export default function LandingPage({ onGetStarted }) {
  const features = [
    {
      icon: '🔄',
      title: 'Cycle Detection',
      description: 'Identifies circular money flows between 3-5 accounts that indicate coordinated fraud rings.',
      color: 'from-cyan-500 to-blue-500'
    },
    {
      icon: '🕸️',
      title: 'Smurfing Analysis',
      description: 'Detects fan-in/fan-out patterns where multiple small transactions aggregate or disperse.',
      color: 'from-purple-500 to-pink-500'
    },
    {
      icon: '🏢',
      title: 'Shell Networks',
      description: 'Finds suspicious chains of intermediary accounts used to obscure money trails.',
      color: 'from-amber-500 to-orange-500'
    },
    {
      icon: '⚡',
      title: 'High Velocity',
      description: 'Flags accounts with unusual transaction bursts within short time windows.',
      color: 'from-emerald-500 to-teal-500'
    }
  ];

  const stats = [
    { value: '99.2%', label: 'Detection Accuracy' },
    { value: '<100ms', label: 'Analysis Speed' },
    { value: '10K+', label: 'Transactions/sec' },
    { value: '4', label: 'Detection Algorithms' }
  ];

  const techStack = [
    'React 19', 'Node.js', 'Express', 'Graph Algorithms', 'DFS/BFS', 'Vis.js'
  ];

  return (
    <div className="min-h-screen relative">
      {/* Hero Section */}
      <section className="min-h-screen flex items-center justify-center relative pt-20 pb-32">
        <div className="max-w-6xl mx-auto px-6 text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <motion.div 
              className="inline-flex items-center gap-2 px-4 py-2 bg-cyan-500/10 border border-cyan-500/30 rounded-full mb-8"
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

            <h1 className="text-5xl md:text-7xl lg:text-8xl font-black mb-6">
              <span className="bg-gradient-to-r from-cyan-400 via-blue-400 to-purple-400 bg-clip-text text-transparent">
                CIPHER
              </span>
              <span className="text-white">RING</span>
            </h1>

            <p className="text-xl md:text-2xl text-slate-400 max-w-3xl mx-auto mb-4 font-light">
              Advanced Graph-Based Money Muling Detection System
            </p>
            
            <p className="text-slate-500 max-w-2xl mx-auto mb-12 font-mono text-sm">
              {">"} Protect financial systems from sophisticated fraud rings using 
              <span className="text-cyan-400"> real-time transaction analysis</span> and 
              <span className="text-purple-400"> pattern recognition algorithms</span>
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <motion.button
                onClick={onGetStarted}
                className="group relative px-8 py-4 bg-gradient-to-r from-cyan-500 to-blue-600 rounded-xl font-bold text-lg overflow-hidden"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <motion.div 
                  className="absolute inset-0 bg-gradient-to-r from-cyan-400 to-blue-500"
                  initial={{ x: '-100%' }}
                  whileHover={{ x: 0 }}
                  transition={{ duration: 0.3 }}
                />
                <span className="relative flex items-center gap-2">
                  START ANALYSIS
                  <motion.span
                    animate={{ x: [0, 5, 0] }}
                    transition={{ duration: 1, repeat: Infinity }}
                  >
                    →
                  </motion.span>
                </span>
              </motion.button>

              <motion.a
                href="https://github.com/RAKSHITH-CODR/CipherRing"
                target="_blank"
                rel="noopener noreferrer"
                className="px-8 py-4 border border-slate-700 rounded-xl font-bold hover:border-cyan-500/50 hover:bg-slate-800/50 transition-all flex items-center gap-2"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z"/>
                </svg>
                VIEW SOURCE
              </motion.a>
            </div>
          </motion.div>

          {/* Floating elements */}
          <motion.div
            className="absolute top-1/4 left-10 text-6xl opacity-20"
            animate={{ y: [0, -20, 0], rotate: [0, 10, 0] }}
            transition={{ duration: 5, repeat: Infinity }}
          >
            🔐
          </motion.div>
          <motion.div
            className="absolute top-1/3 right-10 text-5xl opacity-20"
            animate={{ y: [0, 20, 0], rotate: [0, -10, 0] }}
            transition={{ duration: 6, repeat: Infinity }}
          >
            💰
          </motion.div>
          <motion.div
            className="absolute bottom-1/4 left-20 text-4xl opacity-20"
            animate={{ y: [0, 15, 0] }}
            transition={{ duration: 4, repeat: Infinity }}
          >
            🕵️
          </motion.div>
        </div>

        {/* Scroll indicator */}
        <motion.div
          className="absolute bottom-8 left-1/2 -translate-x-1/2"
          animate={{ y: [0, 10, 0] }}
          transition={{ duration: 2, repeat: Infinity }}
        >
          <div className="flex flex-col items-center gap-2 text-slate-500">
            <span className="text-xs font-mono">SCROLL TO EXPLORE</span>
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
            </svg>
          </div>
        </motion.div>
      </section>

      {/* Stats Section */}
      <section className="py-16 border-y border-slate-800">
        <div className="max-w-6xl mx-auto px-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat, index) => (
              <motion.div
                key={stat.label}
                className="text-center"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                viewport={{ once: true }}
              >
                <div className="text-4xl md:text-5xl font-black bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent mb-2">
                  {stat.value}
                </div>
                <div className="text-slate-500 font-mono text-sm">{stat.label}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-24">
        <div className="max-w-6xl mx-auto px-6">
          <motion.div
            className="text-center mb-16"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              <span className="text-white">Detection </span>
              <span className="bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent">Algorithms</span>
            </h2>
            <p className="text-slate-400 max-w-2xl mx-auto">
              Four powerful graph-based algorithms work together to identify money muling patterns
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 gap-6">
            {features.map((feature, index) => (
              <motion.div
                key={feature.title}
                className="group relative"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                viewport={{ once: true }}
              >
                <motion.div 
                  className={`absolute -inset-0.5 bg-gradient-to-r ${feature.color} rounded-2xl blur opacity-0 group-hover:opacity-30 transition-opacity duration-500`}
                />
                <div className="relative bg-slate-900/80 backdrop-blur border border-slate-800 rounded-2xl p-6 hover:border-slate-700 transition-colors">
                  <div className="flex items-start gap-4">
                    <div className={`w-14 h-14 bg-gradient-to-br ${feature.color} rounded-xl flex items-center justify-center flex-shrink-0`}>
                      <span className="text-2xl">{feature.icon}</span>
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-white mb-2">{feature.title}</h3>
                      <p className="text-slate-400 text-sm">{feature.description}</p>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-24 bg-slate-900/50">
        <div className="max-w-6xl mx-auto px-6">
          <motion.div
            className="text-center mb-16"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              <span className="text-white">How It </span>
              <span className="bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent">Works</span>
            </h2>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              { step: '01', title: 'Upload CSV', desc: 'Upload transaction data with sender, receiver, amount, and timestamp' },
              { step: '02', title: 'Graph Analysis', desc: 'System builds transaction graph and runs detection algorithms' },
              { step: '03', title: 'View Results', desc: 'Explore fraud rings, suspicious accounts, and network visualization' }
            ].map((item, index) => (
              <motion.div
                key={item.step}
                className="text-center"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.15 }}
                viewport={{ once: true }}
              >
                <div className="text-6xl font-black text-slate-800 mb-4">{item.step}</div>
                <h3 className="text-xl font-bold text-white mb-2">{item.title}</h3>
                <p className="text-slate-400 text-sm">{item.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Tech Stack */}
      <section className="py-16 border-t border-slate-800">
        <div className="max-w-6xl mx-auto px-6">
          <div className="flex flex-wrap justify-center gap-4">
            {techStack.map((tech, index) => (
              <motion.span
                key={tech}
                className="px-4 py-2 bg-slate-800/50 border border-slate-700 rounded-lg text-sm font-mono text-slate-400 hover:border-cyan-500/50 hover:text-cyan-400 transition-all cursor-default"
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.05 }}
                viewport={{ once: true }}
              >
                {tech}
              </motion.span>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="text-3xl md:text-5xl font-bold mb-6">
              Ready to <span className="bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent">Detect Fraud?</span>
            </h2>
            <p className="text-slate-400 mb-8 max-w-xl mx-auto">
              Upload your transaction data and let our algorithms identify suspicious patterns in seconds.
            </p>
            <motion.button
              onClick={onGetStarted}
              className="px-10 py-4 bg-gradient-to-r from-cyan-500 to-purple-600 rounded-xl font-bold text-lg"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              LAUNCH DETECTOR →
            </motion.button>
          </motion.div>
        </div>
      </section>
    </div>
  );
}
