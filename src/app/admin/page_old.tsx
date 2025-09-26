'use client'

import { motion } from 'framer-motion'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import Logo from '@/components/Logo'

interface DashboardStats {
  todayBreakfast: number
  todayLunch: number
  monthlyBreakfast: number
  monthlyLunch: number
  totalUsers: number
  activeUsers: number
  recentActivities: any[]
}

interface PersonelRecord {
  id: string
  name: string
  department: string
  todayMeals: string[]
  monthlyTotal: number
}

export default function AdminPanel() {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'reports' | 'personel'>('dashboard')
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [users, setUsers] = useState<any[]>([])
  const [recentActivities, setRecentActivities] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(false)

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

  // Load recent activities
  const loadRecentActivities = async () => {
    try {
      const response = await fetch('/api/admin?type=recent-activities')
      const data = await response.json()
      if (data.success) {
        setRecentActivities(data.data)
      }
    } catch (error) {
      console.error('Recent activities load error:', error)
    }
  }

  // Load data on mount and tab change
  useEffect(() => {
    if (activeTab === 'dashboard') {
      loadDashboardData()
      loadRecentActivities()
    } else if (activeTab === 'personel') {
      loadUsersData()
    }
  }, [activeTab])

  const cardVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 }
  }

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <div className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center space-x-4">
              <Link href="/">
                <motion.button
                  className="text-gray-600 hover:text-gray-800"
                  whileHover={{ scale: 1.1 }}
                >
                  ← Ana Sayfa
                </motion.button>
              </Link>
              <div className="flex items-center gap-3">
                <Logo size="md" />
                <div>
                  <div className="text-2xl font-bold text-gray-900 leading-tight">
                    MALKAN KANAAT
                  </div>
                  <div className="text-xl font-bold text-gray-900">
                    Yemek
                  </div>
                  <p className="text-sm text-gray-600 mt-1">Admin Paneli</p>
                </div>
              </div>
            </div>
            <div className="text-sm text-gray-600">
              {new Date().toLocaleDateString('tr-TR')}
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Tab Navigation */}
        <div className="mb-8">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8">
              {[
                { key: 'dashboard', label: 'Dashboard' },
                { key: 'reports', label: 'Raporlar' },
                { key: 'personel', label: 'Personel' }
              ].map((tab) => (
                <motion.button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key as any)}
                  className={`py-2 px-1 border-b-2 font-medium text-sm ${
                    activeTab === tab.key
                      ? 'border-indigo-500 text-indigo-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  {tab.label}
                </motion.button>
              ))}
            </nav>
          </div>
        </div>

        {/* Dashboard Tab */}
        {activeTab === 'dashboard' && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3 }}
          >
            {isLoading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
                <p className="text-gray-600 mt-4">Yükleniyor...</p>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                  <motion.div
                    className="bg-white rounded-lg shadow p-6"
                    variants={cardVariants}
                    initial="hidden"
                    animate="visible"
                    transition={{ delay: 0.1 }}
                  >
                    <div className="flex items-center">
                      <div className="flex-shrink-0">
                        <div className="w-8 h-8 bg-yellow-100 rounded-md flex items-center justify-center">
                          <span className="text-yellow-600 font-bold">K</span>
                        </div>
                      </div>
                      <div className="ml-5 w-0 flex-1">
                        <dl>
                          <dt className="text-sm font-medium text-gray-500 truncate">
                            Bugün Kahvaltı
                          </dt>
                          <dd className="text-3xl font-bold text-gray-900">
                            {stats?.todayBreakfast || 0}
                          </dd>
                        </dl>
                      </div>
                    </div>
                  </motion.div>

                  <motion.div
                    className="bg-white rounded-lg shadow p-6"
                    variants={cardVariants}
                    initial="hidden"
                    animate="visible"
                    transition={{ delay: 0.2 }}
                  >
                    <div className="flex items-center">
                      <div className="flex-shrink-0">
                        <div className="w-8 h-8 bg-orange-100 rounded-md flex items-center justify-center">
                          <span className="text-orange-600 font-bold">Ö</span>
                        </div>
                      </div>
                      <div className="ml-5 w-0 flex-1">
                        <dl>
                          <dt className="text-sm font-medium text-gray-500 truncate">
                            Bugün Öğle
                          </dt>
                          <dd className="text-3xl font-bold text-gray-900">
                            {stats?.todayLunch || 0}
                          </dd>
                        </dl>
                      </div>
                    </div>
                  </motion.div>

                  <motion.div
                    className="bg-white rounded-lg shadow p-6"
                    variants={cardVariants}
                    initial="hidden"
                    animate="visible"
                    transition={{ delay: 0.3 }}
                  >
                    <div className="flex items-center">
                      <div className="flex-shrink-0">
                        <div className="w-8 h-8 bg-green-100 rounded-md flex items-center justify-center">
                          <span className="text-green-600 font-bold">👥</span>
                        </div>
                      </div>
                      <div className="ml-5 w-0 flex-1">
                        <dl>
                          <dt className="text-sm font-medium text-gray-500 truncate">
                            Aktif Personel
                          </dt>
                          <dd className="text-3xl font-bold text-gray-900">
                            {stats?.activeUsers || 0}
                          </dd>
                        </dl>
                      </div>
                    </div>
                  </motion.div>

                  <motion.div
                    className="bg-white rounded-lg shadow p-6"
                    variants={cardVariants}
                    initial="hidden"
                    animate="visible"
                    transition={{ delay: 0.4 }}
                  >
                    <div className="flex items-center">
                      <div className="flex-shrink-0">
                        <div className="w-8 h-8 bg-indigo-100 rounded-md flex items-center justify-center">
                          <span className="text-indigo-600 font-bold">∑</span>
                        </div>
                      </div>
                      <div className="ml-5 w-0 flex-1">
                        <dl>
                          <dt className="text-sm font-medium text-gray-500 truncate">
                            Aylık Toplam
                          </dt>
                          <dd className="text-3xl font-bold text-gray-900">
                            {(stats?.monthlyBreakfast || 0) + (stats?.monthlyLunch || 0)}
                          </dd>
                        </dl>
                      </div>
                    </div>
                  </motion.div>
                </div>

                {/* Son Aktiviteler */}
                <motion.div
                  className="bg-white rounded-lg shadow"
                  variants={cardVariants}
                  initial="hidden"
                  animate="visible"
                  transition={{ delay: 0.5 }}
                >
                  <div className="px-6 py-4 border-b border-gray-200">
                    <h3 className="text-lg font-medium text-gray-900">Son Aktiviteler</h3>
                  </div>
                  <div className="px-6 py-4">
                    <div className="space-y-3">
                      {recentActivities.length > 0 ? (
                        recentActivities.slice(0, 10).map((activity: any, index: number) => (
                          <div key={activity.id || index} className="flex items-center space-x-3">
                            <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                            <span className="text-sm text-gray-600">
                              {activity.userName} - {activity.mealType === 'kahvalti' ? 'Kahvaltı' : 'Öğle yemeği'} aldı
                            </span>
                            <span className="text-xs text-gray-400">
                              {new Date(activity.timestamp).toLocaleString('tr-TR')}
                            </span>
                          </div>
                        ))
                      ) : (
                        <div className="text-center text-gray-500 py-4">
                          <p>Henüz aktivite bulunmuyor</p>
                        </div>
                      )}
                    </div>
                  </div>
                </motion.div>
              </>
            )}
          </motion.div>
        )}

        {/* Raporlar Tab */}
        {activeTab === 'reports' && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3 }}
          >
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Aylık Özet</h3>
                <div className="space-y-4">
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Toplam Kahvaltı:</span>
                    <span className="text-sm font-semibold">{stats?.monthlyBreakfast || 0} adet</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Toplam Öğle:</span>
                    <span className="text-sm font-semibold">{stats?.monthlyLunch || 0} adet</span>
                  </div>
                  <div className="flex justify-between border-t pt-2">
                    <span className="text-sm font-semibold text-gray-900">Genel Toplam:</span>
                    <span className="text-sm font-bold text-indigo-600">
                      {(stats?.monthlyBreakfast || 0) + (stats?.monthlyLunch || 0)} adet
                    </span>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Günlük Trend</h3>
                <div className="text-center text-gray-500">
                  <p>Grafik burada görüntülenecek</p>
                  <p className="text-xs mt-2">(Chart.js entegrasyonu)</p>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* Personel Tab */}
        {activeTab === 'personel' && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3 }}
          >
            {isLoading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
                <p className="text-gray-600 mt-4">Yükleniyor...</p>
              </div>
            ) : (
              <div className="bg-white rounded-lg shadow">
                <div className="px-6 py-4 border-b border-gray-200">
                  <h3 className="text-lg font-medium text-gray-900">Personel Listesi</h3>
                </div>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Personel
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Departman
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Bugün
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Aylık Toplam
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Durum
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {users.length > 0 ? (
                        users.map((person: any) => (
                          <motion.tr
                            key={person.id}
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            whileHover={{ backgroundColor: '#f9fafb' }}
                          >
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm font-medium text-gray-900">
                                {person.name}
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm text-gray-600">
                                {person.department}
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="flex space-x-2">
                                {person.todayMeals && person.todayMeals.length > 0 ? (
                                  person.todayMeals.map((meal: string, index: number) => (
                                    <span
                                      key={index}
                                      className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                                        meal === 'kahvalti'
                                          ? 'bg-yellow-100 text-yellow-800'
                                          : 'bg-orange-100 text-orange-800'
                                      }`}
                                    >
                                      {meal === 'kahvalti' ? 'Kahvaltı' : 'Öğle'}
                                    </span>
                                  ))
                                ) : (
                                  <span className="text-sm text-gray-400">-</span>
                                )}
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                              {person.monthlyTotal || 0}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                                person.isActive
                                  ? 'bg-green-100 text-green-800'
                                  : 'bg-red-100 text-red-800'
                              }`}>
                                {person.isActive ? 'Aktif' : 'Pasif'}
                              </span>
                            </td>
                          </motion.tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={5} className="px-6 py-4 text-center text-gray-500">
                            Henüz personel bulunmuyor
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </motion.div>
        )}
      </div>
    </div>
  )
}