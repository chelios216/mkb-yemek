'use client'

import { motion } from 'framer-motion'
import Image from 'next/image'

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
      {/* Logo Image - public/logo.png dosyasını yükledikten sonra bu kısmı aktif edin */}
      {/* <div className={`${sizeClasses[size]} relative`}>
        <Image
          src="/logo.png"
          alt="Malkan Kanaat Yemek Logo"
          fill
          className="object-contain"
          priority
        />
      </div> */}

      {/* Geçici basit logo - logo.png yükledikten sonra bu kısmı silin */}
      <motion.div
        className="relative bg-gradient-to-br from-blue-600 to-purple-600 rounded-lg flex items-center justify-center shadow-lg"
        animate={{
          scale: [1, 1.05, 1]
        }}
        transition={{
          duration: 3,
          repeat: Infinity,
          ease: "easeInOut"
        }}
      >
        <span className="text-white font-bold text-xl">MK</span>
      </motion.div>
    </motion.div>
  )
}