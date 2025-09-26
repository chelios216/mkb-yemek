import { NextRequest, NextResponse } from 'next/server'
import { getMonthlyCreditSummary } from '@/lib/database'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const userId = searchParams.get('userId')

    if (!userId) {
      return NextResponse.json({
        success: false,
        message: 'Kullanıcı ID gerekli'
      }, { status: 400 })
    }

    const creditSummary = await getMonthlyCreditSummary(userId)

    return NextResponse.json({
      success: true,
      credits: creditSummary
    })

  } catch (error) {
    console.error('Monthly credit summary error:', error)
    return NextResponse.json({
      success: false,
      message: 'Aylık kredi bilgileri alınamadı'
    }, { status: 500 })
  }
}