import { motion } from 'framer-motion'

export const SpeakerHighlight = ({ speaker, children }) => {
  const colorMap = {
    positive: 'bg-cyan-400/20 border-cyan-400',
    negative: 'bg-pink-400/20 border-pink-400',
    judge: 'bg-yellow-400/20 border-yellow-400',
    host: 'bg-purple-400/20 border-purple-400'
  }

  return (
    <motion.div
      className={`p-4 rounded-lg border-2 ${colorMap[speaker]}`}
      initial={{ opacity: 0.8 }}
      animate={{ 
        opacity: [0.8, 1, 0.8],
        boxShadow: ['0 0 0px rgba(0, 255, 255, 0)', '0 0 15px rgba(0, 255, 255, 0.3)', '0 0 0px rgba(0, 255, 255, 0)']
      }}
      transition={{ 
        duration: 1.5,
        repeat: Infinity,
        ease: "easeInOut"
      }}
    >
      {children}
    </motion.div>
  )
}