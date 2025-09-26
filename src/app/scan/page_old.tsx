'use client'

import { motion } from 'framer-motion'
import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useDeviceAuth, useAuth } from '@/lib/hooks'
import Logo from '@/components/Logo'

interface PersonelInfo {
  id: string
  name: string
  department: string
  lastMeal?: {
    type: 'kahvalti' | 'ogle'
    date: string
  }
}

interface MealCheckResult {
  canTakeMeal: boolean
  user: PersonelInfo
  mealType: 'kahvalti' | 'ogle'
  reason?: string
}

export default function QRScanPage() {
  const router = useRouter()
  const { user: authUser, isAuthenticated, isLoading: authLoading } = useAuth()
  const { deviceFingerprint, user, isLoading, error, checkAuth } = useDeviceAuth()
  
  // All useState hooks at the top
  const [isScanning, setIsScanning] = useState(false)
  const [mealCheckResult, setMealCheckResult] = useState<MealCheckResult | null>(null)
  const [currentDate, setCurrentDate] = useState(new Date())
  const [mealType, setMealType] = useState<'kahvalti' | 'ogle'>('kahvalti')
  const [isProcessing, setIsProcessing] = useState(false)
  const [showRegistration, setShowRegistration] = useState(false)
  const [registrationData, setRegistrationData] = useState({ name: '', department: '' })
  
  // All refs at the top
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/login')
    }
  }, [authLoading, isAuthenticated, router])

  // Show loading while checking authentication
  if (authLoading) {
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

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentDate(new Date())
    }, 1000)
    return () => clearInterval(timer)
  }, [])

  // Yemek saatine göre otomatik tip belirleme
  useEffect(() => {
    const hour = currentDate.getHours()
    if (hour >= 7 && hour < 11) {
      setMealType('kahvalti')
    } else if (hour >= 11 && hour < 15) {
      setMealType('ogle')
    }
  }, [currentDate])

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'environment' } 
      })
      if (videoRef.current) {
        videoRef.current.srcObject = stream
        setIsScanning(true)
      }
    } catch (error) {
      console.error('Kamera erişimi hatası:', error)
      alert('Kamera erişimi için izin gerekli')
    }
  }

  const stopCamera = () => {
    if (videoRef.current?.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream
      stream.getTracks().forEach(track => track.stop())
      setIsScanning(false)
    }
  }

  // Mock QR kod okuma fonksiyonu - Gerçek QR kod okunduğunda bu çalışacak
  const handleQRRead = async () => {
    if (!deviceFingerprint || isProcessing) return
    
    setIsProcessing(true)
    
    try {
      // Check meal eligibility
      const response = await fetch(`/api/meals?fingerprint=${deviceFingerprint}`)
      const data = await response.json()
      
      if (data.success && data.canTakeMeal) {
        setMealCheckResult({
          canTakeMeal: data.canTakeMeal,
          user: data.user,
          mealType: data.mealType,
          reason: data.reason
        })
      } else {
        setMealCheckResult({
          canTakeMeal: false,
          user: data.user,
          mealType: data.mealType || mealType,
          reason: data.reason || 'Yemek alınamaz'
        })
      }
      
      stopCamera()
    } catch (error) {
      console.error('QR okuma hatası:', error)
      alert('Bağlantı hatası')
    } finally {
      setIsProcessing(false)
    }
  }

  const confirmMeal = async () => {
    if (!deviceFingerprint || !mealCheckResult || isProcessing) return
    
    setIsProcessing(true)
    
    try {
      const response = await fetch('/api/meals', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          fingerprint: deviceFingerprint,
          mealType: mealCheckResult.mealType
        })
      })
      
      const data = await response.json()
      
      if (data.success) {
        alert(data.data.message || 'Yemek kaydedildi!')
        setMealCheckResult(null)
        // Refresh user data
        await checkAuth()
      } else {
        alert(data.message || 'Hata oluştu!')
      }
    } catch (error) {
      console.error('Yemek kayıt hatası:', error)
      alert('Bağlantı hatası')
    } finally {
      setIsProcessing(false)
    }
  }

  const canTakeMeal = () => {
    return mealCheckResult?.canTakeMeal || false
  }

  // Show registration form if user not found
  if (!user && !isLoading && deviceFingerprint) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <motion.div
          className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
        >
          <h2 className="text-2xl font-bold text-center text-gray-800 mb-6">
            Yeni Kullanıcı Kaydı
          </h2>
          <p className="text-gray-600 text-center mb-6">
            Bu cihaz tanınmıyor. Lütfen bilgilerinizi girin.
          </p>
          
          <div className="space-y-4">
            <input
              type="text"
              placeholder="Ad Soyad"
              className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:border-indigo-500"
              value={registrationData.name}
              onChange={(e) => setRegistrationData(prev => ({ ...prev, name: e.target.value }))}
            />
            <input
              type="text"
              placeholder="Departman"
              className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:border-indigo-500"
              value={registrationData.department}
              onChange={(e) => setRegistrationData(prev => ({ ...prev, department: e.target.value }))}
            />
            
            <motion.button
              onClick={async () => {
                if (registrationData.name && registrationData.department) {
                  // registerUser fonksiyonu hooks'tan geliyor ama burada kullanmıyoruz
                  // Direkt API çağrısı yapalım
                  try {
                    const deviceInfo = {
                      userAgent: navigator.userAgent,
                      language: navigator.language,
                      platform: navigator.platform,
                      screenResolution: `${screen.width}x${screen.height}`,
                      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
                      cookiesEnabled: navigator.cookieEnabled
                    }
                    
                    const response = await fetch('/api/auth', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({
                        deviceInfo,
                        userName: registrationData.name,
                        department: registrationData.department
                      })
                    })
                    
                    const data = await response.json()
                    if (data.success) {
                      checkAuth() // Refresh user data
                    } else {
                      alert(data.message || 'Kayıt hatası')
                    }
                  } catch (error) {
                    alert('Bağlantı hatası')
                  }
                } else {
                  alert('Lütfen tüm alanları doldurun')
                }
              }}
              className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-3 rounded-lg"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              Kayıt Ol
            </motion.button>
            
            <Link href="/" className="block text-center text-gray-600 hover:text-gray-800">
              ← Ana Sayfaya Dön
            </Link>
          </div>
        </motion.div>
      </div>
    )
  }

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-green-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Yükleniyor...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100 p-4">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-md mx-auto"
      >
        {/* Header */}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <div className="flex justify-between items-center mb-4">
            <Link href="/">
              <motion.button
                className="text-gray-600 hover:text-gray-800"
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
              >
                ← Geri
              </motion.button>
            </Link>
            <div className="flex items-center gap-2">
              <Logo size="sm" />
              <div>
                <div className="text-sm font-bold text-gray-800 leading-tight">
                  MALKAN KANAAT
                </div>
                <div className="text-sm font-bold text-gray-800">
                  Yemek
                </div>
                <p className="text-xs text-gray-600 mt-1">QR Kod Okut</p>
              </div>
            </div>
            <div></div>
          </div>
          
          <div className="text-center">
            <div className="text-lg font-semibold text-gray-800">
              {currentDate.toLocaleDateString('tr-TR', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric'
              })}
            </div>
            <div className="text-sm text-gray-600 mt-1">
              {currentDate.toLocaleTimeString('tr-TR')}
            </div>
            <div className="mt-3">
              <span className={`px-3 py-1 rounded-full text-sm font-semibold ${
                mealType === 'kahvalti' 
                  ? 'bg-yellow-100 text-yellow-800' 
                  : 'bg-orange-100 text-orange-800'
              }`}>
                {mealType === 'kahvalti' ? 'Kahvaltı Saati' : 'Öğle Yemeği Saati'}
              </span>
            </div>
            
            {user && (
              <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-600">Hoşgeldiniz</p>
                <p className="font-semibold text-gray-800">{user.name}</p>
                <p className="text-xs text-gray-500">{user.department}</p>
              </div>
            )}
          </div>
        </div>

        {/* QR Scanner */}
        {!mealCheckResult && user && (
          <motion.div
            className="bg-white rounded-lg shadow-lg p-6 mb-6"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
          >
            {!isScanning ? (
              <div className="text-center">
                <div className="w-32 h-32 mx-auto mb-4 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center">
                  <span className="text-gray-500">QR Kod</span>
                </div>
                <motion.button
                  onClick={startCamera}
                  className="bg-green-600 hover:bg-green-700 text-white font-semibold py-3 px-6 rounded-lg"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  Kamerayı Başlat
                </motion.button>
              </div>
            ) : (
              <div className="text-center">
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  className="w-full h-64 bg-black rounded-lg mb-4"
                />
                <canvas ref={canvasRef} className="hidden" />
                <div className="space-x-4">
                  <motion.button
                    onClick={handleQRRead}
                    disabled={isProcessing}
                    className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-semibold py-2 px-4 rounded-lg"
                    whileHover={{ scale: isProcessing ? 1 : 1.05 }}
                  >
                    {isProcessing ? 'İşleniyor...' : 'Test QR Okut'}
                  </motion.button>
                  <motion.button
                    onClick={stopCamera}
                    className="bg-red-600 hover:bg-red-700 text-white font-semibold py-2 px-4 rounded-lg"
                    whileHover={{ scale: 1.05 }}
                  >
                    Durdur
                  </motion.button>
                </div>
              </div>
            )}
          </motion.div>
        )}

        {/* Personel Bilgileri */}
        {mealCheckResult && (
          <motion.div
            className="bg-white rounded-lg shadow-lg p-6"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <div className="text-center mb-6">
              <div className="w-20 h-20 bg-gray-300 rounded-full mx-auto mb-3 flex items-center justify-center">
                <span className="text-2xl">👤</span>
              </div>
              <h2 className="text-xl font-bold text-gray-800">{mealCheckResult.user.name}</h2>
              <p className="text-gray-600">{mealCheckResult.user.department}</p>
            </div>

            {canTakeMeal() ? (
              <div className="text-center">
                <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
                  <p className="text-green-800 font-semibold">
                    {mealCheckResult.mealType === 'kahvalti' ? 'Kahvaltı' : 'Öğle Yemeği'} Hakkı Mevcut
                  </p>
                </div>
                <motion.button
                  onClick={confirmMeal}
                  disabled={isProcessing}
                  className="bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white font-semibold py-3 px-6 rounded-lg w-full"
                  whileHover={{ scale: isProcessing ? 1 : 1.02 }}
                  whileTap={{ scale: isProcessing ? 1 : 0.98 }}
                >
                  {isProcessing ? 'Kaydediliyor...' : 'Yemeği Onayla'}
                </motion.button>
              </div>
            ) : (
              <div className="text-center">
                <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
                  <p className="text-red-800 font-semibold">
                    {mealCheckResult.reason || 'Yemek alınamaz'}
                  </p>
                </div>
                <motion.button
                  onClick={() => setMealCheckResult(null)}
                  className="bg-gray-600 hover:bg-gray-700 text-white font-semibold py-3 px-6 rounded-lg w-full"
                  whileHover={{ scale: 1.02 }}
                >
                  Tekrar Dene
                </motion.button>
              </div>
            )}
          </motion.div>
        )}
      </motion.div>
    </div>
  )
}