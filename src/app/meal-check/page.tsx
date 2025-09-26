'use client'

import { useEffect, useState, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'

interface User {
  id: string
  name: string
  isApproved: boolean
  deviceId?: string
}

interface WorkSchedule {
  monday: boolean
  tuesday: boolean
  wednesday: boolean
  thursday: boolean
  friday: boolean
  saturday: boolean
  sunday: boolean
  breakfastStart: string
  breakfastEnd: string
  lunchStart: string
  lunchEnd: string
}

interface MonthlyQuota {
  totalWorkDays: number
  breakfastCredits: number
  lunchCredits: number
  breakfastUsed: number
  lunchUsed: number
  breakfastRemaining: number
  lunchRemaining: number
}

type Step = 'loading' | 'select-user' | 'meal-check' | 'meal-time' | 'no-credit' | 'success' | 'already-taken' | 'error'

function MealCheckPage() {
  const [users, setUsers] = useState<User[]>([])
  const [user, setUser] = useState<User | null>(null)
  const [step, setStep] = useState<Step>('loading')
  const [isLoading, setIsLoading] = useState(false)
  const [monthlyQuota, setMonthlyQuota] = useState<MonthlyQuota | null>(null)
  const [currentMealType, setCurrentMealType] = useState<string>('')
  const [mealTaken, setMealTaken] = useState<{type: string, time: string} | null>(null)
  
  const searchParams = useSearchParams()
  const router = useRouter()
  const qrId = searchParams.get('id')

  // Utility Functions
  const getCurrentDateTime = () => {
    const now = new Date()
    const options: Intl.DateTimeFormatOptions = {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }
    return now.toLocaleDateString('tr-TR', options)
  }

  const getMealTypeText = () => {
    return currentMealType === 'kahvalti' ? 'Kahvaltı' : 'Öğle Yemeği'
  }

  const checkDeviceAndUser = async () => {
    try {
      const deviceResponse = await fetch('/api/device-check', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ qrId }),
      })

      if (!deviceResponse.ok) {
        setStep('error')
        return
      }

      const deviceData = await deviceResponse.json()
      
      if (deviceData.needsRegistration) {
        const usersResponse = await fetch('/api/users-list')
        const usersData = await usersResponse.json()
        
        if (usersData.success) {
          const approvedUsers = usersData.users.filter((u: User) => u.isApproved)
          setUsers(approvedUsers)
          setStep('select-user')
        } else {
          setStep('error')
        }
      } else {
        setUser(deviceData.user)
        checkMealEligibility(deviceData.user)
      }
    } catch (error) {
      console.error('Device check error:', error)
      setStep('error')
    }
  }

  const checkMealEligibility = async (userData: User) => {
    try {
      const response = await fetch('/api/meal-counts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: userData.id }),
      })

      const data = await response.json()
      
      if (data.success) {
        setMonthlyQuota(data.monthlyQuota)

        if (data.alreadyTaken) {
          setMealTaken(data.alreadyTaken)
          setStep('already-taken')
          return
        }

        if (!data.isMealTime) {
          setStep('meal-time')
          return
        }

        setCurrentMealType(data.currentMealType)

        const hasCredit = data.currentMealType === 'kahvalti' 
          ? data.monthlyQuota.breakfastRemaining > 0
          : data.monthlyQuota.lunchRemaining > 0

        if (hasCredit) {
          setStep('meal-check')
        } else {
          setStep('no-credit')
        }
      } else {
        setStep('error')
      }
    } catch (error) {
      console.error('Meal check error:', error)
      setStep('error')
    }
  }

  const handleUserSelect = async (selectedUser: User) => {
    setIsLoading(true)
    try {
      const response = await fetch('/api/device-register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: selectedUser.id,
          qrId: qrId,
        }),
      })

      if (response.ok) {
        setUser(selectedUser)
        checkMealEligibility(selectedUser)
      } else {
        setStep('error')
      }
    } catch (error) {
      console.error('User registration error:', error)
      setStep('error')
    } finally {
      setIsLoading(false)
    }
  }

  const handleTakeMeal = async () => {
    if (!user) return

    setIsLoading(true)
    try {
      const response = await fetch('/api/take-meal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.id,
          mealType: currentMealType,
        }),
      })

      const data = await response.json()
      if (data.success) {
        setMealTaken({
          type: getMealTypeText(),
          time: getCurrentDateTime()
        })
        setStep('success')
      } else {
        setStep('error')
      }
    } catch (error) {
      console.error('Take meal error:', error)
      setStep('error')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    if (qrId) {
      checkDeviceAndUser()
    } else {
      setStep('error')
    }
  }, [qrId])

  const renderContent = () => {
    switch (step) {
      case 'loading':
        return (
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white rounded-xl shadow-lg p-8 text-center"
          >
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-lg text-gray-600">Cihaz kontrol ediliyor...</p>
          </motion.div>
        )

      case 'select-user':
        return (
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white rounded-xl shadow-lg p-6"
          >
            <h2 className="text-xl font-bold text-gray-800 mb-4 text-center">
              👤 Kullanıcı Seçin
            </h2>
            <div className="space-y-3">
              {users.map((userData) => (
                <button
                  key={userData.id}
                  onClick={() => handleUserSelect(userData)}
                  disabled={isLoading}
                  className="w-full p-3 text-left bg-gray-50 hover:bg-blue-50 rounded-lg border border-gray-200 hover:border-blue-300 transition-colors disabled:opacity-50"
                >
                  <span className="font-medium">{userData.name}</span>
                </button>
              ))}
            </div>
            {isLoading && (
              <div className="animate-spin w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full mx-auto mt-4"></div>
            )}
          </motion.div>
        )

      case 'meal-check':
        return (
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white rounded-xl shadow-lg p-6 text-center"
          >
            <div className="text-6xl mb-4">
              {currentMealType === 'kahvalti' ? '🌅' : '🌞'}
            </div>
            <h2 className="text-xl font-bold text-gray-800 mb-2">
              {getMealTypeText()} Alabilirsiniz
            </h2>
            <p className="text-gray-600 mb-4">
              Merhaba <strong>{user?.name}</strong>!
            </p>

            {monthlyQuota && (
              <div className="bg-gray-50 rounded-lg p-4 mb-6">
                <h4 className="text-sm font-semibold text-gray-700 mb-3">
                  🗓️ Bu Ay Kalan Krediniz ({monthlyQuota.totalWorkDays} çalışma günü)
                </h4>
                <div className="grid grid-cols-2 gap-4 text-center">
                  <div>
                    <div className="text-lg font-bold text-orange-600">
                      {monthlyQuota.breakfastRemaining}
                    </div>
                    <div className="text-xs text-gray-600">🌅 Kahvaltı</div>
                  </div>
                  <div>
                    <div className="text-lg font-bold text-blue-600">
                      {monthlyQuota.lunchRemaining}
                    </div>
                    <div className="text-xs text-gray-600">🌞 Öğle</div>
                  </div>
                </div>
              </div>
            )}

            <button
              onClick={handleTakeMeal}
              disabled={isLoading}
              className="w-full py-3 px-6 bg-green-600 text-white font-bold rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
            >
              {isLoading ? 'İşleniyor...' : `${getMealTypeText()} Al`}
            </button>
          </motion.div>
        )

      case 'meal-time':
        return (
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white rounded-xl shadow-lg p-6 text-center"
          >
            <div className="text-6xl mb-4">⏰</div>
            <h2 className="text-xl font-bold text-gray-800 mb-2">
              Yemek Saati Dışı
            </h2>
            <p className="text-gray-600 mb-4">
              Şu anda yemek saatleri dışındasınız
            </p>
            
            <div className="bg-gray-50 rounded-lg p-4 mb-4">
              <p className="text-sm text-gray-600">
                <strong>Kahvaltı:</strong> 07:00 - 10:30<br/>
                <strong>Öğle:</strong> 11:30 - 14:30
              </p>
            </div>

            <button
              onClick={() => window.location.reload()}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Yenile
            </button>
          </motion.div>
        )

      case 'no-credit':
        return (
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white rounded-xl shadow-lg p-6 text-center"
          >
            <div className="text-6xl mb-4">🚫</div>
            <h2 className="text-xl font-bold text-gray-800 mb-2">
              Yemek Krediniz Tükendi
            </h2>
            <p className="text-gray-600 mb-4">
              Bu ay için {getMealTypeText().toLowerCase()} krediniz kalmamış.
            </p>

            {monthlyQuota && (
              <div className="bg-gray-50 rounded-lg p-4 mb-4">
                <h4 className="text-sm font-semibold text-gray-700 mb-3">
                  🗓️ Bu Ay Kalan Krediniz ({monthlyQuota.totalWorkDays} çalışma günü)
                </h4>
                <div className="grid grid-cols-2 gap-4 text-center">
                  <div>
                    <div className="text-lg font-bold text-orange-600">
                      {monthlyQuota.breakfastRemaining}
                    </div>
                    <div className="text-xs text-gray-600">🌅 Kahvaltı</div>
                  </div>
                  <div>
                    <div className="text-lg font-bold text-blue-600">
                      {monthlyQuota.lunchRemaining}
                    </div>
                    <div className="text-xs text-gray-600">🌞 Öğle</div>
                  </div>
                </div>
              </div>
            )}

            <button
              onClick={() => router.push('/')}
              className="px-6 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
            >
              Ana Sayfa
            </button>
          </motion.div>
        )

      case 'already-taken':
        return (
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white rounded-xl shadow-lg p-6 text-center"
          >
            <div className="text-6xl mb-4">✅</div>
            <h2 className="text-xl font-bold text-gray-800 mb-2">
              Zaten Yemek Aldınız
            </h2>
            <p className="text-gray-600 mb-4">
              Bugün için {mealTaken?.type} zaten alınmış.
            </p>
            
            <div className="bg-gray-50 rounded-lg p-4 mb-4">
              <p className="text-sm text-gray-600">
                <strong>Alınma Zamanı:</strong><br/>
                {mealTaken?.time}
              </p>
            </div>

            <button
              onClick={() => router.push('/')}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Ana Sayfa
            </button>
          </motion.div>
        )

      case 'success':
        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center">
            {/* Full screen success overlay */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5 }}
              className="absolute inset-0 bg-gradient-to-br from-green-400 via-green-500 to-green-600"
            />
            
            {/* Success content */}
            <motion.div
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ 
                type: "spring", 
                stiffness: 300, 
                damping: 20,
                delay: 0.3
              }}
              className="relative z-10 text-center text-white px-6"
            >
              {/* Animated Check Icon */}
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{
                  type: "spring",
                  stiffness: 400,
                  damping: 10,
                  delay: 0.5
                }}
                className="mb-6"
              >
                <svg
                  width="120"
                  height="120"
                  viewBox="0 0 24 24"
                  fill="none"
                  className="mx-auto drop-shadow-lg"
                >
                  <motion.circle
                    cx="12"
                    cy="12"
                    r="11"
                    stroke="white"
                    strokeWidth="2"
                    fill="none"
                    initial={{ pathLength: 0 }}
                    animate={{ pathLength: 1 }}
                    transition={{ duration: 0.5, delay: 0.7 }}
                  />
                  <motion.path
                    d="M7 13l3 3 7-7"
                    stroke="white"
                    strokeWidth="2"
                    fill="none"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    initial={{ pathLength: 0 }}
                    animate={{ pathLength: 1 }}
                    transition={{ duration: 0.5, delay: 0.9 }}
                  />
                </svg>
              </motion.div>

              {/* User Info Card */}
              <motion.div
                initial={{ y: 30, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 1.1 }}
                className="bg-white/20 backdrop-blur-md rounded-2xl p-6 mb-6 border border-white/30"
              >
                <h1 className="text-3xl font-bold mb-2">
                  ✅ Başarılı!
                </h1>
                <h2 className="text-xl mb-4">
                  {user?.name}
                </h2>
                <div className="text-lg opacity-90">
                  {mealTaken?.type} alındı
                </div>
              </motion.div>

              {/* Date & Time */}
              <motion.div
                initial={{ y: 30, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 1.3 }}
                className="bg-white/10 backdrop-blur-md rounded-xl p-4 border border-white/20"
              >
                <div className="text-lg font-semibold">
                  📅 {getCurrentDateTime()}
                </div>
              </motion.div>

              {/* Auto redirect info */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 2 }}
                className="mt-8 text-white/80 text-sm"
              >
                3 saniye sonra ana sayfaya yönlendirileceksiniz...
              </motion.div>
            </motion.div>
          </div>
        )

      case 'error':
      default:
        return (
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white rounded-xl shadow-lg p-6 text-center"
          >
            <div className="text-6xl mb-4">❌</div>
            <h2 className="text-xl font-bold text-gray-800 mb-2">
              Hata Oluştu
            </h2>
            <p className="text-gray-600 mb-4">
              Bir hata oluştu. Lütfen tekrar deneyin.
            </p>
            <button
              onClick={() => window.location.reload()}
              className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
            >
              Yeniden Dene
            </button>
          </motion.div>
        )
    }
  }

  // Auto redirect after success
  useEffect(() => {
    if (step === 'success') {
      const timer = setTimeout(() => {
        router.push('/')
      }, 3000)
      return () => clearTimeout(timer)
    }
  }, [step, router])

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 pb-20">
      {/* Header - only show if not success */}
      {step !== 'success' && (
        <motion.header
          initial={{ y: -50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="bg-white shadow-sm border-b"
        >
          <div className="container mx-auto px-4 py-4">
            <div className="flex flex-col items-center space-y-3">
              <div className="flex items-center space-x-3">
                <div className="text-2xl">🍽️</div>
                <h1 className="text-xl font-bold text-gray-800">
                  MKB Yemek Sistemi
                </h1>
              </div>
              
              {user && currentMealType && (
                <span className={`px-3 py-1 rounded-full text-sm font-medium text-white ${
                  currentMealType === 'kahvalti' ? 'bg-orange-500' : 'bg-blue-500'
                }`}>
                  {currentMealType && (currentMealType === 'kahvalti' ? '🌅' : '🌞')} {getMealTypeText()}
                </span>
              )}
              
              {monthlyQuota && (
                <motion.div
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  className="mt-4 bg-white/80 backdrop-blur-sm rounded-xl p-4 shadow-lg border"
                >
                  <h3 className="text-center text-sm font-semibold text-slate-700 mb-3">
                    🗓️ Bu Ay Yemek Krediniz ({monthlyQuota.totalWorkDays} çalışma günü)
                  </h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="text-center">
                      <div className={`text-2xl font-bold ${
                        monthlyQuota.breakfastRemaining > 0 ? 'text-orange-600' : 'text-red-500'
                      }`}>
                        {monthlyQuota.breakfastRemaining}
                      </div>
                      <div className="text-xs text-gray-600">🌅 Kahvaltı Kaldı</div>
                      <div className="text-xs text-gray-500">
                        ({monthlyQuota.breakfastUsed} / {monthlyQuota.breakfastCredits})
                      </div>
                    </div>
                    <div className="text-center">
                      <div className={`text-2xl font-bold ${
                        monthlyQuota.lunchRemaining > 0 ? 'text-blue-600' : 'text-red-500'
                      }`}>
                        {monthlyQuota.lunchRemaining}
                      </div>
                      <div className="text-xs text-gray-600">🌞 Öğle Kaldı</div>
                      <div className="text-xs text-gray-500">
                        ({monthlyQuota.lunchUsed} / {monthlyQuota.lunchCredits})
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}
            </div>
          </div>
        </motion.header>
      )}

      {/* Main Content */}
      <div className="container mx-auto px-4 py-6">
        <div className="max-w-md mx-auto">
          <AnimatePresence mode="wait">
            {renderContent()}
          </AnimatePresence>
        </div>
      </div>

      {/* Bottom Navigation */}
      <footer className="fixed bottom-0 left-0 right-0 bg-white shadow-lg border-t border-gray-200 z-10">
        <div className="flex justify-around py-2">
          <button 
            onClick={() => router.push('/')}
            className="flex flex-col items-center justify-end gap-1 text-gray-600 py-2 hover:text-green-600 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
            </svg>
            <p className="text-xs font-medium">Ana Sayfa</p>
          </button>
          
          <button 
            onClick={() => router.push('/schedule')}
            className="flex flex-col items-center justify-end gap-1 text-gray-600 py-2 hover:text-green-600 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p className="text-xs font-medium">Geçmiş</p>
          </button>
          
          <button className="flex flex-col items-center justify-end gap-1 text-green-600 py-2">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p className="text-xs font-medium">Yemek</p>
          </button>
        </div>
      </footer>
    </div>
  )
}

// Suspense wrapper
export default function MealCheckPageWrapper() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    }>
      <MealCheckPage />
    </Suspense>
  )
}