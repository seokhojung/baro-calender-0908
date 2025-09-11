import { NextRequest, NextResponse } from 'next/server'

export function middleware(request: NextRequest) {
  const response = NextResponse.next()
  
  // Security headers for all requests
  response.headers.set('X-DNS-Prefetch-Control', 'off')
  response.headers.set('X-Frame-Options', 'SAMEORIGIN')
  response.headers.set('X-Content-Type-Options', 'nosniff')
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin')
  response.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()')
  response.headers.set('X-XSS-Protection', '1; mode=block')
  
  // HSTS header for HTTPS connections
  if (request.nextUrl.protocol === 'https:') {
    response.headers.set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload')
  }
  
  // Content Security Policy
  const cspHeader = [
    "default-src 'self'",
    "script-src 'self' 'unsafe-eval' 'unsafe-inline' https://accounts.google.com https://apis.google.com",
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    "img-src 'self' blob: data: https://lh3.googleusercontent.com https://avatars.githubusercontent.com",
    "font-src 'self' https://fonts.gstatic.com",
    "connect-src 'self' https://api.github.com https://accounts.google.com https://oauth2.googleapis.com",
    "frame-src 'self' https://accounts.google.com",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'none'",
    "upgrade-insecure-requests"
  ].join('; ')
  
  response.headers.set('Content-Security-Policy', cspHeader)
  
  // CSRF protection for state-changing operations
  const isStateChangingMethod = ['POST', 'PUT', 'PATCH', 'DELETE'].includes(request.method)
  const isApiRequest = request.nextUrl.pathname.startsWith('/api/')
  
  if (isStateChangingMethod && isApiRequest) {
    const origin = request.headers.get('origin')
    const referer = request.headers.get('referer')
    const xRequestedWith = request.headers.get('x-requested-with')
    
    // Verify origin matches expected values
    const allowedOrigins = [
      'http://localhost:3000',
      'https://localhost:3000',
      process.env.NEXT_PUBLIC_APP_URL
    ].filter((url): url is string => Boolean(url))
    
    const isValidOrigin = origin && allowedOrigins.includes(origin)
    const isValidReferer = referer && allowedOrigins.some(allowed => referer.startsWith(allowed))
    const hasXRequestedWith = xRequestedWith === 'XMLHttpRequest'
    
    if (!isValidOrigin && !isValidReferer && !hasXRequestedWith) {
      console.warn('Potential CSRF attack detected:', {
        method: request.method,
        pathname: request.nextUrl.pathname,
        origin,
        referer,
        xRequestedWith
      })
      
      return new NextResponse('Forbidden', { status: 403 })
    }
  }
  
  // Rate limiting for authentication endpoints
  const isAuthEndpoint = request.nextUrl.pathname.startsWith('/api/auth/')
  if (isAuthEndpoint && isStateChangingMethod) {
    const ip = request.ip || request.headers.get('x-forwarded-for') || 'unknown'
    const userAgent = request.headers.get('user-agent') || 'unknown'
    
    // In a production environment, you would use Redis or another store
    // For now, we'll rely on client-side rate limiting
    response.headers.set('X-RateLimit-IP', ip)
    response.headers.set('X-RateLimit-UserAgent', userAgent.substring(0, 100))
  }
  
  // Set cache control for static assets
  if (request.nextUrl.pathname.startsWith('/_next/static/')) {
    response.headers.set('Cache-Control', 'public, max-age=31536000, immutable')
  }
  
  // Security headers for authentication pages
  const isAuthPage = ['/login', '/signup', '/forgot-password', '/reset-password'].some(
    path => request.nextUrl.pathname.startsWith(path)
  )
  
  if (isAuthPage) {
    // Prevent caching of auth pages
    response.headers.set('Cache-Control', 'no-cache, no-store, must-revalidate')
    response.headers.set('Pragma', 'no-cache')
    response.headers.set('Expires', '0')
    
    // Additional security for auth pages
    response.headers.set('X-Frame-Options', 'DENY')
  }
  
  return response
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
    // Also apply to API routes for security headers
    '/api/:path*'
  ],
}