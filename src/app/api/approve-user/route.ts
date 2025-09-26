import { NextRequest, NextResponse } from 'next/server'
import { mockDb } from '@/lib/database'
import jwt from 'jsonwebtoken'

const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-in-production'

export async function POST(request: NextRequest) {
  try {
    // Verify admin authentication
    const authHeader = request.headers.get('authorization')
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ success: false, message: 'Yetkisiz erişim' }, { status: 401 })
    }

    const token = authHeader.substring(7)
    let decodedToken: any

    try {
      decodedToken = jwt.verify(token, JWT_SECRET)
    } catch {
      return NextResponse.json({ success: false, message: 'Geçersiz token' }, { status: 401 })
    }

    // Check if user is admin
    const adminUser = await mockDb.findUserById(decodedToken.userId)
    if (!adminUser || adminUser.role !== 'admin') {
      return NextResponse.json({ success: false, message: 'Admin yetkisi gerekli' }, { status: 403 })
    }

    const { userId, isApproved } = await request.json()

    if (!userId || typeof isApproved !== 'boolean') {
      return NextResponse.json({ 
        success: false, 
        message: 'Kullanıcı ID ve onay durumu gerekli' 
      }, { status: 400 })
    }

    // Update user approval status
    const success = await mockDb.approveUser(userId, isApproved)

    if (!success) {
      return NextResponse.json({ 
        success: false, 
        message: 'Kullanıcı bulunamadı' 
      }, { status: 404 })
    }

    const updatedUser = await mockDb.findUserById(userId)

    return NextResponse.json({ 
      success: true, 
      message: isApproved ? 'Kullanıcı onaylandı' : 'Kullanıcı onayı kaldırıldı',
      user: updatedUser
    })

  } catch (error) {
    console.error('User approval error:', error)
    return NextResponse.json({ 
      success: false, 
      message: 'Sunucu hatası' 
    }, { status: 500 })
  }
}