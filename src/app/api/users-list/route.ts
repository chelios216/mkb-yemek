import { NextRequest, NextResponse } from 'next/server'
import { mockDb } from '@/lib/database'

export async function GET(request: NextRequest) {
  try {
    const users = await mockDb.getAllUsers()
    
    // Return only necessary user info (no sensitive data)
    const publicUsers = users
      .filter(user => user.isActive)
      .map(user => ({
        id: user.id,
        name: user.name,
        department: user.department
      }))

    return NextResponse.json({
      success: true,
      users: publicUsers
    })

  } catch (error) {
    console.error('Users list error:', error)
    return NextResponse.json({
      success: false,
      message: 'Sunucu hatası'
    }, { status: 500 })
  }
}