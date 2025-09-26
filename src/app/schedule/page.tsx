'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useAuth } from '@/lib/hooks'
import Logo from '@/components/Logo'

interface MealRecord {
  id: string
  date: string
  type: 'kahvalti' | 'ogle'
  timestamp: string
}

interface MonthlyStats {
  totalMeals: number
  kahvaltiCount: number
  ogleCount: number
  workingDays: number
  attendanceRate: number
}

export default function SchedulePage() {
  const router = useRouter()
  const { user, isAuthenticated, isLoading } = useAuth()
  const [currentDate, setCurrentDate] = useState(new Date())
  const [selectedMonth, setSelectedMonth] = useState(new Date())
  const [mealRecords, setMealRecords] = useState<MealRecord[]>([])
  const [monthlyStats, setMonthlyStats] = useState<MonthlyStats | null>(null)
  const [loading, setLoading] = useState(true)

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/login')
    }
  }, [isLoading, isAuthenticated, router])

  // Fetch monthly data
  useEffect(() => {
    if (isAuthenticated && user) {
      fetchMonthlyData()
    }
  }, [selectedMonth, isAuthenticated, user])

  const fetchMonthlyData = async () => {
    setLoading(true)
    try {
      const response = await fetch(`/api/schedule?month=${selectedMonth.getFullYear()}-${selectedMonth.getMonth() + 1}`)
      const data = await response.json()
      
      if (data.success) {
        setMealRecords(data.records || [])
        setMonthlyStats(data.stats || null)
      }
    } catch (error) {
      console.error('Veri alınamadı:', error)
    } finally {
      setLoading(false)
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('tr-TR', {
      day: 'numeric',
      month: 'long',
      weekday: 'short'
    })
  }

  const formatTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString('tr-TR', {
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const getMonthName = (date: Date) => {
    return date.toLocaleDateString('tr-TR', {
      year: 'numeric',
      month: 'long'
    })
  }

  const changeMonth = (direction: 'prev' | 'next') => {
    const newMonth = new Date(selectedMonth)
    if (direction === 'prev') {
      newMonth.setMonth(newMonth.getMonth() - 1)
    } else {
      newMonth.setMonth(newMonth.getMonth() + 1)
    }
    setSelectedMonth(newMonth)
  }

  // Show loading while checking authentication
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center"
        >
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <p className="text-lg text-gray-600">Yükleniyor...</p>
        </motion.div>
      </div>
    )
  }

  // Don't render if not authenticated (will redirect)
  if (!isAuthenticated) {
    return null
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100 pb-20">
      <div className="container mx-auto px-4 py-8">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-4xl mx-auto"
        >
          {/* Header */}
          <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
            <div className="flex items-center justify-between mb-4">
              <button
                onClick={() => router.push('/')}
                className="text-gray-600 hover:text-gray-800 flex items-center gap-2"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                Ana Sayfa
              </button>
              
              <div className="flex items-center gap-3">
                <Logo size="sm" />
                <div>
                  <div className="text-lg font-bold text-gray-800 leading-tight">
                    MALKAN KANAAT
                  </div>
                  <div className="text-lg font-bold text-gray-800">
                    Yemek
                  </div>
                  <p className="text-sm text-gray-600">Aylık Çizelge</p>
                </div>
              </div>
            </div>

            {user && (
              <div className="flex items-center justify-between pt-4 border-t border-gray-200">
                <div>
                  <p className="text-sm text-gray-600">Personel</p>
                  <p className="font-semibold text-gray-800">{user.name}</p>
                  <p className="text-xs text-gray-500">{user.department}</p>
                </div>
                
                {/* Month Navigation */}
                <div className="flex items-center gap-4">
                  <button
                    onClick={() => changeMonth('prev')}
                    className="p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                  </button>
                  
                  <h2 className="text-xl font-bold text-gray-800 min-w-[150px] text-center">
                    {getMonthName(selectedMonth)}
                  </h2>
                  
                  <button
                    onClick={() => changeMonth('next')}
                    className="p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Monthly Statistics */}
          {monthlyStats && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6"
            >
              <div className="bg-white rounded-lg shadow p-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">{monthlyStats.totalMeals}</div>
                  <div className="text-sm text-gray-600">Toplam Yemek</div>
                </div>
              </div>
              
              <div className="bg-white rounded-lg shadow p-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-yellow-600">{monthlyStats.kahvaltiCount}</div>
                  <div className="text-sm text-gray-600">Kahvaltı</div>
                </div>
              </div>
              
              <div className="bg-white rounded-lg shadow p-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-orange-600">{monthlyStats.ogleCount}</div>
                  <div className="text-sm text-gray-600">Öğle Yemeği</div>
                </div>
              </div>
              
              <div className="bg-white rounded-lg shadow p-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">{monthlyStats.attendanceRate}%</div>
                  <div className="text-sm text-gray-600">Katılım Oranı</div>
                </div>
              </div>
            </motion.div>
          )}

          {/* Meal Records */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white rounded-lg shadow-lg overflow-hidden"
          >
            <div className="p-6 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-800">Yemek Kayıtları</h3>
            </div>

            {loading ? (
              <div className="p-8 text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-600 mx-auto mb-4"></div>
                <p className="text-gray-600">Veriler yükleniyor...</p>
              </div>
            ) : mealRecords.length === 0 ? (
              <div className="p-8 text-center">
                <div className="text-gray-400 mb-4">
                  <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                </div>
                <p className="text-gray-600">Bu ay için yemek kaydı bulunamadı.</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-200">
                {mealRecords.map((record, index) => (
                  <motion.div
                    key={record.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="p-4 hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className={`w-3 h-3 rounded-full ${
                          record.type === 'kahvalti' ? 'bg-yellow-500' : 'bg-orange-500'
                        }`}></div>
                        <div>
                          <div className="font-medium text-gray-800">
                            {record.type === 'kahvalti' ? 'Kahvaltı' : 'Öğle Yemeği'}
                          </div>
                          <div className="text-sm text-gray-600">
                            {formatDate(record.date)}
                          </div>
                        </div>
                      </div>
                      
                      <div className="text-right">
                        <div className="text-sm text-gray-800 font-medium">
                          {formatTime(record.timestamp)}
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </motion.div>
        </motion.div>
      </div>

      {/* Bottom Navigation */}
      <footer className="fixed bottom-0 left-0 right-0 bg-white shadow-lg border-t border-gray-200 z-10">
        <div className="flex justify-around py-2">
          <Link 
            href="/"
            className="flex flex-col items-center justify-end gap-1 text-gray-600 py-2 hover:text-green-600 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
            </svg>
            <p className="text-xs font-medium">Ana Sayfa</p>
          </Link>
          
          <button className="flex flex-col items-center justify-end gap-1 text-green-600 py-2">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p className="text-xs font-medium">Geçmiş</p>
          </button>
          
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
            <Link 
              href="/login"
              className="flex flex-col items-center justify-end gap-1 text-gray-600 py-2 hover:text-red-600 transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
              <p className="text-xs font-medium">Çıkış</p>
            </Link>
          )}
        </div>
      </footer>
    </div>
  )
}