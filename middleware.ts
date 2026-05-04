import { NextRequest, NextResponse } from "next/server";

export function middleware(request: NextRequest) {
  const user = process.env.BASIC_AUTH_USER;
  const pass = process.env.BASIC_AUTH_PASS;

  // If no creds configured, skip auth (useful in local dev)
  if (!user || !pass) return NextResponse.next();

  const authHeader = request.headers.get("authorization");

  if (authHeader) {
    const [scheme, encoded] = authHeader.split(" ");
    if (scheme === "Basic" && encoded) {
      try {
        const decoded = atob(encoded);
        const idx = decoded.indexOf(":");
        if (idx !== -1) {
          const u = decoded.slice(0, idx);
          const p = decoded.slice(idx + 1);
          if (u === user && p === pass) {
            return NextResponse.next();
          }
        }
      } catch {}
    }
  }

  return new NextResponse("Authentication required", {
    status: 401,
    headers: {
      "WWW-Authenticate": 'Basic realm="Tigeri Expense Dashboard"',
    },
  });
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
