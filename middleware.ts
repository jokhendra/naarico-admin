import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Paths that don't require authentication
const PUBLIC_PATHS = ['/auth/login', '/auth/forgot-password', '/auth/reset-password'];

// Check if the path is public
const isPublicPath = (path: string) => {
  return PUBLIC_PATHS.some(publicPath => path.startsWith(publicPath));
};

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  // Allow public paths
  if (isPublicPath(pathname)) {
    return NextResponse.next();
  }
  
  // Check for auth cookie - our API uses 'refresh_token' as HTTP-only cookie
  const hasAuthCookie = request.cookies.has('refresh_token');
  
  // If no auth cookie and not on a public path, redirect to login
  if (!hasAuthCookie) {
    const url = request.nextUrl.clone();
    url.pathname = '/auth/login';
    url.search = `?callbackUrl=${encodeURIComponent(pathname)}`;
    return NextResponse.redirect(url);
  }
  
  // Continue with the request if authenticated
  return NextResponse.next();
}

// Configure which paths the middleware runs on
export const config = {
  matcher: [
    /*
     * Match all paths except:
     * 1. /api (API routes)
     * 2. /_next (Next.js internals)
     * 3. /fonts, /images (static assets)
     * 4. /favicon.ico, /robots.txt (static files)
     */
    '/((?!api|_next|fonts|images|favicon.ico|robots.txt).*)',
  ],
}; 