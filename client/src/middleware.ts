import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  // 프로덕션 환경에서 데모 페이지 접근 차단
  if (process.env.NODE_ENV === 'production') {
    const demoRoutes = ['/demo', '/responsive-demo', '/layout-demo']

    if (demoRoutes.some(route => request.nextUrl.pathname.startsWith(route))) {
      return NextResponse.redirect(new URL('/', request.url))
    }
  }

  return NextResponse.next()
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
  ],
}