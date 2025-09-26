import { NextRequest, NextResponse } from 'next/server'
import { mockDb } from '@/lib/database'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { userId, deviceInfo, fingerprint } = body

    if (!userId || !fingerprint) {
      return NextResponse.json({
        success: false,
        message: 'User ID ve device fingerprint gerekli'
      }, { status: 400 })
    }

    // Check if user exists and is active
    const user = await mockDb.findUserById(userId)
    if (!user || !user.isActive) {
      return NextResponse.json({
        success: false,
        message: 'Geçersiz kullanıcı'
      }, { status: 400 })
    }

    // Check if device is already registered to another user
    const existingDevice = await mockDb.findDeviceByFingerprint(fingerprint)
    if (existingDevice && existingDevice.userId !== userId) {
      return NextResponse.json({
        success: false,
        message: 'Bu telefon başka bir kullanıcıya kayıtlı'
      }, { status: 400 })
    }

    // Register device
    const deviceRegistration = await mockDb.registerDevice(userId, deviceInfo)

    return NextResponse.json({
      success: true,
      message: 'Telefon başarıyla kaydedildi',
      user: {
        id: user.id,
        name: user.name,
        department: user.department
      }
    })

  } catch (error) {
    console.error('Device register error:', error)
    return NextResponse.json({
      success: false,
      message: 'Sunucu hatası'
    }, { status: 500 })
  }
}