import { motion, useAnimation } from 'framer-motion'
import { useEffect } from 'react'

export const DebateProgress = ({ progress, activeSpeaker }) => {
  const controls = useAnimation()

  useEffect(() => {
    controls.start({
      width: `${progress}%`,
      transition: { duration: 0.5 }
    })
  }, [progress])

  return (
    <div className="relative h-2 bg-gray-700 rounded-full mb-6">
      <motion.div
        className={`h-full rounded-full ${
          activeSpeaker === 'positive' 
            ? 'bg-cyan-400' 
            : 'bg-pink-500'
        }`}
        initial={{ width: '0%' }}
        animate={controls}
      />
      <div className="absolute inset-0 flex items-center justify-between px-1">
        {Array.from({length: 11}, (_, i) => i * 10).map((pos) => (
          <div 
            key={pos}
            className={`w-1 h-1 rounded-full ${
              progress >= pos ? 'bg-white' : 'bg-gray-500'
            }`}
          />
        ))}
      </div>
    </div>
  )
}