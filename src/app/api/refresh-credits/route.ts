import { NextRequest, NextResponse } from 'next/server'
import { refreshAllUserCredits } from '@/lib/database'

export async function POST(request: NextRequest) {
  try {
    // Admin token kontrolü
    const authHeader = request.headers.get('authorization')
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({
        success: false,
        message: 'Yetkilendirme gerekli'
      }, { status: 401 })
    }

    const body = await request.json()
    const { year, month } = body // Opsiyonel, belirtilmezse current month

    // Tüm kullanıcıların kredilerini yenile
    await refreshAllUserCredits(year, month)

    return NextResponse.json({
      success: true,
      message: 'Tüm kullanıcı kredileri yenilendi'
    })

  } catch (error) {
    console.error('Refresh credits error:', error)
    return NextResponse.json({
      success: false,
      message: 'Kredi yenileme hatası'
    }, { status: 500 })
  }
}