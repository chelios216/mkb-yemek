import { NextRequest, NextResponse } from 'next/server'
import { mockDb } from '@/lib/database'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const fingerprint = searchParams.get('fingerprint')
    const limit = parseInt(searchParams.get('limit') || '10')

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

    // Get user's meal history
    const mealHistory = await mockDb.getUserMealHistory(user.id)

    // Limit results if requested
    const limitedHistory = mealHistory.slice(0, limit)

    return NextResponse.json({
      success: true,
      data: {
        user,
        meals: limitedHistory
      }
    })

  } catch (error) {
    console.error('Meal history error:', error)
    return NextResponse.json({
      success: false,
      error: 'Sunucu hatası'
    }, { status: 500 })
  }
}