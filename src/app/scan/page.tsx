'use client'

import { motion } from 'framer-motion'
import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/hooks'
import { getDeviceInfo, generateDeviceFingerprint } from '@/lib/types'
import Logo from '@/components/Logo'
import QrScanner from 'qr-scanner'

interface QRScanResult {
  success: boolean
  message: string
  data?: {
    meal: any
    user: {
      id: string
      name: string
      department: string
    }
    mealType: string
    timestamp: string
  }
  securityFlags?: string[]
}

export default function QRScanPage() {
  const router = useRouter()
  const { user: authUser, isAuthenticated, isLoading: authLoading } = useAuth()
  
  const [isScanning, setIsScanning] = useState(false)
  const [scanResult, setScanResult] = useState<QRScanResult | null>(null)
  const [currentDate, setCurrentDate] = useState(new Date())
  const [isProcessing, setIsProcessing] = useState(false)
  const [testQRData, setTestQRData] = useState('')
  const [deviceInfo, setDeviceInfo] = useState<any>(null)
  const [location, setLocation] = useState<any>(null)
  const [cameraError, setCameraError] = useState<string | null>(null)
  const [debugLogs, setDebugLogs] = useState<string[]>([])
  
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const qrScannerRef = useRef<QrScanner | null>(null)

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/login')
    }
  }, [authLoading, isAuthenticated, router])

  // Get device info and location on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const info = getDeviceInfo()
      setDeviceInfo(info)

      // Check for HTTPS requirement on mobile
      const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)
      if (isMobile && window.location.protocol !== 'https:' && window.location.hostname !== 'localhost') {
        console.warn('HTTPS required for camera access on mobile devices')
      }

      // Request location
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            setLocation({
              latitude: position.coords.latitude,
              longitude: position.coords.longitude,
              accuracy: position.coords.accuracy
            })
          },
          (error) => {
            console.log('Location access denied:', error)
          }
        )
      }
    }
  }, [])

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

  // Cleanup QR scanner on unmount
  useEffect(() => {
    return () => {
      if (qrScannerRef.current) {
        qrScannerRef.current.stop()
        qrScannerRef.current.destroy()
      }
    }
  }, [])

  const validateQRCode = async (qrData: string) => {
    setIsProcessing(true)
    setScanResult(null)

    try {
      const response = await fetch('/api/qr-validate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          qrData,
          deviceInfo,
          location
        })
      })

      const result = await response.json()
      setScanResult(result)

      // Stop camera if successful
      if (result.success && videoRef.current?.srcObject) {
        const tracks = (videoRef.current.srcObject as MediaStream).getTracks()
        tracks.forEach(track => track.stop())
        setIsScanning(false)
      }

    } catch (error) {
      console.error('QR validation error:', error)
      setScanResult({
        success: false,
        message: 'Bağlantı hatası'
      })
    } finally {
      setIsProcessing(false)
    }
  }

  const startCamera = async () => {
    try {
      setCameraError(null)
      setDebugLogs(prev => [...prev, 'QR Scanner başlatılıyor...'])
      
      if (!videoRef.current) {
        throw new Error('Video element bulunamadı')
      }

      setDebugLogs(prev => [...prev, 'QR Scanner oluşturuluyor...'])

      // Create QR Scanner instance
      qrScannerRef.current = new QrScanner(
        videoRef.current,
        (result) => {
          setDebugLogs(prev => [...prev, `QR Kod okundu: ${result.data.substring(0, 50)}...`])
          validateQRCode(result.data)
        },
        {
          onDecodeError: (error) => {
            // Don't log every decode error, it's normal when no QR is in view
          },
          highlightScanRegion: true,
          highlightCodeOutline: true,
          maxScansPerSecond: 5,
          preferredCamera: 'environment' // Use back camera on mobile
        }
      )

      setDebugLogs(prev => [...prev, 'QR Scanner başlatılıyor...'])
      await qrScannerRef.current.start()
      
      setDebugLogs(prev => [...prev, 'QR Scanner başarıyla başlatıldı'])
      setIsScanning(true)
      setScanResult(null)
      
    } catch (error: any) {
      console.error('QR Scanner hatası:', error)
      let errorMessage = 'QR okuyucu başlatılamadı'
      
      setDebugLogs(prev => [...prev, `HATA: ${error.name || 'Unknown'} - ${error.message}`])
      
      if (error.name === 'NotAllowedError') {
        errorMessage = 'Kamera izni reddedildi. Lütfen tarayıcı ayarlarından kamera erişimine izin verin.'
      } else if (error.name === 'NotFoundError') {
        errorMessage = 'Kamera bulunamadı. Cihazınızda kamera olduğundan emin olun.'
      } else if (error.name === 'NotSupportedError' || error.name === 'NotReadableError') {
        errorMessage = 'Kamera kullanımda veya erişilemiyor. Diğer uygulamaları kapatıp tekrar deneyin.'
      } else if (window.location.protocol !== 'https:' && window.location.hostname !== 'localhost') {
        errorMessage = 'QR okuma için HTTPS bağlantısı gerekli.'
      }
      
      setCameraError(errorMessage)
      setDebugLogs(prev => [...prev, `Hata mesajı: ${errorMessage}`])
    }
  }

  const stopCamera = () => {
    if (qrScannerRef.current) {
      qrScannerRef.current.stop()
      qrScannerRef.current.destroy()
      qrScannerRef.current = null
      setDebugLogs(prev => [...prev, 'QR Scanner durduruldu'])
    }
    setIsScanning(false)
  }

  const handleTestQR = () => {
    if (testQRData.trim()) {
      validateQRCode(testQRData.trim())
    }
  }

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('tr-TR', {
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const getCurrentMealType = () => {
    const hour = currentDate.getHours()
    if (hour >= 7 && hour < 11) {
      return 'kahvalti'
    } else if (hour >= 11 && hour < 15) {
      return 'ogle'
    }
    return null
  }

  const currentMealType = getCurrentMealType()

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <motion.header 
        initial={{ y: -50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="container mx-auto px-4 py-6"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Logo size="md" />
            <div>
              <h1 className="text-xl font-bold text-gray-800 leading-tight">
                MALKAN KANAAT
              </h1>
              <h2 className="text-lg font-bold text-gray-800">
                Yemek
              </h2>
              <p className="text-gray-600 text-sm">QR Kod Okuyucu</p>
            </div>
          </div>
          
          <div className="text-right">
            <div className="text-lg font-bold text-gray-800">{formatTime(currentDate)}</div>
            <div className="text-sm text-gray-600">
              {currentMealType ? (
                <span className={`px-2 py-1 rounded-full text-xs ${
                  currentMealType === 'kahvalti' 
                    ? 'bg-orange-100 text-orange-800' 
                    : 'bg-blue-100 text-blue-800'
                }`}>
                  {currentMealType === 'kahvalti' ? '🌅 Kahvaltı Saati' : '🌞 Öğle Saati'}
                </span>
              ) : (
                <span className="px-2 py-1 rounded-full text-xs bg-gray-100 text-gray-600">
                  ⏰ Yemek Saati Dışı
                </span>
              )}
            </div>
          </div>
        </div>
      </motion.header>

      <div className="container mx-auto px-4 py-6 pb-20">
        <div className="max-w-2xl mx-auto">
          
          {/* Scan Result */}
          {scanResult && (
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className={`mb-6 p-6 rounded-xl shadow-lg ${
                scanResult.success 
                  ? 'bg-green-50 border-2 border-green-200' 
                  : 'bg-red-50 border-2 border-red-200'
              }`}
            >
              <div className="text-center">
                <div className={`text-6xl mb-4 ${scanResult.success ? 'text-green-600' : 'text-red-600'}`}>
                  {scanResult.success ? '✅' : '❌'}
                </div>
                
                <h3 className={`text-xl font-bold mb-2 ${
                  scanResult.success ? 'text-green-800' : 'text-red-800'
                }`}>
                  {scanResult.success ? 'Başarılı!' : 'Hata!'}
                </h3>
                
                <p className={`text-lg mb-4 ${
                  scanResult.success ? 'text-green-700' : 'text-red-700'
                }`}>
                  {scanResult.message}
                </p>

                {scanResult.success && scanResult.data && (
                  <div className="bg-white rounded-lg p-4 mb-4">
                    <div className="space-y-2">
                      <p><strong>Personel:</strong> {scanResult.data.user.name}</p>
                      <p><strong>Departman:</strong> {scanResult.data.user.department}</p>
                      <p><strong>Öğün:</strong> {scanResult.data.mealType === 'kahvalti' ? 'Kahvaltı' : 'Öğle Yemeği'}</p>
                      <p><strong>Zaman:</strong> {new Date(scanResult.data.timestamp).toLocaleString('tr-TR')}</p>
                    </div>
                  </div>
                )}

                {scanResult.securityFlags && scanResult.securityFlags.length > 0 && (
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-4">
                    <p className="text-sm text-yellow-800">
                      <strong>Güvenlik Uyarıları:</strong> {scanResult.securityFlags.join(', ')}
                    </p>
                  </div>
                )}

                <button
                  onClick={() => setScanResult(null)}
                  className="px-6 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
                >
                  Tamam
                </button>
              </div>
            </motion.div>
          )}

          {/* HTTPS Warning for Mobile */}
          {typeof window !== 'undefined' && 
           window.location.protocol !== 'https:' && 
           window.location.hostname !== 'localhost' &&
           /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) && (
            <motion.div
              initial={{ y: 30, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              className="bg-yellow-50 border-2 border-yellow-200 rounded-xl p-4 mb-6"
            >
              <div className="flex items-center text-yellow-800">
                <span className="text-2xl mr-3">⚠️</span>
                <div>
                  <h3 className="font-semibold">HTTPS Gerekli</h3>
                  <p className="text-sm">Mobil cihazlarda kamera erişimi için güvenli bağlantı (HTTPS) gereklidir.</p>
                </div>
              </div>
            </motion.div>
          )}

          {/* Camera Section */}
          <motion.div
            initial={{ y: 30, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="bg-white rounded-xl shadow-lg p-6 mb-6"
          >
            <h2 className="text-xl font-bold text-gray-800 mb-4 text-center">
              📱 QR Kod Okuyucu
            </h2>

            <div className="space-y-4">
              {/* Camera View */}
              <div className="relative bg-gray-100 rounded-lg aspect-square max-w-sm mx-auto overflow-hidden">
                {isScanning ? (
                  <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    muted
                    controls={false}
                    webkit-playsinline="true"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-500">
                    <div className="text-center">
                      <div className="text-6xl mb-2">📷</div>
                      <p>Kamera kapalı</p>
                    </div>
                  </div>
                )}

                {isProcessing && (
                  <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
                    <div className="bg-white rounded-lg p-4 text-center">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
                      <p className="text-sm">İşleniyor...</p>
                    </div>
                  </div>
                )}
              </div>

              {/* Error Display */}
              {cameraError && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg"
                >
                  <div className="flex items-center">
                    <span className="text-red-600 text-lg mr-2">❌</span>
                    <div>
                      <h4 className="text-red-800 font-semibold">Kamera Hatası</h4>
                      <p className="text-red-700 text-sm mt-1">{cameraError}</p>
                    </div>
                  </div>
                </motion.div>
              )}

              {/* Debug Logs */}
              {debugLogs.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mb-4 p-4 bg-gray-50 border border-gray-200 rounded-lg max-h-48 overflow-y-auto"
                >
                  <h4 className="text-gray-800 font-semibold mb-2">Debug Bilgileri:</h4>
                  <div className="space-y-1">
                    {debugLogs.map((log, index) => (
                      <p key={index} className="text-xs text-gray-600 font-mono">
                        [{new Date().toLocaleTimeString()}] {log}
                      </p>
                    ))}
                  </div>
                </motion.div>
              )}

              {/* Camera Controls */}
              <div className="flex justify-center space-x-4">
                {!isScanning ? (
                  <button
                    onClick={startCamera}
                    className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-semibold"
                  >
                    📷 Kamerayı Başlat
                  </button>
                ) : (
                  <button
                    onClick={stopCamera}
                    className="px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-semibold"
                  >
                    ⏹️ Kamerayı Durdur
                  </button>
                )}
                
                {/* Clear Debug Logs Button */}
                {debugLogs.length > 0 && (
                  <button
                    onClick={() => setDebugLogs([])}
                    className="px-4 py-3 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors text-sm"
                  >
                    🗑️ Logları Temizle
                  </button>
                )}
              </div>
            </div>

            <canvas ref={canvasRef} className="hidden" />
          </motion.div>

          {/* Manual QR Input for Testing */}
          <motion.div
            initial={{ y: 30, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="bg-white rounded-xl shadow-lg p-6 mb-6"
          >
            <h2 className="text-xl font-bold text-gray-800 mb-4 text-center">
              🧪 Test QR Kodu
            </h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  QR Kod Verisi (Base64)
                </label>
                <textarea
                  value={testQRData}
                  onChange={(e) => setTestQRData(e.target.value)}
                  placeholder="QR kod içeriğini buraya yapıştırın..."
                  className="w-full h-24 px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 resize-none"
                />
              </div>
              
              <button
                onClick={handleTestQR}
                disabled={!testQRData.trim() || isProcessing}
                className="w-full px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-400 transition-colors font-semibold"
              >
                ✅ Test Et
              </button>
            </div>
          </motion.div>

          {/* Device Info */}
          {deviceInfo && (
            <motion.div
              initial={{ y: 30, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.4 }}
              className="bg-gray-50 rounded-xl p-4 mb-6"
            >
              <h3 className="text-sm font-semibold text-gray-700 mb-2">🔒 Güvenlik Bilgileri</h3>
              <div className="text-xs text-gray-600 space-y-1">
                <p><strong>Cihaz ID:</strong> {generateDeviceFingerprint(deviceInfo).substring(0, 12)}...</p>
                <p><strong>Konum:</strong> {location ? '✅ Alındı' : '❌ Alınamadı'}</p>
                <p><strong>Platform:</strong> {deviceInfo.platform}</p>
                <p><strong>Zaman Dilimi:</strong> {deviceInfo.timezone}</p>
              </div>
            </motion.div>
          )}

          {/* Navigation removed - using bottom navigation instead */}
        </div>

        {/* Bottom Navigation */}
        <footer className="sticky bottom-0 bg-white shadow-lg">
          <div className="flex justify-around border-t border-gray-200 py-2">
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
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              <p className="text-xs font-medium">QR Okut</p>
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
          </div>
        </footer>
      </div>
    </div>
  )
}