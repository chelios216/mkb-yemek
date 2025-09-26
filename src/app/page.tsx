'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/hooks'
import { getDeviceInfo, generateDeviceFingerprint, MealRecord } from '@/lib/types'
import Logo from '@/components/Logo'
import Link from 'next/link'

export default function Home() {
  const [currentTime, setCurrentTime] = useState<Date>(new Date())
  const [mounted, setMounted] = useState(false)
  const [mealHistory, setMealHistory] = useState<MealRecord[]>([])
  const [currentMeal, setCurrentMeal] = useState<any>(null)
  const [loadingHistory, setLoadingHistory] = useState(false)
  const router = useRouter()
  const { user, isAuthenticated, isLoading, logout } = useAuth()

  // Fix hydration mismatch by ensuring client-only rendering for time
  useEffect(() => {
    setMounted(true)
    const timer = setInterval(() => {
      setCurrentTime(new Date())
    }, 1000)

    return () => clearInterval(timer)
  }, [])

  // Load meal history and current meal when user is authenticated
  useEffect(() => {
    const loadMealData = async () => {
      setLoadingHistory(true)
      try {
        const deviceInfo = await getDeviceInfo()
        const fingerprint = generateDeviceFingerprint(deviceInfo)

        // Get meal history
        const historyResponse = await fetch(`/api/meal-history?fingerprint=${fingerprint}&limit=5`)
        const historyData = await historyResponse.json()

        if (historyData.success) {
          setMealHistory(historyData.data.meals)
        }

        // Get current meal info
        const mealResponse = await fetch(`/api/meals?fingerprint=${fingerprint}`)
        const mealData = await mealResponse.json()

        if (mealData.success) {
          setCurrentMeal(mealData)
        }

      } catch (error) {
        console.error('Meal data loading error:', error)
      } finally {
        setLoadingHistory(false)
      }
    }

    if (isAuthenticated && user && mounted) {
      loadMealData()
    }
  }, [isAuthenticated, user, mounted])

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('tr-TR', {
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('tr-TR', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    })
  }

  const getCurrentMealInfo = () => {
    const hour = currentTime.getHours()
    if (hour >= 7 && hour < 11) {
      return {
        name: 'Kahvaltı',
        time: '08:00 - 09:00',
        icon: '🍳',
        type: 'kahvalti'
      }
    } else if (hour >= 11 && hour < 15) {
      return {
        name: 'Öğle Yemeği', 
        time: '12:00 - 13:00',
        icon: '🍽️',
        type: 'ogle'
      }
    }
    return {
      name: 'Yemek Saatleri Dışında',
      time: 'Kahvaltı: 08:00-09:00 | Öğle: 12:00-13:00',
      icon: '⏰',
      type: null
    }
  }

  const currentMealInfo = getCurrentMealInfo()

  // Show loading while checking authentication
  if (isLoading || !mounted) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center"
        >
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
          <p className="text-lg text-gray-600">Yükleniyor...</p>
        </motion.div>
      </div>
    )
  }

  // Redirect to login if not authenticated
  if (!isAuthenticated) {
    router.push('/login')
    return null
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <motion.header 
        initial={{ y: -50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="flex items-center justify-between p-4 pb-2 bg-white shadow-sm"
      >
        <button 
          onClick={() => {/* Menu functionality can be added later */}}
          className="text-gray-800"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
        <h1 className="flex-1 text-center text-lg font-bold text-gray-800 pr-6">
          Kahvaltı/Yemek Takibi
        </h1>
      </motion.header>

      <main className="p-4 space-y-6 pb-20">
        {/* Current Meal Section */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.1 }}
        >
          <h2 className="text-xl font-bold text-gray-800 mb-3">Mevcut Öğün</h2>
          <div className="relative w-full h-48 rounded-xl overflow-hidden bg-gradient-to-br from-green-600 to-green-700 shadow-lg">
            <div className="absolute inset-0 bg-black/20"></div>
            <div className="absolute bottom-0 left-0 p-4">
              <div className="flex items-center gap-3 mb-2">
                <span className="text-3xl">{currentMealInfo.icon}</span>
                <h3 className="text-white text-2xl font-bold">{currentMealInfo.name}</h3>
              </div>
              <p className="text-white/90 font-medium">{currentMealInfo.time}</p>
              {mounted && (
                <p className="text-white/80 text-sm mt-1">
                  Şu an: {formatTime(currentTime)}
                </p>
              )}
            </div>
          </div>
        </motion.div>

        {/* QR Code Button */}
        <motion.button
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2 }}
          onClick={() => router.push('/scan')}
          className="w-full h-12 flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 text-white font-bold rounded-lg text-base transition-colors shadow-lg"
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          <span>QR Okut</span>
        </motion.button>

        {/* Meal History */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.3 }}
        >
          <h2 className="text-xl font-bold text-gray-800 mb-3">Yemek Geçmişim</h2>
          
          {loadingHistory ? (
            <div className="space-y-2">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="animate-pulse bg-white p-3 rounded-lg">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-gray-200 rounded-lg"></div>
                    <div className="flex-1 space-y-2">
                      <div className="h-4 bg-gray-200 rounded w-1/3"></div>
                      <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : mealHistory.length > 0 ? (
            <div className="space-y-2">
              {mealHistory.map((meal, index) => (
                <motion.div
                  key={meal.id}
                  initial={{ x: -20, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  transition={{ delay: 0.1 * index }}
                  className="flex items-center gap-4 bg-white p-3 rounded-lg shadow-sm"
                >
                  <div className="flex items-center justify-center rounded-lg bg-green-50 shrink-0 w-12 h-12 text-green-600">
                    <span className="text-2xl">
                      {meal.mealType === 'kahvalti' ? '🍳' : '🍽️'}
                    </span>
                  </div>
                  <div className="flex-1">
                    <p className="text-gray-800 font-medium">
                      {meal.mealType === 'kahvalti' ? 'Kahvaltı' : 'Öğle Yemeği'}
                    </p>
                    <p className="text-gray-600 text-sm">
                      {meal.mealType === 'kahvalti' ? '08:00 - 09:00' : '12:00 - 13:00'}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-gray-800 text-sm font-medium">
                      {new Date(meal.timestamp).toLocaleDateString('tr-TR')}
                    </p>
                    <p className="text-gray-600 text-xs">
                      {new Date(meal.timestamp).toLocaleDateString('tr-TR', { weekday: 'long' })}
                    </p>
                  </div>
                </motion.div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <div className="text-6xl mb-4">🍽️</div>
              <p className="text-gray-500">Henüz yemek kaydınız bulunmuyor</p>
            </div>
          )}
        </motion.div>
      </main>

      {/* Bottom Navigation */}
      <footer className="fixed bottom-0 left-0 right-0 bg-white shadow-lg border-t border-gray-200 z-10">
        <div className="flex justify-around py-2">
          <button className="flex flex-col items-center justify-end gap-1 text-green-600 py-2">
            <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
              <path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z"/>
            </svg>
            <p className="text-xs font-medium">Ana Sayfa</p>
          </button>
          
          <Link 
            href="/schedule"
            className="flex flex-col items-center justify-end gap-1 text-gray-600 py-2 hover:text-green-600 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p className="text-xs font-medium">Geçmiş</p>
          </Link>
          
          {user?.role === 'admin' ? (
            <Link 
              href="/admin"
              className="flex flex-col items-center justify-end gap-1 text-gray-600 py-2 hover:text-green-600 transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 00-2-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
              <p className="text-xs font-medium">Admin</p>
            </Link>
          ) : (
            <button 
              onClick={logout}
              className="flex flex-col items-center justify-end gap-1 text-gray-600 py-2 hover:text-red-600 transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
              <p className="text-xs font-medium">Çıkış</p>
            </button>
          )}
        </div>
      </footer>
    </div>
  )
}