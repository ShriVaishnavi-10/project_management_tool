import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { updateSession } from './lib/supabase/middleware';

const PROTECTED_ROUTES = [
  '/dashboard',
  '/projects',
  '/kanban',
  '/tasks',
  '/activity',
  '/calendar',
  '/team'
];
const AUTH_ROUTES = ['/login', '/register'];

export async function middleware(request: NextRequest) {
  // First refresh Supabase session if present
  await updateSession(request);

  const { pathname } = request.nextUrl;
  const sessionToken = request.cookies.get('pm_session_token')?.value;

  const isProtectedRoute = PROTECTED_ROUTES.some((route) => pathname.startsWith(route));
  const isAuthRoute = AUTH_ROUTES.some((route) => pathname.startsWith(route));

  // Redirect root path '/' to '/dashboard' if logged in or '/login' if not logged in
  if (pathname === '/') {
    if (sessionToken) {
      return NextResponse.redirect(new URL('/dashboard', request.url));
    } else {
      return NextResponse.redirect(new URL('/login', request.url));
    }
  }

  // Redirect unauthenticated user trying to access protected routes
  if (isProtectedRoute && !sessionToken) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('from', pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Redirect authenticated user trying to access login/register
  if (isAuthRoute && sessionToken) {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};
