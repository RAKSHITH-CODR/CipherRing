import { motion } from 'framer-motion';

export default function DevelopersPage() {
  // Update with your actual team information
  const developers = [
    {
      name: 'Rakshith',
      role: 'Full Stack Developer',
      avatar: '👨‍💻',
      bio: 'Passionate about building innovative solutions for real-world problems.',
      github: 'https://github.com/RAKSHITH-CODR',
      linkedin: '#',
      skills: ['React', 'Node.js', 'Graph Algorithms', 'Python']
    },
    {
      name: 'Kanchika',
      role: 'Full Stack Developer',
      avatar: '👨‍💻',
      bio: 'Passionate about building innovative solutions for real-world problems.',
      github: '/',
      linkedin: '#',
      skills: ['React', 'Node.js', 'Graph Algorithms', 'Python']
    },
    {
      name: 'Harshitha',
      role: 'Full Stack Developer',
      avatar: '👨‍💻',
      bio: 'Passionate about building innovative solutions for real-world problems.',
      github: '/',
      linkedin: '#',
      skills: ['React', 'Node.js', 'Graph Algorithms', 'Python']
    },
    // Add more team members here
    // {
    //   name: 'Team Member 2',
    //   role: 'Backend Developer',
    //   avatar: '👩‍💻',
    //   bio: 'Description here',
    //   github: '#',
    //   linkedin: '#',
    //   skills: ['Java', 'Spring Boot', 'PostgreSQL']
    // }
  ];

  const contributions = [
    { area: 'Frontend Development', icon: '🎨', desc: 'React UI with Framer Motion animations' },
    { area: 'Backend API', icon: '⚙️', desc: 'Express.js REST API for file processing' },
    { area: 'Detection Algorithms', icon: '🧠', desc: 'Graph-based fraud detection logic' },
    { area: 'Data Visualization', icon: '📊', desc: 'Interactive network graph with Vis.js' }
  ];

  return (
    <div className="min-h-screen pt-24 pb-12">
      <div className="max-w-5xl mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            <span className="text-white">Meet the </span>
            <span className="bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent">Developers</span>
          </h1>
          <p className="text-slate-400 max-w-2xl mx-auto">
            The team behind CipherRing, building innovative solutions for financial fraud detection.
          </p>
        </motion.div>

        {/* Developer Cards */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-16">
          {developers.map((dev, index) => (
            <motion.div
              key={dev.name}
              className="group relative"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <motion.div 
                className="absolute -inset-0.5 bg-gradient-to-r from-cyan-500 to-purple-500 rounded-2xl blur opacity-0 group-hover:opacity-30 transition-opacity duration-500"
              />
              <div className="relative bg-slate-900/80 border border-slate-800 rounded-2xl p-6 hover:border-slate-700 transition-all">
                {/* Avatar */}
                <div className="flex justify-center mb-4">
                  <motion.div 
                    className="w-24 h-24 bg-gradient-to-br from-cyan-500 to-purple-600 rounded-2xl flex items-center justify-center text-4xl"
                    whileHover={{ scale: 1.1, rotate: 5 }}
                  >
                    {dev.avatar}
                  </motion.div>
                </div>

                {/* Info */}
                <div className="text-center mb-4">
                  <h3 className="text-xl font-bold text-white mb-1">{dev.name}</h3>
                  <p className="text-cyan-400 text-sm font-mono">{dev.role}</p>
                </div>

                <p className="text-slate-400 text-sm text-center mb-4">{dev.bio}</p>

                {/* Skills */}
                <div className="flex flex-wrap justify-center gap-2 mb-4">
                  {dev.skills.map(skill => (
                    <span 
                      key={skill}
                      className="px-2 py-1 bg-slate-800/50 border border-slate-700 rounded text-xs font-mono text-slate-400"
                    >
                      {skill}
                    </span>
                  ))}
                </div>

                {/* Social Links */}
                <div className="flex justify-center gap-3">
                  <motion.a
                    href={dev.github}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-2 bg-slate-800 rounded-lg text-slate-400 hover:text-white hover:bg-slate-700 transition-all"
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z"/>
                    </svg>
                  </motion.a>
                  <motion.a
                    href={dev.linkedin}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-2 bg-slate-800 rounded-lg text-slate-400 hover:text-white hover:bg-slate-700 transition-all"
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                    </svg>
                  </motion.a>
                </div>
              </div>
            </motion.div>
          ))}

          {/* Add Team Member Card */}
          <motion.div
            className="bg-slate-900/50 border border-dashed border-slate-700 rounded-2xl p-6 flex flex-col items-center justify-center min-h-[300px]"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: developers.length * 0.1 }}
          >
            <span className="text-4xl mb-4 opacity-50">➕</span>
            <p className="text-slate-500 text-center text-sm">
              Add more team members in<br />
              <code className="text-cyan-400 text-xs">DevelopersPage.jsx</code>
            </p>
          </motion.div>
        </div>

        {/* Project Contributions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="mb-12"
        >
          <h2 className="text-2xl font-bold text-white text-center mb-8">
            Project <span className="text-cyan-400">Contributions</span>
          </h2>
          <div className="grid md:grid-cols-2 gap-4">
            {contributions.map((item, index) => (
              <motion.div
                key={item.area}
                className="flex items-center gap-4 p-4 bg-slate-900/50 border border-slate-800 rounded-xl"
                initial={{ opacity: 0, x: index % 2 === 0 ? -20 : 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.4 + index * 0.1 }}
              >
                <div className="w-12 h-12 bg-gradient-to-br from-cyan-500/20 to-purple-500/20 rounded-xl flex items-center justify-center text-2xl">
                  {item.icon}
                </div>
                <div>
                  <h3 className="font-bold text-white">{item.area}</h3>
                  <p className="text-slate-400 text-sm">{item.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Contact Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="bg-gradient-to-r from-cyan-500/10 to-purple-500/10 border border-cyan-500/30 rounded-2xl p-8 text-center"
        >
          <h2 className="text-2xl font-bold text-white mb-4">Get in Touch</h2>
          <p className="text-slate-400 mb-6 max-w-lg mx-auto">
            Have questions about CipherRing or want to collaborate? Feel free to reach out!
          </p>
          <div className="flex justify-center gap-4">
            <motion.a
              href="https://github.com/RAKSHITH-CODR/CipherRing"
              target="_blank"
              rel="noopener noreferrer"
              className="px-6 py-3 bg-slate-800 border border-slate-700 rounded-xl font-mono text-sm hover:border-cyan-500/50 transition-all flex items-center gap-2"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z"/>
              </svg>
              GITHUB REPO
            </motion.a>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
