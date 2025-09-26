'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/hooks'
import Logo from '@/components/Logo'

export default function Home() {
  const [currentTime, setCurrentTime] = useState<Date>(new Date())
  const [mounted, setMounted] = useState(false)
  const [sidebarOpen, setSidebarOpen] = useState(false)
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

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('tr-TR', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    })
  }

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('tr-TR', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  const handleLogout = async () => {
    await logout()
    setSidebarOpen(false)
    window.location.reload()
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-slate-900 dark:via-slate-800 dark:to-blue-900">
      {/* Sidebar Overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <motion.div
        initial={{ x: -280 }}
        animate={{ x: sidebarOpen ? 0 : -280 }}
        transition={{ duration: 0.3, ease: "easeInOut" }}
        className="fixed left-0 top-0 h-full w-70 bg-white dark:bg-slate-800 shadow-lg z-50 lg:translate-x-0 lg:static lg:w-64"
      >
        <div className="flex flex-col h-full">
          {/* Sidebar Header */}
          <div className="p-6 border-b border-gray-200 dark:border-slate-700">
            <div className="flex items-center gap-3">
              <Logo size="sm" />
              <div>
                <div className="text-sm font-bold text-gray-800 dark:text-white leading-tight">
                  MALKAN KANAAT
                </div>
                <div className="text-sm font-bold text-gray-800 dark:text-white">
                  Yemek
                </div>
              </div>
            </div>
            
            {/* User info in sidebar */}
            {!isLoading && isAuthenticated && user && (
              <div className="mt-4 pt-4 border-t border-gray-200 dark:border-slate-700">
                <div className="flex flex-col gap-1">
                  <p className="text-xs text-gray-600 dark:text-gray-400">
                    Hoş geldiniz
                  </p>
                  <p className="font-medium text-gray-800 dark:text-white text-sm">
                    {user.name}
                  </p>
                  {user.role === 'admin' && (
                    <p className="text-xs text-blue-600 dark:text-blue-400">
                      Yönetici
                    </p>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Sidebar Menu */}
          {isAuthenticated && user && (
            <nav className="flex-1 p-4">
              <div className="space-y-2">
                {/* QR Kod Okut */}
                <motion.button
                  onClick={() => {
                    router.push('/scan')
                    setSidebarOpen(false)
                  }}
                  className="w-full text-left px-4 py-3 text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-lg transition-colors flex items-center gap-3"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  <span>QR Kod Okut</span>
                </motion.button>

                {/* Aylık Çizelge */}
                <motion.button
                  onClick={() => {
                    router.push('/schedule')
                    setSidebarOpen(false)
                  }}
                  className="w-full text-left px-4 py-3 text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-lg transition-colors flex items-center gap-3"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  <span>Aylık Çizelge</span>
                </motion.button>

                {/* Admin Paneli - Only for admins */}
                {user.role === 'admin' && (
                  <motion.button
                    onClick={() => {
                      router.push('/admin')
                      setSidebarOpen(false)
                    }}
                    className="w-full text-left px-4 py-3 text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-lg transition-colors flex items-center gap-3"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 00-2-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                    <span>Admin Paneli</span>
                  </motion.button>
                )}
              </div>
            </nav>
          )}

          {/* Logout Button - At bottom */}
          {!isLoading && isAuthenticated && (
            <div className="p-4 border-t border-gray-200 dark:border-slate-700">
              <motion.button
                onClick={handleLogout}
                className="w-full px-4 py-3 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors flex items-center gap-3"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
                <span>Çıkış Yap</span>
              </motion.button>
            </div>
          )}
        </div>
      </motion.div>

      {/* Main Content */}
      <div className="lg:ml-64">
        {/* Mobile Menu Button */}
        {isAuthenticated && (
          <div className="lg:hidden fixed top-4 left-4 z-30">
            <motion.button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="p-2 bg-white dark:bg-slate-800 rounded-lg shadow-lg"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <svg className="w-6 h-6 text-gray-600 dark:text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </motion.button>
          </div>
        )}

        {/* Header */}
        <motion.header 
          initial={{ y: -50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.6 }}
          className="container mx-auto px-4 py-8"
        >
          {/* Centered Logo and Title */}
          <div className="flex flex-col items-center gap-3">
            <Logo size="lg" />
            <div className="text-center">
              <h1 className="text-3xl font-bold text-slate-800 dark:text-white leading-tight">
                MALKAN KANAAT
              </h1>
              <h2 className="text-2xl font-bold text-slate-800 dark:text-white">
                Yemek
              </h2>
            </div>
          </div>
        </motion.header>

        {/* Main Content */}
        <div className="container mx-auto px-4 py-8">
          <div className="text-center mb-12">
            {/* Time Display */}
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="mb-8"
            >
              <div className="text-6xl font-bold text-slate-800 dark:text-white mb-2 font-mono">
                {mounted ? formatTime(currentTime) : '00:00:00'}
              </div>
              <div className="text-xl text-slate-600 dark:text-slate-300">
                {mounted ? formatDate(currentTime) : 'Yükleniyor...'}
              </div>
            </motion.div>

            {/* Welcome Text */}
            <motion.div
              initial={{ y: 30, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.6, delay: 0.4 }}
              className="mb-12"
            >
              <p className="text-xl text-slate-600 dark:text-slate-300 max-w-2xl mx-auto">
                QR kod ile kolay ve güvenli yemek dağıtımı
              </p>
            </motion.div>

            {/* Action Buttons */}
            <motion.div
              initial={{ y: 40, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.6, delay: 0.6 }}
              className="flex flex-col sm:flex-row gap-6 justify-center items-center"
            >
              {/* Authenticated User Buttons */}
              {isAuthenticated && user ? (
                <>
                  {/* QR Scan Button - Only for authenticated users */}
                  <motion.button
                    whileHover={{ scale: 1.05, y: -5 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => router.push('/scan')}
                    className="group relative bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-bold py-4 px-8 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 min-w-[200px]"
                  >
                    <div className="flex items-center justify-center gap-3">
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                      </svg>
                      <span>QR Kod Okut</span>
                    </div>
                    <div className="absolute inset-0 rounded-2xl bg-white opacity-0 group-hover:opacity-10 transition-opacity duration-300"></div>
                  </motion.button>

                  {/* Admin Panel Button - Only for admin users */}
                  {user.role === 'admin' && (
                    <motion.button
                      whileHover={{ scale: 1.05, y: -5 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => router.push('/admin')}
                      className="group relative bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-bold py-4 px-8 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 min-w-[200px]"
                    >
                      <div className="flex items-center justify-center gap-3">
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 00-2-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                        </svg>
                        <span>Admin Paneli</span>
                      </div>
                      <div className="absolute inset-0 rounded-2xl bg-white opacity-0 group-hover:opacity-10 transition-opacity duration-300"></div>
                    </motion.button>
                  )}
                </>
              ) : (
                /* Login Button - Only for non-authenticated users */
                !isLoading && (
                  <motion.button
                    whileHover={{ scale: 1.05, y: -5 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => router.push('/login')}
                    className="group relative bg-gradient-to-r from-slate-600 to-slate-700 hover:from-slate-700 hover:to-slate-800 text-white font-bold py-4 px-8 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 min-w-[200px]"
                  >
                    <div className="flex items-center justify-center gap-3">
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
                      </svg>
                      <span>Personel Girişi</span>
                    </div>
                    <div className="absolute inset-0 rounded-2xl bg-white opacity-0 group-hover:opacity-10 transition-opacity duration-300"></div>
                  </motion.button>
                )
              )}
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  )
}