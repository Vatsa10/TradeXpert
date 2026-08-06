import { NextRequest, NextResponse } from "next/server";
import { getSessionCookie } from "better-auth/cookies";

// Next 16 renamed the `middleware` file convention to `proxy`. This single root
// file replaces the former middleware.ts + middleware/index.ts pair (which both
// resolved, logging a duplicate-file warning on every request).

const SECURITY_HEADERS: Record<string, string> = {
  "X-Frame-Options": "DENY",
  "X-Content-Type-Options": "nosniff",
  "Referrer-Policy": "strict-origin-when-cross-origin",
  "Permissions-Policy": "geolocation=(), microphone=(), camera=()",
  // Only enforced by browsers over HTTPS; inert (and harmless) in local dev.
  "Strict-Transport-Security": "max-age=31536000; includeSubDomains",
};

function withSecurityHeaders(response: NextResponse) {
  for (const [key, value] of Object.entries(SECURITY_HEADERS)) {
    response.headers.set(key, value);
  }
  return response;
}

// Paths that must stay reachable without a session (auth flows, public pages).
// "/" is the public landing page and the redirect target below: leaving it
// protected would bounce signed-out visitors from "/" to "/" forever.
const PUBLIC_PATHS = ["/", "/api", "/sign-in", "/sign-up", "/assets"];

function isPublicPath(pathname: string) {
  return PUBLIC_PATHS.some(
    (path) => pathname === path || pathname.startsWith(`${path}/`),
  );
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Signed-in visitors skip the landing page entirely — redirecting here (on
  // the cookie, before rendering) lets the landing route render without any
  // session lookup of its own.
  if (pathname === "/" && getSessionCookie(request)) {
    return withSecurityHeaders(
      NextResponse.redirect(new URL("/dashboard", request.url)),
    );
  }

  if (isPublicPath(pathname)) {
    return withSecurityHeaders(NextResponse.next());
  }

  const sessionCookie = getSessionCookie(request);

  if (!sessionCookie) {
    return withSecurityHeaders(
      NextResponse.redirect(new URL("/", request.url)),
    );
  }

  return withSecurityHeaders(NextResponse.next());
}

export const config = {
  // Exclude Next internals AND any file with an extension (images, fonts,
  // svg...) — the image optimizer fetches source files cookie-less, and the
  // auth redirect was feeding it HTML instead of image bytes.
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:png|jpe?g|svg|gif|webp|avif|ico|txt|xml|woff2?)$).*)"],
};
