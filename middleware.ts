import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';

const isPublicRoute = createRouteMatcher([
  '/',
  '/auth(.*)',
  '/pricing(.*)',
  '/ui-preview(.*)',
  '/api/webhooks/(.*)',
]);

export default clerkMiddleware(async (auth, request) => {
  // Allow E2E auth bypass for Playwright tests on localhost
  const isLocalhost =
    request.nextUrl.hostname === 'localhost' ||
    request.nextUrl.hostname === '127.0.0.1';
  const bypassForE2E =
    process.env.PW_E2E_AUTH_BYPASS === '1' &&
    isLocalhost &&
    request.nextUrl.pathname.startsWith('/app');

  if (bypassForE2E) {
    return NextResponse.next();
  }

  if (!isPublicRoute(request)) {
    await auth.protect();
  }
});

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
