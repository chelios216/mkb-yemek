'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/hooks'
import Logo from '@/components/Logo'
import { QRCodeSVG } from 'qrcode.react'

interface DashboardStats {
  todayBreakfast: number
  todayLunch: number
  monthlyBreakfast: number
  monthlyLunch: number
  totalUsers: number
  activeUsers: number
  recentActivities: any[]
}

interface UserRecord {
  id: string
  name: string
  email: string
  department: string
  role: string
  isActive: boolean
  isApproved: boolean
  todayMeals: string[]
  monthlyTotal: number
  createdAt: string
}

interface QRCodeData {
  qrData: string
  user: string
  mealType: string
  validUntil: string
}

export default function AdminPanel() {
  const router = useRouter()
  const { logout } = useAuth()
  const [showSettingsModal, setShowSettingsModal] = useState(false)
  const [notificationsEnabled, setNotificationsEnabled] = useState(true)
  
  const [activeTab, setActiveTab] = useState<'dashboard' | 'users' | 'settings'>('dashboard')
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [users, setUsers] = useState<UserRecord[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [showUserModal, setShowUserModal] = useState(false)
  const [editingUser, setEditingUser] = useState<UserRecord | null>(null)
  const [showApprovalModal, setShowApprovalModal] = useState(false)
  const [approvingUser, setApprovingUser] = useState<UserRecord | null>(null)
  const [approvalQRCode, setApprovalQRCode] = useState<string>('')

  // Notification modal state
  const [notification, setNotification] = useState<{
    show: boolean
    type: 'success' | 'error' | 'warning'
    message: string
  }>({
    show: false,
    type: 'success',
    message: ''
  })

  // Confirm modal state
  const [confirmDialog, setConfirmDialog] = useState<{
    show: boolean
    message: string
    onConfirm: () => void
  }>({
    show: false,
    message: '',
    onConfirm: () => {}
  })

  // User form state
  const [userForm, setUserForm] = useState({
    name: '',
    email: '',
    department: '',
    role: 'personel',
    password: ''
  })

  // System settings state
  const [workSchedule, setWorkSchedule] = useState({
    workDays: [1, 2, 3, 4, 5, 6],
    breakfastStart: '07:00',
    breakfastEnd: '10:30',
    lunchStart: '11:30',
    lunchEnd: '14:30',
    monthlyBreakfastLimit: 22,
    monthlyLunchLimit: 22
  })

  // Show notification function
  const showNotification = (type: 'success' | 'error' | 'warning', message: string) => {
    setNotification({ show: true, type, message })
    setTimeout(() => {
      setNotification(prev => ({ ...prev, show: false }))
    }, 4000) // Auto hide after 4 seconds
  }

  // Show confirm function
  const showConfirm = (message: string, onConfirm: () => void) => {
    setConfirmDialog({ show: true, message, onConfirm })
  }

  // Load dashboard data
  const loadDashboardData = async () => {
    setIsLoading(true)
    try {
      const response = await fetch('/api/admin?type=stats')
      const data = await response.json()
      if (data.success) {
        setStats(data.data)
      }
    } catch (error) {
      console.error('Dashboard data load error:', error)
    } finally {
      setIsLoading(false)
    }
  }

  // Load users data
  const loadUsersData = async () => {
    setIsLoading(true)
    try {
      const response = await fetch('/api/admin?type=users')
      const data = await response.json()
      if (data.success) {
        setUsers(data.data)
      }
    } catch (error) {
      console.error('Users data load error:', error)
    } finally {
      setIsLoading(false)
    }
  }

  // Create or update user
  const handleSaveUser = async () => {
    try {
      const action = editingUser ? 'update-user' : 'create-user'
      const response = await fetch('/api/admin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action,
          userId: editingUser?.id,
          data: userForm
        })
      })

      const result = await response.json()
      if (result.success) {
        showNotification('success', result.message)
        setShowUserModal(false)
        setEditingUser(null)
        setUserForm({ name: '', email: '', department: '', role: 'personel', password: '' })
        loadUsersData()
      } else {
        showNotification('error', result.message)
      }
    } catch (error) {
      showNotification('error', 'Hata oluştu')
    }
  }

  // Delete user
  const handleDeleteUser = async (userId: string) => {
    showConfirm('Bu kullanıcıyı silmek istediğinizden emin misiniz?', async () => {
      try {
        const response = await fetch('/api/admin', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'delete-user',
            userId
          })
        })

        const result = await response.json()
        if (result.success) {
          showNotification('success', result.message)
          loadUsersData()
        } else {
          showNotification('error', result.message)
        }
      } catch (error) {
        showNotification('error', 'Hata oluştu')
      }
    })
  }

  // Load system settings
  const loadSystemSettings = async () => {
    try {
      const response = await fetch('/api/admin?type=settings')
      const data = await response.json()
      if (data.success && data.data) {
        setWorkSchedule(data.data)
      }
    } catch (error) {
      console.error('Settings load error:', error)
    }
  }

  // Save system settings
  const handleSaveSettings = async () => {
    setIsLoading(true)
    try {
      const response = await fetch('/api/admin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'update-settings',
          data: workSchedule
        })
      })

      const result = await response.json()
      if (result.success) {
        showNotification('success', 'Ayarlar başarıyla kaydedildi!')
      } else {
        showNotification('error', result.message || 'Ayarlar kaydedilemedi')
      }
    } catch (error) {
      showNotification('error', 'Hata oluştu')
    } finally {
      setIsLoading(false)
    }
  }

  // Refresh all user credits
  const handleRefreshCredits = async () => {
    setIsLoading(true)
    try {
      const response = await fetch('/api/refresh-credits', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
        },
        body: JSON.stringify({})
      })

      const result = await response.json()
      if (result.success) {
        showNotification('success', 'Tüm kullanıcı kredileri başarıyla yenilendi!')
      } else {
        showNotification('error', result.message || 'Krediler yenilenemedi')
      }
    } catch (error) {
      showNotification('error', 'Hata oluştu')
    } finally {
      setIsLoading(false)
    }
  }

  // Calculate work days in current month
  const calculateWorkDaysInCurrentMonth = () => {
    const now = new Date()
    const year = now.getFullYear()
    const month = now.getMonth()
    const daysInMonth = new Date(year, month + 1, 0).getDate()
    let workDayCount = 0
    
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(year, month, day)
      const dayOfWeek = date.getDay()
      
      if (workSchedule.workDays.includes(dayOfWeek)) {
        workDayCount++
      }
    }
    
    return workDayCount
  }

  useEffect(() => {
    loadDashboardData()
    loadUsersData()
    loadSystemSettings()
  }, [])

  // Edit user
  const handleEditUser = (user: UserRecord) => {
    setEditingUser(user)
    setUserForm({
      name: user.name,
      email: user.email,
      department: user.department,
      role: user.role,
      password: '' // Don't populate password for security
    })
    setShowUserModal(true)
  }

  // Approve user with QR code
  const handleApproveUser = (user: UserRecord) => {
    setApprovingUser(user)
    // QR kodunda kullanıcı ID'si ve işlem tipi bulunacak
    const qrData = JSON.stringify({
      action: 'approve-user',
      userId: user.id,
      timestamp: Date.now()
    })
    setApprovalQRCode(qrData)
    setShowApprovalModal(true)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 pb-20">
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
              <h1 className="text-2xl font-bold text-gray-800">Admin Paneli</h1>
              <p className="text-gray-600">Sistem yönetimi ve raporlar</p>
            </div>
          </div>
          
          <button 
            onClick={() => setShowSettingsModal(true)}
            className="p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </button>
        </div>
      </motion.header>

      <div className="container mx-auto px-4 py-6">
        {/* Tab Navigation */}
        <div className="flex space-x-1 bg-gray-100 rounded-lg p-1 mb-8">
          {[
            { key: 'dashboard', label: 'Dashboard', icon: '📊' },
            { key: 'users', label: 'Kullanıcı Yönetimi', icon: '👥' },
            { key: 'settings', label: 'Sistem Ayarları', icon: '⚙️' }
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key as any)}
              className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-md text-sm font-medium transition-colors ${
                activeTab === tab.key
                  ? 'bg-white text-blue-600 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <span>{tab.icon}</span>
              {tab.label}
            </button>
          ))}
        </div>

        {/* Sabit QR Kod Yazdırma Linki */}
        <div className="mb-6 text-center">
          <button
            onClick={() => window.open('/qr-print', '_blank')}
            className="inline-flex items-center gap-2 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-semibold shadow-md"
          >
            🖨️ Sabit QR Kodu Yazdır
          </button>
          <p className="text-sm text-gray-600 mt-2">
            Bu QR kodu yazdırıp mutfağa yapıştırabilirsiniz
          </p>
        </div>

        {/* Dashboard Tab */}
        {activeTab === 'dashboard' && (
          <div className="space-y-6">
            {isLoading ? (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                <p className="mt-2 text-gray-600">Yükleniyor...</p>
              </div>
            ) : stats ? (
              <>
                {/* Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  <motion.div 
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="bg-white rounded-xl shadow-md p-6"
                  >
                    <div className="flex items-center">
                      <div className="p-2 bg-orange-100 rounded-lg">
                        <span className="text-2xl">🌅</span>
                      </div>
                      <div className="ml-4">
                        <p className="text-sm font-medium text-gray-600">Bugün Kahvaltı</p>
                        <p className="text-2xl font-bold text-gray-900">{stats.todayBreakfast}</p>
                      </div>
                    </div>
                  </motion.div>

                  <motion.div 
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ delay: 0.1 }}
                    className="bg-white rounded-xl shadow-md p-6"
                  >
                    <div className="flex items-center">
                      <div className="p-2 bg-blue-100 rounded-lg">
                        <span className="text-2xl">🌞</span>
                      </div>
                      <div className="ml-4">
                        <p className="text-sm font-medium text-gray-600">Bugün Öğle</p>
                        <p className="text-2xl font-bold text-gray-900">{stats.todayLunch}</p>
                      </div>
                    </div>
                  </motion.div>

                  <motion.div 
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ delay: 0.2 }}
                    className="bg-white rounded-xl shadow-md p-6"
                  >
                    <div className="flex items-center">
                      <div className="p-2 bg-green-100 rounded-lg">
                        <span className="text-2xl">📅</span>
                      </div>
                      <div className="ml-4">
                        <p className="text-sm font-medium text-gray-600">Aylık Toplam</p>
                        <p className="text-2xl font-bold text-gray-900">{stats.monthlyBreakfast + stats.monthlyLunch}</p>
                      </div>
                    </div>
                  </motion.div>

                  <motion.div 
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ delay: 0.3 }}
                    className="bg-white rounded-xl shadow-md p-6"
                  >
                    <div className="flex items-center">
                      <div className="p-2 bg-purple-100 rounded-lg">
                        <span className="text-2xl">👥</span>
                      </div>
                      <div className="ml-4">
                        <p className="text-sm font-medium text-gray-600">Aktif Personel</p>
                        <p className="text-2xl font-bold text-gray-900">{stats.activeUsers}</p>
                      </div>
                    </div>
                  </motion.div>
                </div>
              </>
            ) : null}
          </div>
        )}

        {/* Users Tab */}
        {activeTab === 'users' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-bold text-gray-900">Kullanıcı Yönetimi</h2>
              <button
                onClick={() => {
                  setEditingUser(null)
                  setUserForm({ name: '', email: '', department: '', role: 'personel', password: '' })
                  setShowUserModal(true)
                }}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
              >
                ➕ Yeni Kullanıcı
              </button>
            </div>

            <div className="bg-white rounded-xl shadow-md overflow-hidden">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Kullanıcı</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Departman</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Rol</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Durum</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Onay</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Bu Ay</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">İşlemler</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {users.map((user) => (
                      <tr key={user.id}>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div>
                            <div className="text-sm font-medium text-gray-900">{user.name}</div>
                            <div className="text-sm text-gray-500">{user.email}</div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{user.department}</td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                            user.role === 'admin' ? 'bg-purple-100 text-purple-800' : 'bg-blue-100 text-blue-800'
                          }`}>
                            {user.role === 'admin' ? 'Yönetici' : 'Personel'}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                            user.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                          }`}>
                            {user.isActive ? 'Aktif' : 'Pasif'}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                            user.isApproved ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                          }`}>
                            {user.isApproved ? '✅ Onaylı' : '⏳ Bekliyor'}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{user.monthlyTotal}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-2">
                          {user.role !== 'admin' && !user.isApproved && (
                            <button
                              onClick={() => handleApproveUser(user)}
                              className="text-green-600 hover:text-green-900 bg-green-50 px-2 py-1 rounded text-xs"
                            >
                              📱 Tanımla
                            </button>
                          )}
                          <button
                            onClick={() => handleEditUser(user)}
                            className="text-blue-600 hover:text-blue-900"
                          >
                            ✏️ Düzenle
                          </button>
                          <button
                            onClick={() => handleDeleteUser(user.id)}
                            className="text-red-600 hover:text-red-900"
                          >
                            🗑️ Sil
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Settings Tab */}
        {activeTab === 'settings' && (
          <div className="space-y-6">
            <h2 className="text-xl font-bold text-gray-900">Sistem Ayarları</h2>
            
            <div className="bg-white rounded-xl shadow-md p-6">
              <h3 className="text-lg font-semibold mb-6 text-gray-800">Çalışma Günleri ve Saatleri</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Çalışma Günleri */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">Çalışma Günleri</label>
                  <div className="space-y-2">
                    {[
                      { value: 1, label: 'Pazartesi' },
                      { value: 2, label: 'Salı' },
                      { value: 3, label: 'Çarşamba' },
                      { value: 4, label: 'Perşembe' },
                      { value: 5, label: 'Cuma' },
                      { value: 6, label: 'Cumartesi' },
                      { value: 0, label: 'Pazar' }
                    ].map(day => (
                      <label key={day.value} className="flex items-center text-gray-700">
                        <input
                          type="checkbox"
                          checked={workSchedule.workDays.includes(day.value)}
                          onChange={(e) => {
                            const newWorkDays = e.target.checked
                              ? [...workSchedule.workDays, day.value]
                              : workSchedule.workDays.filter(d => d !== day.value)
                            setWorkSchedule({ ...workSchedule, workDays: newWorkDays })
                          }}
                          className="mr-2 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                        />
                        {day.label}
                      </label>
                    ))}
                  </div>
                </div>

                {/* Yemek Saatleri */}
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Kahvaltı Saatleri</label>
                    <div className="flex space-x-2">
                      <input
                        type="time"
                        value={workSchedule.breakfastStart}
                        onChange={(e) => setWorkSchedule({ ...workSchedule, breakfastStart: e.target.value })}
                        className="flex-1 border border-gray-300 rounded-lg px-3 py-2 focus:ring-blue-500 focus:border-blue-500 text-gray-800 bg-white"
                      />
                      <span className="flex items-center text-gray-700">-</span>
                      <input
                        type="time"
                        value={workSchedule.breakfastEnd}
                        onChange={(e) => setWorkSchedule({ ...workSchedule, breakfastEnd: e.target.value })}
                        className="flex-1 border border-gray-300 rounded-lg px-3 py-2 focus:ring-blue-500 focus:border-blue-500 text-gray-800 bg-white"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Öğle Saatleri</label>
                    <div className="flex space-x-2">
                      <input
                        type="time"
                        value={workSchedule.lunchStart}
                        onChange={(e) => setWorkSchedule({ ...workSchedule, lunchStart: e.target.value })}
                        className="flex-1 border border-gray-300 rounded-lg px-3 py-2 focus:ring-blue-500 focus:border-blue-500 text-gray-800 bg-white"
                      />
                      <span className="flex items-center text-gray-700">-</span>
                      <input
                        type="time"
                        value={workSchedule.lunchEnd}
                        onChange={(e) => setWorkSchedule({ ...workSchedule, lunchEnd: e.target.value })}
                        className="flex-1 border border-gray-300 rounded-lg px-3 py-2 focus:ring-blue-500 focus:border-blue-500 text-gray-800 bg-white"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Aylık Yemek Hakları */}
              <div className="mt-8">
                <h4 className="text-md font-semibold text-gray-900 mb-4">Aylık Yemek Hakları</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Aylık Kahvaltı Hakkı</label>
                    <input
                      type="number"
                      min="1"
                      max="31"
                      value={workSchedule.monthlyBreakfastLimit}
                      onChange={(e) => setWorkSchedule({ ...workSchedule, monthlyBreakfastLimit: parseInt(e.target.value) || 22 })}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-blue-500 focus:border-blue-500 text-gray-800 bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Aylık Öğle Hakkı</label>
                    <input
                      type="number"
                      min="1"
                      max="31"
                      value={workSchedule.monthlyLunchLimit}
                      onChange={(e) => setWorkSchedule({ ...workSchedule, monthlyLunchLimit: parseInt(e.target.value) || 22 })}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-blue-500 focus:border-blue-500 text-gray-800 bg-white"
                    />
                  </div>
                </div>
              </div>

              {/* Kaydet Butonu */}
              <div className="mt-8 flex justify-end">
                <button
                  onClick={handleSaveSettings}
                  disabled={isLoading}
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 transition-colors"
                >
                  {isLoading ? 'Kaydediliyor...' : 'Ayarları Kaydet'}
                </button>
              </div>
            </div>

            {/* Kredi Yönetimi */}
            <div className="bg-white rounded-xl shadow-md p-6 mt-6">
              <h3 className="text-lg font-semibold mb-4">Aylık Kredi Yönetimi</h3>
              <p className="text-sm text-gray-600 mb-4">
                Ay değiştiğinde veya çalışma günlerinde değişiklik olduğunda tüm kullanıcıların kredilerini yenileyebilirsiniz.
                Krediler, o ayki toplam çalışma günü sayısına göre otomatik hesaplanır.
              </p>
              
              <div className="flex justify-between items-center">
                <div className="text-sm text-gray-500">
                  <p>💳 Her çalışma günü = 1 kahvaltı + 1 öğle kredisi</p>
                  <p>📅 Eylül 2025: {calculateWorkDaysInCurrentMonth()} çalışma günü</p>
                </div>
                
                <button
                  onClick={handleRefreshCredits}
                  disabled={isLoading}
                  className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-400 transition-colors"
                >
                  {isLoading ? 'Yenileniyor...' : 'Kredileri Yenile'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* User Modal */}
      {showUserModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md mx-4">
            <h3 className="text-lg font-semibold mb-4 text-gray-800">
              {editingUser ? 'Kullanıcı Düzenle' : 'Yeni Kullanıcı'}
            </h3>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Ad Soyad</label>
                <input
                  type="text"
                  value={userForm.name}
                  onChange={(e) => setUserForm({ ...userForm, name: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-blue-500 focus:border-blue-500 text-gray-800 bg-white"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">E-posta</label>
                <input
                  type="email"
                  value={userForm.email}
                  onChange={(e) => setUserForm({ ...userForm, email: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-blue-500 focus:border-blue-500 text-gray-800 bg-white"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Departman</label>
                <input
                  type="text"
                  value={userForm.department}
                  onChange={(e) => setUserForm({ ...userForm, department: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-blue-500 focus:border-blue-500 text-gray-800 bg-white"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Rol</label>
                <select
                  value={userForm.role}
                  onChange={(e) => setUserForm({ ...userForm, role: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-blue-500 focus:border-blue-500 text-gray-800 bg-white"
                >
                  <option value="personel">Personel</option>
                  <option value="admin">Yönetici</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {editingUser ? 'Yeni Şifre (boş bırakılırsa değişmez)' : 'Şifre'}
                </label>
                <input
                  type="password"
                  value={userForm.password}
                  onChange={(e) => setUserForm({ ...userForm, password: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-blue-500 focus:border-blue-500 text-gray-800 bg-white"
                />
              </div>
            </div>

            <div className="flex justify-end space-x-2 mt-6">
              <button
                onClick={() => {
                  setShowUserModal(false)
                  setEditingUser(null)
                }}
                className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                İptal
              </button>
              <button
                onClick={handleSaveUser}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                {editingUser ? 'Güncelle' : 'Oluştur'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* QR Approval Modal */}
      {showApprovalModal && approvingUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-xl shadow-xl max-w-md w-full p-6"
          >
            <h3 className="text-lg font-semibold mb-4 text-center text-gray-800">
              Kullanıcı Tanımlama
            </h3>
            
            <div className="text-center space-y-4">
              <div className="bg-gray-50 p-4 rounded-lg">
                <p className="text-sm text-gray-600 mb-2">
                  <strong>{approvingUser.name}</strong> kullanıcısını tanımlamak için personelin telefonu ile aşağıdaki QR kodu okutmasını sağlayın:
                </p>
              </div>

              <div className="bg-white p-4 border-2 border-dashed border-gray-300 rounded-lg inline-block">
                <QRCodeSVG 
                  value={approvalQRCode}
                  size={200}
                  level="M"
                  includeMargin={true}
                />
              </div>

              <div className="text-xs text-gray-500">
                <p>Bu QR kod sadece bu kullanıcı için geçerlidir</p>
                <p>Personel bu kodu telefonuyla okutarak sisteme tanımlanacaktır</p>
              </div>
            </div>

            <div className="flex justify-center mt-6">
              <button
                onClick={() => {
                  setShowApprovalModal(false)
                  setApprovingUser(null)
                  setApprovalQRCode('')
                }}
                className="px-6 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600"
              >
                Kapat
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {/* Notification Modal */}
      {notification.show && (
        <motion.div
          initial={{ opacity: 0, y: -50 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -50 }}
          className="fixed top-4 right-4 z-50"
        >
          <div className={`max-w-md p-4 rounded-lg shadow-lg text-white ${
            notification.type === 'success' ? 'bg-green-600' :
            notification.type === 'error' ? 'bg-red-600' : 'bg-yellow-600'
          }`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <span className="mr-2">
                  {notification.type === 'success' ? '✅' : 
                   notification.type === 'error' ? '❌' : '⚠️'}
                </span>
                <span>{notification.message}</span>
              </div>
              <button
                onClick={() => setNotification(prev => ({ ...prev, show: false }))}
                className="ml-4 text-white hover:text-gray-200"
              >
                ✕
              </button>
            </div>
          </div>
        </motion.div>
      )}

      {/* Confirm Modal */}
      {confirmDialog.show && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-xl p-6 w-full max-w-md mx-4"
          >
            <div className="text-center">
              <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100 mb-4">
                <span className="text-red-600 text-xl">⚠️</span>
              </div>
              <h3 className="text-lg font-semibold text-gray-800 mb-2">Emin misiniz?</h3>
              <p className="text-gray-600 mb-6">{confirmDialog.message}</p>
              <div className="flex space-x-3 justify-center">
                <button
                  onClick={() => setConfirmDialog(prev => ({ ...prev, show: false }))}
                  className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  İptal
                </button>
                <button
                  onClick={() => {
                    confirmDialog.onConfirm()
                    setConfirmDialog(prev => ({ ...prev, show: false }))
                  }}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                >
                  Sil
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}

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
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 00-2-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
            <p className="text-xs font-medium">Admin</p>
          </button>
        </div>
      </footer>

      {/* Settings Modal */}
      <AnimatePresence>
        {showSettingsModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
            onClick={() => setShowSettingsModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-xl p-6 w-full max-w-sm"
              onClick={(e) => e.stopPropagation()}
            >
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Ayarlar</h3>
              
              {/* Notifications Toggle */}
              <div className="flex items-center justify-between mb-6">
                <span className="text-gray-700">Bildirimler</span>
                <button
                  onClick={() => setNotificationsEnabled(!notificationsEnabled)}
                  className={`relative inline-flex w-12 h-6 rounded-full transition-colors ${
                    notificationsEnabled ? 'bg-blue-500' : 'bg-gray-300'
                  }`}
                >
                  <span
                    className={`inline-block w-5 h-5 bg-white rounded-full shadow transform transition-transform ${
                      notificationsEnabled ? 'translate-x-6' : 'translate-x-0.5'
                    } translate-y-0.5`}
                  />
                </button>
              </div>
              
              {/* Logout Button */}
              <button
                onClick={logout}
                className="w-full bg-red-500 hover:bg-red-600 text-white py-3 px-4 rounded-lg font-medium transition-colors"
              >
                Çıkış Yap
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}