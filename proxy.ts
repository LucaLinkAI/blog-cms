import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

/**
 * Middleware — runs on every request that is not a static asset.
 *
 * 1. Refreshes the Supabase session (MUST preserve supabaseResponse through setAll).
 * 2. Redirects unauthenticated users away from /dashboard/* to /login.
 *
 * In mock mode (NEXT_PUBLIC_DATA_SOURCE !== "supabase") the redirect is
 * handled by individual server components / route handlers instead, so
 * middleware is a no-op for session management.
 */
export async function proxy(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  if (process.env.NEXT_PUBLIC_DATA_SOURCE === "supabase") {
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
      {
        cookies: {
          getAll() {
            return request.cookies.getAll();
          },
          setAll(cookiesToSet) {
            // Forward updated cookies to the outgoing request first
            cookiesToSet.forEach(({ name, value }) =>
              request.cookies.set(name, value)
            );
            // Re-create the response so refreshed session cookies are set
            supabaseResponse = NextResponse.next({ request });
            cookiesToSet.forEach(({ name, value, options }) =>
              supabaseResponse.cookies.set(name, value, options)
            );
          },
        },
      }
    );

    // IMPORTANT: do NOT remove this call — it refreshes the user session.
    // Never use getSession() here; getUser() validates the JWT server-side.
    const {
      data: { user },
    } = await supabase.auth.getUser();

    // Redirect unauthenticated users away from protected routes
    if (!user && request.nextUrl.pathname.startsWith("/dashboard")) {
      const url = request.nextUrl.clone();
      url.pathname = "/login";
      return NextResponse.redirect(url);
    }
  }

  return supabaseResponse;
}

export const config = {
  matcher: [
    /*
     * Match all request paths EXCEPT:
     *  - _next/static  (static files)
     *  - _next/image   (image optimisation)
     *  - favicon.ico
     *  - image files (svg, png, jpg, jpeg, gif, webp)
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
