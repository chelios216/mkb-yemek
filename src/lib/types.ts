// Database Types and Models

export type UserRole = 'admin' | 'personel'

export interface User {
  id: string
  name: string
  department: string
  email?: string
  role: UserRole
  isActive: boolean
  isApproved: boolean
  createdAt: Date
  updatedAt: Date
}

export interface LoginCredentials {
  email: string
  password: string
}

export interface AuthResponse {
  success: boolean
  user?: User
  token?: string
  message?: string
}

export interface DeviceRegistration {
  id: string
  userId: string
  deviceFingerprint: string
  deviceInfo: {
    userAgent: string
    screenResolution: string
    timezone: string
  }
  isActive: boolean
  createdAt: Date
  lastUsed: Date
}

export interface MealRecord {
  id: string
  userId: string
  mealType: 'kahvalti' | 'ogle'
  date: string // YYYY-MM-DD format
  timestamp: Date
  deviceId?: string
}

export interface SystemSettings {
  id: string
  key: string
  value: string
  description?: string
  updatedAt: Date
}

// Çalışma saatleri ve günleri ayarları
export interface WorkScheduleSettings {
  workDays: number[] // 0=Pazar, 1=Pazartesi, ... 6=Cumartesi (varsayılan: [1,2,3,4,5,6])
  breakfastStart: string // "07:00"
  breakfastEnd: string   // "10:30"  
  lunchStart: string     // "11:30"
  lunchEnd: string       // "14:30"
  monthlyBreakfastLimit: number // Aylık kahvaltı hakkı (varsayılan: 22)
  monthlyLunchLimit: number     // Aylık öğle hakkı (varsayılan: 22)
}

// Kullanıcı kredi sistemi
export interface UserMealCredits {
  id: string
  userId: string
  year: number
  month: number // 0-11 (JavaScript format)
  totalWorkDays: number // O ayki toplam çalışma günü
  breakfastCredits: number // Otomatik hesaplanan kahvaltı kredisi
  lunchCredits: number // Otomatik hesaplanan öğle kredisi
  breakfastUsed: number // Kullanılan kahvaltı sayısı
  lunchUsed: number // Kullanılan öğle sayısı
  createdAt: Date
  updatedAt: Date
}

// Aylık kredi özeti
export interface MonthlyCreditSummary {
  totalWorkDays: number
  breakfastCredits: number
  lunchCredits: number
  breakfastUsed: number
  lunchUsed: number
  breakfastRemaining: number
  lunchRemaining: number
}

// API Response Types
export interface ApiResponse<T = any> {
  success: boolean
  data?: T
  message?: string
  error?: string
}

export interface MealCheckResponse {
  canTakeMeal: boolean
  user: User
  lastMeal?: MealRecord
  reason?: string
}

export interface DashboardStats {
  todayBreakfast: number
  todayLunch: number
  monthlyBreakfast: number
  monthlyLunch: number
  totalUsers: number
  activeUsers: number
  recentActivities: MealRecord[]
}

// Device Fingerprinting
export interface DeviceInfo {
  userAgent: string
  language: string
  platform: string
  screenResolution: string
  timezone: string
  cookiesEnabled: boolean
}

export function generateDeviceFingerprint(deviceInfo: DeviceInfo): string {
  const data = [
    deviceInfo.userAgent,
    deviceInfo.screenResolution,
    deviceInfo.timezone,
    deviceInfo.platform,
    deviceInfo.language
  ].join('|')
  
  // Simple hash function for demo - use proper crypto in production
  let hash = 0
  for (let i = 0; i < data.length; i++) {
    const char = data.charCodeAt(i)
    hash = ((hash << 5) - hash) + char
    hash = hash & hash // Convert to 32bit integer
  }
  return Math.abs(hash).toString(36)
}

export function getDeviceInfo(): DeviceInfo {
  return {
    userAgent: navigator.userAgent,
    language: navigator.language,
    platform: navigator.platform,
    screenResolution: `${screen.width}x${screen.height}`,
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    cookiesEnabled: navigator.cookieEnabled
  }
}

// QR Code Security Types
export interface QRCodePayload {
  userId: string
  timestamp: number
  nonce: string
  mealType: 'kahvalti' | 'ogle'
  validUntil: number
  signature: string
}

export interface SecurityCheck {
  deviceFingerprint: string
  location?: {
    latitude: number
    longitude: number
    accuracy: number
  }
  timestamp: number
  userAgent: string
  ipAddress?: string
}

export interface QRValidationResult {
  valid: boolean
  reason?: string
  user?: User
  mealType?: 'kahvalti' | 'ogle'
  securityFlags?: string[]
}