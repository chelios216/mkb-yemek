import { NextRequest, NextResponse } from 'next/server'
import { mockDb } from '@/lib/database'
import { generateDeviceFingerprint } from '@/lib/types'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { qrData, deviceInfo, location } = body

    if (!qrData) {
      return NextResponse.json({ 
        success: false, 
        message: 'QR kod verisi gerekli' 
      }, { status: 400 })
    }

    // Get client IP address
    const forwarded = request.headers.get('x-forwarded-for')
    const ip = forwarded ? forwarded.split(',')[0] : request.headers.get('x-real-ip')

    // Create security check object
    const securityCheck = {
      deviceFingerprint: generateDeviceFingerprint(deviceInfo || {}),
      location,
      timestamp: Date.now(),
      userAgent: request.headers.get('user-agent') || 'Unknown',
      ipAddress: ip || undefined
    }

    // Validate QR code
    const validationResult = await mockDb.validateQRCodePayload(qrData, securityCheck)

    if (!validationResult.valid) {
      // Record failed attempt
      mockDb.recordScanAttempt(securityCheck, false)
      
      return NextResponse.json({
        success: false,
        message: validationResult.reason,
        securityFlags: validationResult.securityFlags
      }, { status: 400 })
    }

    // Record successful meal
    const meal = await mockDb.recordMeal(
      validationResult.user!.id, 
      validationResult.mealType!, 
      securityCheck.deviceFingerprint
    )

    // Record successful scan
    mockDb.recordScanAttempt(securityCheck, true)

    return NextResponse.json({
      success: true,
      data: {
        meal,
        user: {
          id: validationResult.user!.id,
          name: validationResult.user!.name,
          department: validationResult.user!.department
        },
        mealType: validationResult.mealType,
        timestamp: new Date().toISOString()
      },
      message: `${validationResult.mealType === 'kahvalti' ? 'Kahvaltı' : 'Öğle yemeği'} başarıyla kaydedildi`,
      securityFlags: validationResult.securityFlags
    })

  } catch (error) {
    console.error('QR validation error:', error)
    return NextResponse.json({ 
      success: false, 
      message: 'Sunucu hatası' 
    }, { status: 500 })
  }
}

// GET endpoint for security statistics (admin only)
export async function GET(request: NextRequest) {
  try {
    // For now, return basic stats - in real app, check admin auth
    const recentScans = mockDb.getRecentScans('', 24 * 60 * 60 * 1000) // Last 24 hours
    
    return NextResponse.json({
      success: true,
      data: {
        totalScansToday: recentScans.length,
        successfulScans: recentScans.filter(s => s.success).length,
        failedScans: recentScans.filter(s => !s.success).length,
        recentActivity: recentScans.slice(0, 20)
      }
    })

  } catch (error) {
    console.error('QR stats error:', error)
    return NextResponse.json({ 
      success: false, 
      message: 'Sunucu hatası' 
    }, { status: 500 })
  }
}