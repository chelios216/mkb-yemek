import { NextRequest, NextResponse } from 'next/server'
import { mockDb } from '@/lib/database'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const fingerprint = searchParams.get('fingerprint')
    
    if (!fingerprint) {
      return NextResponse.json({
        success: false,
        message: 'Device fingerprint gerekli'
      }, { status: 400 })
    }

    // Check if device is registered
    const device = await mockDb.findDeviceByFingerprint(fingerprint)
    
    if (device && device.isActive) {
      const user = await mockDb.findUserById(device.userId)
      
      if (user && user.isActive) {
        return NextResponse.json({
          success: true,
          isRegistered: true,
          user: {
            id: user.id,
            name: user.name,
            department: user.department
          }
        })
      }
    }

    return NextResponse.json({
      success: true,
      isRegistered: false
    })

  } catch (error) {
    console.error('Device check error:', error)
    return NextResponse.json({
      success: false,
      message: 'Sunucu hatası'
    }, { status: 500 })
  }
}