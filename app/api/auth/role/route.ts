// app/api/auth/role/route.ts
import { createClient } from "@/lib/supabase/server";
import { db } from "@/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return Response.json({ role: null }, { status: 401 });
  }

  const [dbUser] = await db
    .select({ role: users.role, name: users.name })
    .from(users)
    .where(eq(users.authId, user.id))
    .limit(1);

  if (!dbUser) {
    return Response.json({ role: null }, { status: 404 });
  }

  return Response.json({ role: dbUser.role, name: dbUser.name });
}
