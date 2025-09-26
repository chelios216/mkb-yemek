import { NextRequest, NextResponse } from 'next/server'
import { mockDb } from '@/lib/database'

// Get dashboard statistics
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const type = searchParams.get('type')

    switch (type) {
      case 'stats':
        const stats = await mockDb.getDashboardStats()
        return NextResponse.json({
          success: true,
          data: stats
        })

      case 'users':
        const users = await mockDb.getAllUsers()
        const usersWithStats = await Promise.all(
          users.map(async (user) => {
            const todayMeals = await mockDb.getTodayMeals(user.id)
            const monthlyMeals = await mockDb.getUserMealHistory(
              user.id,
              new Date().toISOString().substring(0, 7)
            )
            
            return {
              ...user,
              todayMeals: todayMeals.map(m => m.mealType),
              monthlyTotal: monthlyMeals.length
            }
          })
        )
        
        return NextResponse.json({
          success: true,
          data: usersWithStats
        })

      case 'recent-activities':
        const activities = await mockDb.getDashboardStats()
        const activitiesWithUserInfo = await Promise.all(
          activities.recentActivities.map(async (activity) => {
            const user = await mockDb.findUserById(activity.userId)
            return {
              ...activity,
              userName: user?.name || 'Bilinmeyen',
              userDepartment: user?.department || 'Bilinmeyen'
            }
          })
        )

        return NextResponse.json({
          success: true,
          data: activitiesWithUserInfo
        })

      case 'settings':
        const workSchedule = await mockDb.getWorkScheduleSettings()
        return NextResponse.json({
          success: true,
          data: workSchedule
        })

      default:
        return NextResponse.json({
          success: false,
          message: 'Geçersiz tip parametresi'
        }, { status: 400 })
    }

  } catch (error) {
    console.error('Admin dashboard error:', error)
    return NextResponse.json({
      success: false,
      error: 'Sunucu hatası'
    }, { status: 500 })
  }
}

// Admin actions (force meal, user management etc.)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { action, userId, mealType, data } = body

    switch (action) {
      case 'force-meal':
        if (!userId || !mealType) {
          return NextResponse.json({
            success: false,
            message: 'UserId ve mealType gerekli'
          }, { status: 400 })
        }

        const meal = await mockDb.recordMeal(userId, mealType)
        return NextResponse.json({
          success: true,
          data: meal,
          message: 'Yemek zorla kaydedildi'
        })

      case 'create-user':
        if (!data || !data.name || !data.email || !data.department || !data.password) {
          return NextResponse.json({
            success: false,
            message: 'Tüm kullanıcı bilgileri gerekli'
          }, { status: 400 })
        }

        // Check if email already exists
        const existingUser = await mockDb.findUserByEmail(data.email)
        if (existingUser) {
          return NextResponse.json({
            success: false,
            message: 'Bu e-posta adresi zaten kullanılıyor'
          }, { status: 400 })
        }

        const newUser = await mockDb.createUserByAdmin({
          name: data.name,
          email: data.email,
          department: data.department,
          role: data.role || 'personel',
          isActive: true,
          isApproved: false // Yeni kullanıcılar onaysız başlar
        }, data.password)

        return NextResponse.json({
          success: true,
          data: newUser,
          message: 'Kullanıcı başarıyla oluşturuldu'
        })

      case 'update-user':
        if (!userId || !data) {
          return NextResponse.json({
            success: false,
            message: 'UserId ve güncellenecek veriler gerekli'
          }, { status: 400 })
        }

        const updatedUser = await mockDb.updateUser(userId, data)
        if (!updatedUser) {
          return NextResponse.json({
            success: false,
            message: 'Kullanıcı bulunamadı'
          }, { status: 404 })
        }

        return NextResponse.json({
          success: true,
          data: updatedUser,
          message: 'Kullanıcı başarıyla güncellendi'
        })

      case 'delete-user':
        if (!userId) {
          return NextResponse.json({
            success: false,
            message: 'UserId gerekli'
          }, { status: 400 })
        }

        const deleted = await mockDb.deleteUser(userId)
        if (!deleted) {
          return NextResponse.json({
            success: false,
            message: 'Kullanıcı bulunamadı'
          }, { status: 404 })
        }

        return NextResponse.json({
          success: true,
          message: 'Kullanıcı başarıyla silindi'
        })

      case 'generate-qr':
        if (!userId || !mealType) {
          return NextResponse.json({
            success: false,
            message: 'UserId ve mealType gerekli'
          }, { status: 400 })
        }

        const qrUser = await mockDb.findUserById(userId)
        if (!qrUser) {
          return NextResponse.json({
            success: false,
            message: 'Kullanıcı bulunamadı'
          }, { status: 404 })
        }

        const qrData = mockDb.generateQRCodePayload(userId, mealType)
        return NextResponse.json({
          success: true,
          data: {
            qrData,
            user: qrUser.name,
            mealType,
            validUntil: new Date(Date.now() + 30 * 60 * 1000).toISOString()
          },
          message: 'QR kod oluşturuldu'
        })

      case 'toggle-user':
        if (!userId) {
          return NextResponse.json({
            success: false,
            message: 'UserId gerekli'
          }, { status: 400 })
        }

        const toggleUser = await mockDb.findUserById(userId)
        if (!toggleUser) {
          return NextResponse.json({
            success: false,
            message: 'Kullanıcı bulunamadı'
          }, { status: 404 })
        }

        toggleUser.isActive = !toggleUser.isActive
        toggleUser.updatedAt = new Date()

        return NextResponse.json({
          success: true,
          data: toggleUser,
          message: `Kullanıcı ${toggleUser.isActive ? 'aktif' : 'pasif'} edildi`
        })

      case 'update-settings':
        if (!data) {
          return NextResponse.json({
            success: false,
            message: 'Ayar verisi gerekli'
          }, { status: 400 })
        }

        const updateSuccess = await mockDb.updateWorkScheduleSettings(data)
        if (!updateSuccess) {
          return NextResponse.json({
            success: false,
            message: 'Ayarlar güncellenemedi'
          }, { status: 500 })
        }

        return NextResponse.json({
          success: true,
          message: 'Sistem ayarları başarıyla güncellendi'
        })

      default:
        return NextResponse.json({
          success: false,
          message: 'Geçersiz aksiyon'
        }, { status: 400 })
    }

  } catch (error) {
    console.error('Admin action error:', error)
    return NextResponse.json({
      success: false,
      error: 'Sunucu hatası'
    }, { status: 500 })
  }
}