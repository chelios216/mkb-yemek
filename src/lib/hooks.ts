import { useEffect, useState, useCallback } from 'react'
import { getDeviceInfo, generateDeviceFingerprint, DeviceInfo, User, UserRole } from '@/lib/types'

// Authentication Hook
interface UseAuthResult {
  user: User | null
  isAuthenticated: boolean
  isLoading: boolean
  error: string | null
  login: (email: string, password: string) => Promise<boolean>
  logout: () => Promise<void>
  checkAuth: () => Promise<void>
}

export function useAuth(): UseAuthResult {
  const [user, setUser] = useState<User | null>(null)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Check authentication status
  const checkAuth = useCallback(async () => {
    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/login')
      const data = await response.json()

      if (data.success) {
        setUser(data.data.user)
        setIsAuthenticated(true)
      } else {
        setUser(null)
        setIsAuthenticated(false)
      }
    } catch (err) {
      setError('Bağlantı hatası')
      setUser(null)
      setIsAuthenticated(false)
      console.error('Auth check error:', err)
    } finally {
      setIsLoading(false)
    }
  }, [])

  // Login function
  const login = useCallback(async (email: string, password: string): Promise<boolean> => {
    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email, password })
      })

      const data = await response.json()

      if (data.success) {
        setUser(data.data.user)
        setIsAuthenticated(true)
        return true
      } else {
        setError(data.message || 'Giriş hatası')
        return false
      }
    } catch (err) {
      setError('Bağlantı hatası')
      console.error('Login error:', err)
      return false
    } finally {
      setIsLoading(false)
    }
  }, [])

  // Logout function
  const logout = useCallback(async () => {
    setIsLoading(true)

    try {
      await fetch('/api/logout', { method: 'POST' })
      setUser(null)
      setIsAuthenticated(false)
    } catch (err) {
      console.error('Logout error:', err)
    } finally {
      setIsLoading(false)
    }
  }, [])

  // Check auth on mount
  useEffect(() => {
    checkAuth()
  }, [checkAuth])

  return {
    user,
    isAuthenticated,
    isLoading,
    error,
    login,
    logout,
    checkAuth
  }
}

// Device Authentication Hook (for QR scanning)
interface UseDeviceAuthResult {
  deviceFingerprint: string | null
  user: any | null
  isLoading: boolean
  error: string | null
  registerUser: (name: string, department: string) => Promise<void>
  checkAuth: () => Promise<void>
}

export function useDeviceAuth(): UseDeviceAuthResult {
  const [deviceFingerprint, setDeviceFingerprint] = useState<string | null>(null)
  const [user, setUser] = useState<any | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Initialize device fingerprint
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const deviceInfo = getDeviceInfo()
      const fingerprint = generateDeviceFingerprint(deviceInfo)
      setDeviceFingerprint(fingerprint)
    }
  }, [])

  // Check existing authentication
  const checkAuth = useCallback(async () => {
    if (!deviceFingerprint) return

    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch(`/api/auth?fingerprint=${deviceFingerprint}`)
      const data = await response.json()

      if (data.success) {
        setUser(data.data.user)
      } else {
        setUser(null)
      }
    } catch (err) {
      setError('Bağlantı hatası')
      console.error('Auth check error:', err)
    } finally {
      setIsLoading(false)
    }
  }, [deviceFingerprint])

  // Register new user
  const registerUser = useCallback(async (name: string, department: string) => {
    if (!deviceFingerprint) {
      setError('Cihaz bilgisi alınamadı')
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      const deviceInfo = getDeviceInfo()
      
      const response = await fetch('/api/auth', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          deviceInfo,
          userName: name,
          department
        })
      })

      const data = await response.json()

      if (data.success) {
        setUser(data.data.user)
      } else {
        setError(data.message || 'Kayıt hatası')
      }
    } catch (err) {
      setError('Bağlantı hatası')
      console.error('Registration error:', err)
    } finally {
      setIsLoading(false)
    }
  }, [deviceFingerprint])

  // Check auth when fingerprint is available
  useEffect(() => {
    if (deviceFingerprint) {
      checkAuth()
    }
  }, [deviceFingerprint, checkAuth])

  return {
    deviceFingerprint,
    user,
    isLoading,
    error,
    registerUser,
    checkAuth
  }
}