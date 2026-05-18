import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

// Public routes — never redirect to /auth even if unauthenticated
const PUBLIC_ROUTES = [
  '/', 
  '/auth', 
  '/explore', 
  '/trending', 
  '/api/moderate', // Allow background moderation from Supabase
  '/manifest.json', 
  '/sw.js', 
  '/icon.png', 
  '/icon-192x192.png', 
  '/icon-512x512.png',
  '/screenshot-home.png',
  '/screenshot-profile.png'
]

export async function updateSession(request: NextRequest) {
  const requestHeaders = new Headers(request.headers)
  requestHeaders.set('x-pathname', request.nextUrl.pathname)

  let supabaseResponse = NextResponse.next({
    request: {
      headers: requestHeaders,
    }
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL || 'https://zmtohgjowcntyhuiuqop.supabase.co',
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InptdG9oZ2pvd2NudHlodWl1cW9wIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzgxNjY0MDgsImV4cCI6MjA5Mzc0MjQwOH0.xTVMvUa-dEGU5C6lYvLQJ7UUn9nb1x-KKZVvkdyyvPY',
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            request.cookies.set(name, value)
            supabaseResponse.cookies.set(name, value, options)
          })
        },
      },
    }
  )

  // IMPORTANT: Do NOT add any logic between createServerClient and getUser().
  // A simple mistake here can make it hard to debug session issues.
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const { pathname } = request.nextUrl

  // Redirect unauthenticated users away from protected routes
  const isPublic =
    PUBLIC_ROUTES.some((route) => pathname === route) ||
    pathname.startsWith('/auth')

  if (!user && !isPublic) {
    const url = request.nextUrl.clone()
    url.pathname = '/auth'
    return NextResponse.redirect(url)
  }

  // If already signed in and hitting /auth, send home
  if (user && pathname === '/auth') {
    const url = request.nextUrl.clone()
    url.pathname = '/'
    return NextResponse.redirect(url)
  }

  return supabaseResponse
}
