'use client'

import { motion } from 'framer-motion'

interface LogoProps {
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

export default function Logo({ size = 'md', className = '' }: LogoProps) {
  const sizeClasses = {
    sm: 'w-8 h-8',
    md: 'w-12 h-12', 
    lg: 'w-16 h-16'
  }

  const iconSizes = {
    sm: 'text-lg',
    md: 'text-2xl',
    lg: 'text-4xl'
  }

  return (
    <motion.div
      className={`${sizeClasses[size]} ${className} relative flex items-center justify-center`}
      initial={{ scale: 0.8, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{
        type: "spring",
        stiffness: 300,
        damping: 20
      }}
    >
      {/* Animated Food Container */}
      <motion.div
        className="relative bg-gradient-to-br from-orange-400 via-red-500 to-pink-500 rounded-full p-2 shadow-xl"
        animate={{
          rotate: [0, 5, -5, 0],
          scale: [1, 1.05, 1]
        }}
        transition={{
          duration: 3,
          repeat: Infinity,
          ease: "easeInOut"
        }}
      >
        {/* Food Icons with Staggered Animation */}
        <motion.div
          className={`${iconSizes[size]} text-white relative`}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
        >
          {/* Main Food Icon */}
          <motion.div
            animate={{
              y: [0, -2, 0],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: "easeInOut",
              delay: 0
            }}
          >
            🍽️
          </motion.div>
          
          {/* Floating Food Items */}
          <motion.div
            className="absolute -top-1 -right-1 text-xs"
            animate={{
              y: [0, -3, 0],
              opacity: [0.7, 1, 0.7]
            }}
            transition={{
              duration: 2.5,
              repeat: Infinity,
              ease: "easeInOut",
              delay: 0.8
            }}
          >
            🌅
          </motion.div>
          
          <motion.div
            className="absolute -bottom-1 -left-1 text-xs"
            animate={{
              y: [0, -2, 0],
              opacity: [0.7, 1, 0.7]
            }}
            transition={{
              duration: 2.2,
              repeat: Infinity,
              ease: "easeInOut",
              delay: 1.2
            }}
          >
            🌞
          </motion.div>
        </motion.div>

        {/* Pulse Effect */}
        <motion.div
          className="absolute inset-0 bg-white rounded-full"
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0, 0.2, 0]
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        />
      </motion.div>
    </motion.div>
  )
}