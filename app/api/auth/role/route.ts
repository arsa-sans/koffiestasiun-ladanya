// app/api/auth/role/route.ts
import { createClient } from "@/lib/supabase/server";
import { db } from "@/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";

export const dynamic = "force-dynamic";

async function getRoleResponse() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return Response.json(
      { role: null },
      {
        status: 401,
        headers: { "Cache-Control": "no-store, no-cache, must-revalidate" },
      }
    );
  }

  const [dbUser] = await db
    .select({ role: users.role, name: users.name })
    .from(users)
    .where(eq(users.authId, user.id))
    .limit(1);

  if (!dbUser) {
    return Response.json(
      { role: null },
      {
        status: 404,
        headers: { "Cache-Control": "no-store, no-cache, must-revalidate" },
      }
    );
  }

  return Response.json(
    { role: dbUser.role, name: dbUser.name },
    {
      headers: {
        "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
        Pragma: "no-cache",
        Expires: "0",
      },
    }
  );
}

export async function GET() {
  return getRoleResponse();
}

export async function POST() {
  return getRoleResponse();
}

