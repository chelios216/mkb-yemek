import { NextRequest, NextResponse } from 'next/server'
import { mockDb, getCurrentMealType, isMealTime } from '@/lib/database'

// Check meal eligibility
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const fingerprint = searchParams.get('fingerprint')

    if (!fingerprint) {
      return NextResponse.json({
        success: false,
        message: 'Device fingerprint gerekli'
      }, { status: 400 })
    }

    const user = await mockDb.findUserByDevice(fingerprint)
    if (!user) {
      return NextResponse.json({
        success: false,
        message: 'Kullanıcı bulunamadı'
      }, { status: 404 })
    }

    // Check if it's meal time
    if (!isMealTime()) {
      return NextResponse.json({
        success: false,
        canTakeMeal: false,
        reason: 'Yemek saatleri dışında',
        user
      })
    }

    const currentMeal = await getCurrentMealType()
    if (!currentMeal) {
      return NextResponse.json({
        success: false,
        canTakeMeal: false,
        reason: 'Yemek saatleri dışında',
        user
      })
    }

    const canTake = await mockDb.canTakeMeal(user.id, currentMeal)
    const lastMeal = await mockDb.getLastMeal(user.id, currentMeal)

    return NextResponse.json({
      success: true,
      canTakeMeal: canTake,
      user,
      mealType: currentMeal,
      lastMeal,
      reason: canTake ? undefined : `Bugün ${currentMeal === 'kahvalti' ? 'kahvaltı' : 'öğle yemeği'} alınmış`
    })

  } catch (error) {
    console.error('Meal check error:', error)
    return NextResponse.json({
      success: false,
      error: 'Sunucu hatası'
    }, { status: 500 })
  }
}

// Record meal
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { fingerprint, mealType, force = false } = body

    if (!fingerprint || !mealType) {
      return NextResponse.json({
        success: false,
        message: 'Fingerprint ve mealType gerekli'
      }, { status: 400 })
    }

    const user = await mockDb.findUserByDevice(fingerprint)
    if (!user) {
      return NextResponse.json({
        success: false,
        message: 'Kullanıcı bulunamadı'
      }, { status: 404 })
    }

    // Validate meal type
    if (mealType !== 'kahvalti' && mealType !== 'ogle') {
      return NextResponse.json({
        success: false,
        message: 'Geçersiz yemek türü'
      }, { status: 400 })
    }

    // Check meal time (unless forced by admin)
    if (!force && !isMealTime()) {
      return NextResponse.json({
        success: false,
        message: 'Yemek saatleri dışında'
      }, { status: 400 })
    }

    // Check if already taken today (unless forced)
    if (!force) {
      const canTake = await mockDb.canTakeMeal(user.id, mealType)
      if (!canTake) {
        return NextResponse.json({
          success: false,
          message: `Bugün ${mealType === 'kahvalti' ? 'kahvaltı' : 'öğle yemeği'} alınmış`
        }, { status: 400 })
      }
    }

    // Get device registration for logging
    const device = await mockDb.findDeviceByFingerprint(fingerprint)
    
    // Record the meal
    const meal = await mockDb.recordMeal(user.id, mealType, device?.id)

    return NextResponse.json({
      success: true,
      data: {
        meal,
        user,
        message: `${mealType === 'kahvalti' ? 'Kahvaltı' : 'Öğle yemeği'} kaydedildi`
      }
    })

  } catch (error) {
    console.error('Meal record error:', error)
    return NextResponse.json({
      success: false,
      error: 'Sunucu hatası'
    }, { status: 500 })
  }
}