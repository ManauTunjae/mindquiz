import { NextResponse, type NextRequest } from 'next/server';

// Quick check only: no session cookie means no admin page.
// The backend always checks the session for real. If the cookie is old or fake,
// the API answers 401 and the page sends the user to the login page.
// We do not redirect away from the login page here, so a stale cookie can never cause a loop.
export function proxy(request: NextRequest) {
  const isLoginPage = request.nextUrl.pathname === '/admin/login';

  if (!isLoginPage && !request.cookies.has('mq_session')) {
    return NextResponse.redirect(new URL('/admin/login', request.url));
  }
  return NextResponse.next();
}

export const config = {
  matcher: '/admin/:path*',
};
