import { NextRequest, NextResponse } from 'next/server'
import jwt from 'jsonwebtoken'
import { mockDb } from '@/lib/database'

export async function GET(request: NextRequest) {
  try {
    // Get auth token from cookies
    const token = request.cookies.get('auth-token')?.value
    
    if (!token) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 })
    }

    // Verify JWT token
    let decoded: any
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key')
    } catch (error) {
      return NextResponse.json({ success: false, message: 'Invalid token' }, { status: 401 })
    }

    const userId = decoded.userId
    const user = await mockDb.findUserById(userId)
    
    if (!user) {
      return NextResponse.json({ success: false, message: 'User not found' }, { status: 404 })
    }

    // Get month parameter (format: YYYY-M)
    const { searchParams } = new URL(request.url)
    const monthParam = searchParams.get('month')
    
    if (!monthParam) {
      return NextResponse.json({ 
        success: false, 
        message: 'Month parameter is required (format: YYYY-M)' 
      }, { status: 400 })
    }

    const [year, month] = monthParam.split('-').map(Number)
    
    if (!year || !month || month < 1 || month > 12) {
      return NextResponse.json({ 
        success: false, 
        message: 'Invalid month format' 
      }, { status: 400 })
    }

    // Get meal records for the specified month
    const mealRecords = mockDb.getMealRecordsByUserAndMonth(userId, year, month - 1) // month-1 because JS months are 0-indexed
    
    // Calculate monthly statistics
    const kahvaltiCount = mealRecords.filter(record => record.mealType === 'kahvalti').length
    const ogleCount = mealRecords.filter(record => record.mealType === 'ogle').length
    const totalMeals = mealRecords.length

    // Calculate working days for the month (assuming 22 working days per month)
    const workingDays = 22
    const maxPossibleMeals = workingDays * 2 // breakfast + lunch
    const attendanceRate = maxPossibleMeals > 0 ? Math.round((totalMeals / maxPossibleMeals) * 100) : 0

    const monthlyStats = {
      totalMeals,
      kahvaltiCount,
      ogleCount,
      workingDays,
      attendanceRate
    }

    // Format records for frontend
    const formattedRecords = mealRecords.map(record => ({
      id: record.id,
      date: record.timestamp.toISOString().split('T')[0], // YYYY-MM-DD format
      type: record.mealType,
      timestamp: record.timestamp.toISOString()
    }))

    return NextResponse.json({
      success: true,
      records: formattedRecords,
      stats: monthlyStats
    })

  } catch (error) {
    console.error('Schedule API error:', error)
    return NextResponse.json({ 
      success: false, 
      message: 'Internal server error' 
    }, { status: 500 })
  }
}