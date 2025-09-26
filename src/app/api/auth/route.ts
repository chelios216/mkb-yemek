import { NextRequest, NextResponse } from 'next/server'
import { mockDb, getOrCreateUserByDevice } from '@/lib/database'
import { getDeviceInfo, generateDeviceFingerprint } from '@/lib/types'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { deviceInfo, userName, department } = body

    // Generate device fingerprint
    const fingerprint = generateDeviceFingerprint(deviceInfo)
    
    // Check if device is already registered
    let device = await mockDb.findDeviceByFingerprint(fingerprint)
    let user = null

    if (device) {
      // Device exists, get user
      user = await mockDb.findUserById(device.userId)
    }

    if (!user && userName && department) {
      // Create new user
      user = await mockDb.createUser({
        name: userName,
        department: department,
        email: `${userName.toLowerCase().replace(' ', '.')}@mkb.com`,
        role: 'personel',
        isActive: true,
        isApproved: false // Yeni kullanıcılar onaysız başlar
      })

      // Register device
      await mockDb.registerDevice(user.id, deviceInfo)
    }

    if (user) {
      return NextResponse.json({
        success: true,
        data: {
          user,
          isNewUser: !device
        }
      })
    }

    return NextResponse.json({
      success: false,
      message: 'Kullanıcı bilgileri gerekli'
    }, { status: 400 })

  } catch (error) {
    console.error('Auth error:', error)
    return NextResponse.json({
      success: false,
      error: 'Sunucu hatası'
    }, { status: 500 })
  }
}

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

    if (user) {
      return NextResponse.json({
        success: true,
        data: { user }
      })
    }

    return NextResponse.json({
      success: false,
      message: 'Kullanıcı bulunamadı'
    }, { status: 404 })

  } catch (error) {
    console.error('Auth check error:', error)
    return NextResponse.json({
      success: false,
      error: 'Sunucu hatası'
    }, { status: 500 })
  }
}