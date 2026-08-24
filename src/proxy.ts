import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getIronSession } from 'iron-session';

interface SessionData {
  userId: string;
  email: string;
  name: string;
  role: 'CUSTOMER' | 'AGENT' | 'ADMIN';
  isLoggedIn: boolean;
}

const sessionOptions = {
  password: process.env.SESSION_SECRET || 'complex_password_at_least_32_characters_long_for_iron_session',
  cookieName: 'lmd-session',
  cookieOptions: {
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    sameSite: 'lax' as const,
    maxAge: 60 * 60 * 24,
    path: '/',
  },
};

// Protected route prefixes mapped to required roles
const PROTECTED_ROUTES: Record<string, string[]> = {
  '/customer': ['CUSTOMER'],
  '/agent': ['AGENT'],
  '/admin': ['ADMIN'],
};

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Find matching protected route
  const matchedPrefix = Object.keys(PROTECTED_ROUTES).find(prefix =>
    pathname.startsWith(prefix)
  );

  if (!matchedPrefix) {
    return NextResponse.next();
  }

  // Get session from cookies
  const response = NextResponse.next();
  const session = await getIronSession<SessionData>(request, response, sessionOptions);

  // Not logged in — redirect to appropriate login
  if (!session.isLoggedIn) {
    const role = matchedPrefix.replace('/', '');
    const loginUrl = new URL(`/login/${role}`, request.url);
    return NextResponse.redirect(loginUrl);
  }

  // Check role authorization
  const allowedRoles = PROTECTED_ROUTES[matchedPrefix];
  if (!allowedRoles.includes(session.role)) {
    // Redirect to their correct portal
    const portalMap: Record<string, string> = {
      CUSTOMER: '/customer',
      AGENT: '/agent',
      ADMIN: '/admin',
    };
    const correctPortal = portalMap[session.role] || '/';
    return NextResponse.redirect(new URL(correctPortal, request.url));
  }

  return response;
}

export const config = {
  matcher: [
    '/customer/:path*',
    '/agent/:path*',
    '/admin/:path*',
  ],
};
