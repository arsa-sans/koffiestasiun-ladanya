// app/auth/callback/route.ts
import { createClient } from "@/lib/supabase/server";
import { db } from "@/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";

const ROLE_DASHBOARD: Record<string, string> = {
  admin: "/admin",
  cashier: "/cashier",
  kitchen: "/kitchen",
};

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error) {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (user) {
        const [dbUser] = await db
          .select({ role: users.role })
          .from(users)
          .where(eq(users.authId, user.id))
          .limit(1);

        const target = ROLE_DASHBOARD[dbUser?.role || "cashier"] || "/cashier";
        return NextResponse.redirect(`${origin}${target}`);
      }

      return NextResponse.redirect(`${origin}/cashier`);
    }
  }

  return NextResponse.redirect(`${origin}/login?error=auth-error`);
}
