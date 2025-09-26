import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import jwt from 'jsonwebtoken'

const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-key-here'

// Protected routes that require authentication
const protectedRoutes = ['/admin']

// Admin-only routes
const adminOnlyRoutes = ['/admin']

export function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname

  // Check if the route needs protection
  const isProtectedRoute = protectedRoutes.some(route => pathname.startsWith(route))
  
  if (!isProtectedRoute) {
    return NextResponse.next()
  }

  // Get token from cookie
  const token = request.cookies.get('auth-token')?.value

  if (!token) {
    // Redirect to login if no token
    return NextResponse.redirect(new URL('/login', request.url))
  }

  try {
    // Verify token
    const decoded = jwt.verify(token, JWT_SECRET) as any

    // Check if admin route requires admin role
    const isAdminRoute = adminOnlyRoutes.some(route => pathname.startsWith(route))
    
    if (isAdminRoute && decoded.role !== 'admin') {
      // Redirect non-admin users trying to access admin routes
      return NextResponse.redirect(new URL('/', request.url))
    }

    // Add user info to headers for API routes
    const response = NextResponse.next()
    response.headers.set('x-user-id', decoded.userId)
    response.headers.set('x-user-role', decoded.role)
    response.headers.set('x-user-email', decoded.email)

    return response

  } catch (error) {
    // Invalid token, redirect to login
    const response = NextResponse.redirect(new URL('/login', request.url))
    
    // Clear invalid token
    response.cookies.delete('auth-token')
    
    return response
  }
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - login (login page)
     * - / (home page - publicly accessible)
     * - /scan (QR scan page - publicly accessible)
     */
    '/((?!api|_next/static|_next/image|favicon.ico|login|^/$|^/scan$).*)',
  ],
}