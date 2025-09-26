import { NextRequest, NextResponse } from 'next/server'
import { mockDb, getCurrentMealType, getMonthlyCreditSummary } from '@/lib/database'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { userId, mealType, deviceFingerprint } = body

    if (!userId || !mealType || !deviceFingerprint) {
      return NextResponse.json({
        success: false,
        message: 'Gerekli bilgiler eksik'
      }, { status: 400 })
    }

    // Verify device is registered to this user
    const device = await mockDb.findDeviceByFingerprint(deviceFingerprint)
    if (!device || device.userId !== userId || !device.isActive) {
      return NextResponse.json({
        success: false,
        message: 'Yetkisiz cihaz'
      }, { status: 403 })
    }

    // Check if user exists and is active
    const user = await mockDb.findUserById(userId)
    if (!user || !user.isActive) {
      return NextResponse.json({
        success: false,
        message: 'Kullanıcı bulunamadı'
      }, { status: 404 })
    }

    // Check if user is approved by admin
    if (!user.isApproved) {
      return NextResponse.json({
        success: false,
        message: 'Henüz yönetici tarafından onaylanmadınız. Lütfen önce yöneticiden onay alın.'
      }, { status: 403 })
    }

    // Check if it's meal time
    const currentMealType = await getCurrentMealType()
    if (!currentMealType) {
      return NextResponse.json({
        success: false,
        message: 'Yemek saati dışında'
      }, { status: 400 })
    }

    // Check if requested meal type matches current time
    if (currentMealType !== mealType) {
      return NextResponse.json({
        success: false,
        message: `Şu anda ${currentMealType === 'kahvalti' ? 'kahvaltı' : 'öğle'} saati`
      }, { status: 400 })
    }

    // Check if user can take this meal (not already taken today)
    const canTake = await mockDb.canTakeMeal(userId, mealType)
    if (!canTake) {
      return NextResponse.json({
        success: false,
        message: 'Bu öğün için bugün zaten yemek alınmış'
      }, { status: 400 })
    }

    // Check monthly quota limits
    const creditSummary = await getMonthlyCreditSummary(userId)
    const mealTypeKey = mealType === 'kahvalti' ? 'breakfast' : 'lunch'
    const remainingCredits = mealType === 'kahvalti' ? creditSummary.breakfastRemaining : creditSummary.lunchRemaining
    
    if (remainingCredits <= 0) {
      return NextResponse.json({
        success: false,
        message: `Bu ay ${mealType === 'kahvalti' ? 'kahvaltı' : 'öğle yemeği'} krediniz kalmamış`
      }, { status: 400 })
    }

    // Rate limiting - check recent meal attempts
    const recentScans = mockDb.getRecentScans(deviceFingerprint, 5 * 60 * 1000) // 5 minutes
    if (recentScans.length > 5) {
      return NextResponse.json({
        success: false,
        message: 'Çok fazla deneme, lütfen bekleyin'
      }, { status: 429 })
    }

    // Record the meal
    const meal = await mockDb.recordMeal(userId, mealType, deviceFingerprint)

    // Record scan attempt
    mockDb.recordScanAttempt({
      deviceFingerprint,
      timestamp: Date.now(),
      userAgent: request.headers.get('user-agent') || 'Unknown'
    }, true)

    return NextResponse.json({
      success: true,
      message: `${mealType === 'kahvalti' ? 'Kahvaltı' : 'Öğle yemeği'} başarıyla alındı!`,
      user: {
        id: user.id,
        name: user.name,
        department: user.department
      },
      meal
    })

  } catch (error) {
    console.error('Take meal error:', error)
    return NextResponse.json({
      success: false,
      message: 'Sunucu hatası'
    }, { status: 500 })
  }
}