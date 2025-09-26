import { NextRequest, NextResponse } from 'next/server'
import { mockDb } from '@/lib/database'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email, password } = body

    if (!email || !password) {
      return NextResponse.json({
        success: false,
        message: 'Email ve şifre gerekli'
      }, { status: 400 })
    }

    const authResult = await mockDb.authenticateUser({ email, password })

    if (authResult.success) {
      const response = NextResponse.json({
        success: true,
        data: {
          user: authResult.user,
          message: authResult.message
        }
      })

      // Set HTTP-only cookie for security
      response.cookies.set('auth-token', authResult.token!, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 24 * 60 * 60 * 1000, // 24 hours
        path: '/'
      })

      return response
    } else {
      return NextResponse.json({
        success: false,
        message: authResult.message
      }, { status: 401 })
    }

  } catch (error) {
    console.error('Login error:', error)
    return NextResponse.json({
      success: false,
      message: 'Sunucu hatası'
    }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  try {
    const token = request.cookies.get('auth-token')?.value

    if (!token) {
      return NextResponse.json({
        success: false,
        message: 'Token bulunamadı'
      }, { status: 401 })
    }

    const verification = await mockDb.verifyToken(token)

    if (verification.valid) {
      return NextResponse.json({
        success: true,
        data: {
          user: verification.user,
          role: verification.role
        }
      })
    } else {
      return NextResponse.json({
        success: false,
        message: 'Geçersiz token'
      }, { status: 401 })
    }

  } catch (error) {
    console.error('Token verification error:', error)
    return NextResponse.json({
      success: false,
      message: 'Sunucu hatası'
    }, { status: 500 })
  }
}