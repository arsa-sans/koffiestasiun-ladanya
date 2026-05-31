// proxy.ts — Next.js 16 route protection with role-based access control
import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import postgres from "postgres";

// Role → allowed path prefixes
const ROLE_PATHS: Record<string, string[]> = {
  admin: ["/admin", "/cashier", "/kitchen"],
  cashier: ["/cashier"],
  kitchen: ["/kitchen"],
};

// Role → default dashboard
const ROLE_DASHBOARD: Record<string, string> = {
  admin: "/admin",
  cashier: "/cashier",
  kitchen: "/kitchen",
};

// Helper to redirect while copying the refreshed cookies from Supabase client
function redirectWithCookies(
  request: NextRequest,
  url: URL,
  supabaseResponse: NextResponse
) {
  const redirectResponse = NextResponse.redirect(url);
  supabaseResponse.cookies.getAll().forEach((cookie) => {
    redirectResponse.cookies.set(cookie.name, cookie.value, {
      ...cookie,
    });
  });
  return redirectResponse;
}

export async function proxy(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookieOptions: {
        secure: process.env.NODE_ENV === "production",
      },
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, { ...options, secure: process.env.NODE_ENV === "production" })
          );
        },
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { pathname } = request.nextUrl;

  // Public routes — no protection needed
  const publicRoutes = ["/login", "/auth/callback", "/unauthorized"];
  if (publicRoutes.some((route) => pathname.startsWith(route))) {
    return supabaseResponse;
  }

  // Redirect unauthenticated users to login
  if (!user) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    return redirectWithCookies(request, url, supabaseResponse);
  }

  // Protected dashboard routes — check role
  const protectedPrefixes = ["/admin", "/cashier", "/kitchen"];
  const isProtectedRoute = protectedPrefixes.some((prefix) =>
    pathname.startsWith(prefix)
  );

  if (isProtectedRoute) {
    // Query user role from DB directly (proxy runs on Node.js runtime)
    const role = await getUserRoleFromDB(user.id);

    if (!role) {
      // User exists in auth but not in users table
      const url = request.nextUrl.clone();
      url.pathname = "/unauthorized";
      return redirectWithCookies(request, url, supabaseResponse);
    }

    // Check if role is allowed to access this path
    const allowedPaths = ROLE_PATHS[role] || [];
    const hasAccess = allowedPaths.some((prefix) =>
      pathname.startsWith(prefix)
    );

    if (!hasAccess) {
      // Redirect to their own dashboard
      const url = request.nextUrl.clone();
      url.pathname = ROLE_DASHBOARD[role] || "/login";
      return redirectWithCookies(request, url, supabaseResponse);
    }

    // Set role header for downstream use
    supabaseResponse.headers.set("x-user-role", role);
  }

  return supabaseResponse;
}

// Lightweight DB query for proxy — avoids importing Drizzle ORM
// which may have module issues in the proxy context
async function getUserRoleFromDB(
  authId: string
): Promise<string | null> {
  try {
    const sql = postgres(process.env.DATABASE_URL!, { max: 1 });
    const result = await sql`
      SELECT role FROM users WHERE auth_id = ${authId} LIMIT 1
    `;
    await sql.end();
    return result[0]?.role || null;
  } catch (err) {
    console.error("getUserRoleFromDB error:", err);
    return null;
  }
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
