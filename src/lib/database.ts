import { v4 as uuidv4 } from 'uuid'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { 
  User, 
  MealRecord, 
  DeviceRegistration, 
  SystemSettings,
  WorkScheduleSettings,
  UserMealCredits,
  MonthlyCreditSummary,
  DeviceInfo,
  generateDeviceFingerprint,
  getDeviceInfo,
  UserRole,
  LoginCredentials,
  AuthResponse,
  QRCodePayload,
  SecurityCheck,
  QRValidationResult
} from './types'

const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-in-production'

// Global type declaration for development persistence
declare global {
  var __mockDb: MockDatabase | undefined
}

// Mock Database - Gerçek uygulamada PostgreSQL kullanılacak
class MockDatabase {
  private users: User[] = [
    {
      id: 'user-admin',
      name: 'Sistem Admin',
      department: 'IT Departmanı',
      email: 'admin@mkb.com',
      role: 'admin',
      isActive: true,
      isApproved: true, // Admin daima onaylı
      createdAt: new Date('2024-01-01'),
      updatedAt: new Date('2024-01-01')
    },
    {
      id: 'user-test1',
      name: 'Test Kullanıcı 1',
      department: 'Test Departmanı',
      email: 'test1@mkb.com',
      role: 'personel',
      isActive: true,
      isApproved: true,
      createdAt: new Date('2024-01-01'),
      updatedAt: new Date('2024-01-01')
    },
    {
      id: 'user-test2', 
      name: 'Test Kullanıcı 2',
      department: 'Test Departmanı',
      email: 'test2@mkb.com',
      role: 'personel',
      isActive: true,
      isApproved: true,
      createdAt: new Date('2024-01-01'),
      updatedAt: new Date('2024-01-01')
    }
  ]

  // Şifreler (production için güvenli bcrypt hash'i)
  private passwords: Record<string, string> = {
    'admin@mkb.com': bcrypt.hashSync('admin123', 10),
    'test1@mkb.com': bcrypt.hashSync('test123', 10),
    'test2@mkb.com': bcrypt.hashSync('test123', 10)
  }

  private devices: DeviceRegistration[] = []
  
  // Sistem ayarları
  private systemSettings: SystemSettings[] = [
    {
      id: 'setting-work-schedule',
      key: 'work-schedule',
      value: JSON.stringify({
        workDays: [1, 2, 3, 4, 5, 6], // Pazartesi-Cumartesi (Pazar tatil)
        breakfastStart: '07:00',
        breakfastEnd: '10:30',
        lunchStart: '11:30', 
        lunchEnd: '14:30',
        monthlyBreakfastLimit: 22,
        monthlyLunchLimit: 22
      } as WorkScheduleSettings),
      description: 'Çalışma günleri ve yemek saatleri ayarları',
      updatedAt: new Date()
    }
  ]
  
  private mealRecords: MealRecord[] = []
  private settings: SystemSettings[] = [
    {
      id: 'settings-001',
      key: 'breakfast_start',
      value: '07:00',
      description: 'Kahvaltı başlangıç saati',
      updatedAt: new Date()
    },
    {
      id: 'settings-002',
      key: 'breakfast_end',
      value: '10:30',
      description: 'Kahvaltı bitiş saati',
      updatedAt: new Date()
    },
    {
      id: 'settings-003',
      key: 'lunch_start',
      value: '11:30',
      description: 'Öğle yemeği başlangıç saati',
      updatedAt: new Date()
    },
    {
      id: 'settings-004',
      key: 'lunch_end',
      value: '14:30',
      description: 'Öğle yemeği bitiş saati',
      updatedAt: new Date()
    }
  ]

  // User meal credits storage
  private userCredits: UserMealCredits[] = []

  // Authentication methods
  async authenticateUser(credentials: LoginCredentials): Promise<AuthResponse> {
    try {
      const user = this.users.find(u => u.email === credentials.email && u.isActive)
      
      if (!user) {
        return {
          success: false,
          message: 'Geçersiz email veya şifre'
        }
      }

      const hashedPassword = this.passwords[credentials.email]
      if (!hashedPassword) {
        return {
          success: false,
          message: 'Geçersiz email veya şifre'
        }
      }

      const isValidPassword = await bcrypt.compare(credentials.password, hashedPassword)
      
      if (!isValidPassword) {
        return {
          success: false,
          message: 'Geçersiz email veya şifre'
        }
      }

      // Generate JWT token
      const token = jwt.sign(
        { 
          userId: user.id, 
          email: user.email, 
          role: user.role 
        },
        JWT_SECRET,
        { expiresIn: '24h' }
      )

      return {
        success: true,
        user: {
          ...user,
          // Don't send sensitive data
        },
        token,
        message: 'Giriş başarılı'
      }

    } catch (error) {
      console.error('Authentication error:', error)
      return {
        success: false,
        message: 'Sunucu hatası'
      }
    }
  }

  async verifyToken(token: string): Promise<{ valid: boolean; user?: User; role?: UserRole }> {
    try {
      const decoded = jwt.verify(token, JWT_SECRET) as any
      const user = await this.findUserById(decoded.userId)
      
      if (!user || !user.isActive) {
        return { valid: false }
      }

      return {
        valid: true,
        user,
        role: user.role
      }
    } catch (error) {
      return { valid: false }
    }
  }

  async findUserByEmail(email: string): Promise<User | null> {
    return this.users.find(user => user.email === email && user.isActive) || null
  }

  // User methods
  async findUserById(id: string): Promise<User | null> {
    return this.users.find(user => user.id === id) || null
  }

  async findUserByDevice(deviceFingerprint: string): Promise<User | null> {
    const device = this.devices.find(d => d.deviceFingerprint === deviceFingerprint && d.isActive)
    if (device) {
      return this.findUserById(device.userId)
    }
    return null
  }

  async createUser(userData: Omit<User, 'id' | 'createdAt' | 'updatedAt'>): Promise<User> {
    const user: User = {
      ...userData,
      id: uuidv4(),
      isApproved: userData.role === 'admin' ? true : false, // Admin daima onaylı, personel onaysız başlar
      createdAt: new Date(),
      updatedAt: new Date()
    }
    this.users.push(user)
    return user
  }

  // Device methods
  async registerDevice(userId: string, deviceInfo: DeviceInfo): Promise<DeviceRegistration> {
    const fingerprint = generateDeviceFingerprint(deviceInfo)
    
    // Deactivate old device registrations for this user
    this.devices
      .filter(d => d.userId === userId)
      .forEach(d => d.isActive = false)

    const device: DeviceRegistration = {
      id: uuidv4(),
      userId,
      deviceFingerprint: fingerprint,
      deviceInfo: {
        userAgent: deviceInfo.userAgent,
        screenResolution: deviceInfo.screenResolution,
        timezone: deviceInfo.timezone
      },
      isActive: true,
      createdAt: new Date(),
      lastUsed: new Date()
    }

    this.devices.push(device)
    return device
  }

  async findDeviceByFingerprint(fingerprint: string): Promise<DeviceRegistration | null> {
    const device = this.devices.find(d => d.deviceFingerprint === fingerprint && d.isActive)
    if (device) {
      device.lastUsed = new Date()
    }
    return device || null
  }

  // Meal methods
  async getTodayMeals(userId: string): Promise<MealRecord[]> {
    const today = new Date().toISOString().split('T')[0]
    return this.mealRecords.filter(
      record => record.userId === userId && record.date === today
    )
  }

  async getLastMeal(userId: string, mealType: 'kahvalti' | 'ogle'): Promise<MealRecord | null> {
    const userMeals = this.mealRecords
      .filter(record => record.userId === userId && record.mealType === mealType)
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
    
    return userMeals[0] || null
  }

  async canTakeMeal(userId: string, mealType: 'kahvalti' | 'ogle'): Promise<boolean> {
    const today = new Date().toISOString().split('T')[0]
    const todayMeals = await this.getTodayMeals(userId)
    
    // Check if already taken today
    const alreadyTaken = todayMeals.some(meal => meal.mealType === mealType)
    return !alreadyTaken
  }

  async recordMeal(userId: string, mealType: 'kahvalti' | 'ogle', deviceId?: string): Promise<MealRecord> {
    const meal: MealRecord = {
      id: uuidv4(),
      userId,
      mealType,
      date: new Date().toISOString().split('T')[0],
      timestamp: new Date(),
      deviceId
    }

    this.mealRecords.push(meal)
    return meal
  }

  // Statistics methods
  async getDashboardStats() {
    const today = new Date().toISOString().split('T')[0]
    const thisMonth = new Date().toISOString().substring(0, 7) // YYYY-MM

    const todayMeals = this.mealRecords.filter(meal => meal.date === today)
    const monthlyMeals = this.mealRecords.filter(meal => meal.date.startsWith(thisMonth))

    const recentMeals = this.mealRecords
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, 10)

    return {
      todayBreakfast: todayMeals.filter(m => m.mealType === 'kahvalti').length,
      todayLunch: todayMeals.filter(m => m.mealType === 'ogle').length,
      monthlyBreakfast: monthlyMeals.filter(m => m.mealType === 'kahvalti').length,
      monthlyLunch: monthlyMeals.filter(m => m.mealType === 'ogle').length,
      totalUsers: this.users.length,
      activeUsers: this.users.filter(u => u.isActive).length,
      recentActivities: recentMeals
    }
  }

  async getUserMealHistory(userId: string, month?: string) {
    let meals = this.mealRecords.filter(meal => meal.userId === userId)
    
    if (month) {
      meals = meals.filter(meal => meal.date.startsWith(month))
    }

    return meals.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
  }

  // Get meal records by user and month
  getMealRecordsByUserAndMonth(userId: string, year: number, month: number) {
    return this.mealRecords.filter(record => {
      const recordDate = new Date(record.timestamp)
      return record.userId === userId && 
             recordDate.getFullYear() === year && 
             recordDate.getMonth() === month
    })
  }

  // Get monthly meal counts for user
  async getMonthlyMealCounts(userId: string, year?: number, month?: number): Promise<{
    breakfast: number
    lunch: number
    remaining: {
      breakfast: number
      lunch: number
    }
  }> {
    const now = new Date()
    const targetYear = year || now.getFullYear()
    const targetMonth = month !== undefined ? month : now.getMonth()

    const records = this.getMealRecordsByUserAndMonth(userId, targetYear, targetMonth)
    const breakfastCount = records.filter(r => r.mealType === 'kahvalti').length
    const lunchCount = records.filter(r => r.mealType === 'ogle').length

    const schedule = await this.getWorkScheduleSettings()
    
    return {
      breakfast: breakfastCount,
      lunch: lunchCount,
      remaining: {
        breakfast: Math.max(0, schedule.monthlyBreakfastLimit - breakfastCount),
        lunch: Math.max(0, schedule.monthlyLunchLimit - lunchCount)
      }
    }
  }

  // Credit management methods
  // Bir aydaki toplam çalışma günü sayısını hesapla
  private calculateWorkDaysInMonth(year: number, month: number, workDays: number[]): number {
    const daysInMonth = new Date(year, month + 1, 0).getDate()
    let workDayCount = 0
    
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(year, month, day)
      const dayOfWeek = date.getDay() // 0=Sunday, 1=Monday, etc.
      
      if (workDays.includes(dayOfWeek)) {
        workDayCount++
      }
    }
    
    return workDayCount
  }

  // Kullanıcının aylık kredilerini al veya oluştur
  async getUserMealCredits(userId: string, year?: number, month?: number): Promise<UserMealCredits> {
    const now = new Date()
    const targetYear = year !== undefined ? year : now.getFullYear()
    const targetMonth = month !== undefined ? month : now.getMonth()

    // Mevcut krediyi ara
    let userCredit = this.userCredits.find(c => 
      c.userId === userId && c.year === targetYear && c.month === targetMonth
    )

    // Yoksa oluştur
    if (!userCredit) {
      const workSchedule = await this.getWorkScheduleSettings()
      const totalWorkDays = this.calculateWorkDaysInMonth(targetYear, targetMonth, workSchedule.workDays)
      
      userCredit = {
        id: uuidv4(),
        userId,
        year: targetYear,
        month: targetMonth,
        totalWorkDays,
        breakfastCredits: totalWorkDays, // Her çalışma günü 1 kahvaltı kredisi
        lunchCredits: totalWorkDays, // Her çalışma günü 1 öğle kredisi
        breakfastUsed: 0,
        lunchUsed: 0,
        createdAt: now,
        updatedAt: now
      }
      
      this.userCredits.push(userCredit)
    }

    // Kullanım sayısını gerçek verilerden güncelle
    const records = this.getMealRecordsByUserAndMonth(userId, targetYear, targetMonth)
    userCredit.breakfastUsed = records.filter(r => r.mealType === 'kahvalti').length
    userCredit.lunchUsed = records.filter(r => r.mealType === 'ogle').length
    userCredit.updatedAt = now

    return userCredit
  }

  // Aylık kredi özetini al
  async getMonthlyCreditSummary(userId: string, year?: number, month?: number): Promise<MonthlyCreditSummary> {
    const credits = await this.getUserMealCredits(userId, year, month)
    
    return {
      totalWorkDays: credits.totalWorkDays,
      breakfastCredits: credits.breakfastCredits,
      lunchCredits: credits.lunchCredits,
      breakfastUsed: credits.breakfastUsed,
      lunchUsed: credits.lunchUsed,
      breakfastRemaining: Math.max(0, credits.breakfastCredits - credits.breakfastUsed),
      lunchRemaining: Math.max(0, credits.lunchCredits - credits.lunchUsed)
    }
  }

  // Tüm kullanıcıların kredilerini yenile (cron job için)
  async refreshAllUserCredits(year?: number, month?: number): Promise<void> {
    const now = new Date()
    const targetYear = year !== undefined ? year : now.getFullYear()
    const targetMonth = month !== undefined ? month : now.getMonth()

    for (const user of this.users) {
      if (user.isActive && user.isApproved) {
        await this.getUserMealCredits(user.id, targetYear, targetMonth)
      }
    }
  }

  // Settings methods
  async getSetting(key: string): Promise<string | null> {
    const setting = this.settings.find(s => s.key === key)
    return setting?.value || null
  }

  async getAllUsers(): Promise<User[]> {
    return [...this.users]
  }

  // QR Code Generation and Validation
  generateQRCodePayload(userId: string, mealType: 'kahvalti' | 'ogle'): string {
    const now = Date.now()
    const payload: QRCodePayload = {
      userId,
      timestamp: now,
      nonce: uuidv4(),
      mealType,
      validUntil: now + (30 * 60 * 1000), // 30 minutes validity
      signature: ''
    }

    // Create signature using HMAC-like approach
    const dataToSign = `${payload.userId}:${payload.timestamp}:${payload.nonce}:${payload.mealType}:${payload.validUntil}`
    const signature = jwt.sign(dataToSign, JWT_SECRET + 'qr-salt')
    payload.signature = signature

    // Encode as Base64
    return Buffer.from(JSON.stringify(payload)).toString('base64')
  }

  async validateQRCodePayload(qrData: string, securityCheck: SecurityCheck): Promise<QRValidationResult> {
    try {
      // Decode Base64
      const decoded = Buffer.from(qrData, 'base64').toString('utf-8')
      const payload: QRCodePayload = JSON.parse(decoded)

      const securityFlags: string[] = []

      // 1. Check if QR code is expired
      if (Date.now() > payload.validUntil) {
        return {
          valid: false,
          reason: 'QR kod süresi dolmuş',
          securityFlags: ['EXPIRED']
        }
      }

      // 2. Verify signature
      const dataToSign = `${payload.userId}:${payload.timestamp}:${payload.nonce}:${payload.mealType}:${payload.validUntil}`
      try {
        jwt.verify(payload.signature, JWT_SECRET + 'qr-salt')
      } catch (e) {
        return {
          valid: false,
          reason: 'QR kod imzası geçersiz',
          securityFlags: ['INVALID_SIGNATURE']
        }
      }

      // 3. Check if user exists and is active
      const user = await this.findUserById(payload.userId)
      if (!user || !user.isActive) {
        return {
          valid: false,
          reason: 'Kullanıcı bulunamadı veya pasif',
          securityFlags: ['USER_NOT_FOUND']
        }
      }

      // 4. Check meal time validity
      const currentMealType = await getCurrentMealType()
      if (currentMealType !== payload.mealType) {
        securityFlags.push('WRONG_MEAL_TIME')
        if (!currentMealType) {
          return {
            valid: false,
            reason: 'Yemek saati dışında',
            securityFlags
          }
        }
      }

      // 5. Check if meal already taken today
      const canTake = await this.canTakeMeal(payload.userId, payload.mealType)
      if (!canTake) {
        return {
          valid: false,
          reason: 'Bu öğün için bugün zaten yemek alınmış',
          securityFlags: [...securityFlags, 'ALREADY_TAKEN']
        }
      }

      // 6. Rate limiting - check recent scans
      const recentScans = this.getRecentScans(securityCheck.deviceFingerprint, 5 * 60 * 1000) // 5 minutes
      if (recentScans.length > 10) {
        securityFlags.push('RATE_LIMITED')
        return {
          valid: false,
          reason: 'Çok fazla deneme, lütfen bekleyin',
          securityFlags
        }
      }

      // 7. Device fingerprinting security check
      this.recordScanAttempt(securityCheck)

      return {
        valid: true,
        user,
        mealType: payload.mealType,
        securityFlags
      }

    } catch (error) {
      console.error('QR validation error:', error)
      return {
        valid: false,
        reason: 'QR kod formatı geçersiz',
        securityFlags: ['INVALID_FORMAT']
      }
    }
  }

  // Security tracking
  private scanAttempts: Array<{
    deviceFingerprint: string
    timestamp: number
    success: boolean
    ipAddress?: string
  }> = []

  recordScanAttempt(securityCheck: SecurityCheck, success: boolean = true) {
    this.scanAttempts.push({
      deviceFingerprint: securityCheck.deviceFingerprint,
      timestamp: securityCheck.timestamp,
      success,
      ipAddress: securityCheck.ipAddress
    })

    // Clean old attempts (keep last 24 hours)
    const dayAgo = Date.now() - (24 * 60 * 60 * 1000)
    this.scanAttempts = this.scanAttempts.filter(attempt => attempt.timestamp > dayAgo)
  }

  getRecentScans(deviceFingerprint: string, timeWindow: number) {
    const cutoff = Date.now() - timeWindow
    return this.scanAttempts.filter(
      attempt => attempt.deviceFingerprint === deviceFingerprint && attempt.timestamp > cutoff
    )
  }

  // Admin user management
  async createUserByAdmin(userData: Omit<User, 'id' | 'createdAt' | 'updatedAt'>, password: string): Promise<User> {
    const user = await this.createUser(userData)
    
    // Store password hash
    if (user.email) {
      this.passwords[user.email] = await bcrypt.hash(password, 10)
    }
    
    return user
  }

  async updateUser(id: string, updates: Partial<User>): Promise<User | null> {
    const userIndex = this.users.findIndex(u => u.id === id)
    if (userIndex === -1) return null

    this.users[userIndex] = {
      ...this.users[userIndex],
      ...updates,
      updatedAt: new Date()
    }

    return this.users[userIndex]
  }

  async deleteUser(id: string): Promise<boolean> {
    const userIndex = this.users.findIndex(u => u.id === id)
    if (userIndex === -1) return false

    // Soft delete - mark as inactive
    this.users[userIndex].isActive = false
    this.users[userIndex].updatedAt = new Date()
    
    return true
  }

  // Approve/Unapprove user (for QR-based system)
  async approveUser(id: string, isApproved: boolean): Promise<boolean> {
    const userIndex = this.users.findIndex(u => u.id === id)
    if (userIndex === -1) return false

    this.users[userIndex].isApproved = isApproved
    this.users[userIndex].updatedAt = new Date()
    
    return true
  }

  // System Settings Methods
  async getSystemSetting(key: string): Promise<SystemSettings | null> {
    return this.systemSettings.find(s => s.key === key) || null
  }

  async updateSystemSetting(key: string, value: string): Promise<boolean> {
    const settingIndex = this.systemSettings.findIndex(s => s.key === key)
    if (settingIndex === -1) {
      // Create new setting
      this.systemSettings.push({
        id: uuidv4(),
        key,
        value,
        updatedAt: new Date()
      })
    } else {
      // Update existing
      this.systemSettings[settingIndex].value = value
      this.systemSettings[settingIndex].updatedAt = new Date()
    }
    return true
  }

  async getWorkScheduleSettings(): Promise<WorkScheduleSettings> {
    const setting = await this.getSystemSetting('work-schedule')
    if (setting) {
      return JSON.parse(setting.value) as WorkScheduleSettings
    }
    // Varsayılan değerler
    return {
      workDays: [1, 2, 3, 4, 5, 6],
      breakfastStart: '07:00',
      breakfastEnd: '10:30',
      lunchStart: '11:30',
      lunchEnd: '14:30',
      monthlyBreakfastLimit: 22,
      monthlyLunchLimit: 22
    }
  }

  async updateWorkScheduleSettings(settings: WorkScheduleSettings): Promise<boolean> {
    return await this.updateSystemSetting('work-schedule', JSON.stringify(settings))
  }
}

// Global singleton instance to persist data across hot reloads in development
declare global {
  var __mockDb: MockDatabase | undefined
}

// Singleton instance - persists across hot reloads in development
export const mockDb = globalThis.__mockDb || new MockDatabase()

if (process.env.NODE_ENV === 'development') {
  globalThis.__mockDb = mockDb
}

// Export specific methods for easier access
export const getMonthlyMealCounts = (userId: string, year?: number, month?: number) => 
  mockDb.getMonthlyMealCounts(userId, year, month)

export const getMonthlyCreditSummary = (userId: string, year?: number, month?: number) =>
  mockDb.getMonthlyCreditSummary(userId, year, month)

export const refreshAllUserCredits = (year?: number, month?: number) =>
  mockDb.refreshAllUserCredits(year, month)

// Utility functions
export async function getCurrentMealType(): Promise<'kahvalti' | 'ogle' | null> {
  const now = new Date()
  const currentDay = now.getDay() // 0=Pazar, 1=Pazartesi, ...
  
  // Çalışma günü kontrolü
  const schedule = await mockDb.getWorkScheduleSettings()
  if (!schedule.workDays.includes(currentDay)) {
    return null // Tatil günü
  }

  const hour = now.getHours()
  const minute = now.getMinutes()
  const currentTime = hour * 100 + minute

  // Saat formatını dönüştür (07:30 -> 730)
  const breakfastStart = timeStringToNumber(schedule.breakfastStart)
  const breakfastEnd = timeStringToNumber(schedule.breakfastEnd)
  const lunchStart = timeStringToNumber(schedule.lunchStart)
  const lunchEnd = timeStringToNumber(schedule.lunchEnd)

  if (currentTime >= breakfastStart && currentTime <= breakfastEnd) {
    return 'kahvalti'
  } else if (currentTime >= lunchStart && currentTime <= lunchEnd) {
    return 'ogle'
  }
  
  return null
}

export async function isMealTime(): Promise<boolean> {
  return (await getCurrentMealType()) !== null
}

// Yardımcı fonksiyonlar
function timeStringToNumber(timeStr: string): number {
  const [hour, minute] = timeStr.split(':').map(Number)
  return hour * 100 + minute
}

export function timeNumberToString(timeNum: number): string {
  const hour = Math.floor(timeNum / 100)
  const minute = timeNum % 100
  return `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`
}

export async function getOrCreateUserByDevice(): Promise<User | null> {
  if (typeof window === 'undefined') return null
  
  try {
    const deviceInfo = getDeviceInfo()
    const fingerprint = generateDeviceFingerprint(deviceInfo)
    
    // Try to find existing user by device
    let user = await mockDb.findUserByDevice(fingerprint)
    
    if (!user) {
      // Check if device registration exists but user doesn't
      const device = await mockDb.findDeviceByFingerprint(fingerprint)
      if (device) {
        user = await mockDb.findUserById(device.userId)
      }
    }
    
    return user
  } catch (error) {
    console.error('Device user lookup error:', error)
    return null
  }
}