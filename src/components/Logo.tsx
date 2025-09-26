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
      {/* Simple Animated Food Container */}
      <motion.div
        className="relative bg-slate-700 dark:bg-slate-300 rounded-full p-2 shadow-lg"
        animate={{
          scale: [1, 1.05, 1]
        }}
        transition={{
          duration: 3,
          repeat: Infinity,
          ease: "easeInOut"
        }}
      >
        {/* Clean Food Icon */}
        <motion.div
          className={`${iconSizes[size]} text-white dark:text-slate-700`}
          animate={{
            y: [0, -2, 0],
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        >
          �️
        </motion.div>
      </motion.div>
    </motion.div>
  )
}