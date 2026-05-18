import type { NextRequest } from "next/server"

export async function middleware(request: NextRequest) {
  // Allow all requests to pass through without authentication
  return undefined
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"],
}
