import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  const token = request.cookies.get('token')?.value
  const user = request.cookies.get('user')?.value

  // Admin paneli için auth kontrolü
  if (request.nextUrl.pathname.startsWith('/admin')) {
    // Login sayfası kontrolü
    if (request.nextUrl.pathname === '/admin/login') {
      if (token && user) {
        return NextResponse.redirect(new URL('/admin/dashboard', request.url))
      }
      return NextResponse.next()
    }

    // Diğer admin sayfaları için auth kontrolü
    if (!token || !user) {
      return NextResponse.redirect(new URL('/admin/login', request.url))
    }

    try {
      const userData = JSON.parse(user)
      if (userData.role !== 'ADMIN' && userData.role !== 'MANAGER') {
        return NextResponse.redirect(new URL('/admin/login', request.url))
      }
    } catch (error) {
      console.error('User data parse error:', error)
      return NextResponse.redirect(new URL('/admin/login', request.url))
    }
  }

  // Tablet paneli için auth kontrolü
  if (request.nextUrl.pathname.startsWith('/tablet') && request.nextUrl.pathname !== '/tablet/login') {
    // localStorage'dan kontrol edemeyiz, sadece cookie kontrolü
    const tokenFromCookie = request.cookies.get('token')?.value
    const userFromCookie = request.cookies.get('user')?.value
    
    if (!tokenFromCookie && !userFromCookie) {
      // Token yoksa login'e yönlendir ama localStorage kontrolü client'ta yapılacak
      return NextResponse.next()
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    '/admin/:path*',
    '/tablet/:path*'
  ]
} 