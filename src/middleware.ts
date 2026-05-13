import { type NextRequest, NextResponse } from 'next/server'
import { updateSession } from '@/utils/supabase/middleware'

export async function middleware(request: NextRequest) {
  return await updateSession(request)
}

export const config = {
  matcher: [
    /*
     * Run middleware on all routes EXCEPT:
     * - _next/static  (Next.js build assets)
     * - _next/image   (image optimisation)
     * - favicon.ico
     * - Any static file extension
     */
    '/((?!monitoring|_next/static|_next/image|favicon\\.ico|manifest\\.json|sw\\.js|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|css|js|woff2?)$).*)',
  ],
}
