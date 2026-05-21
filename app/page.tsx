// app/page.tsx — Root redirect based on role
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { db } from "@/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";

const ROLE_DASHBOARD: Record<string, string> = {
  admin: "/admin",
  cashier: "/cashier",
  kitchen: "/kitchen",
};

export default async function Home() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  // Get role from DB
  const [dbUser] = await db
    .select({ role: users.role })
    .from(users)
    .where(eq(users.authId, user.id))
    .limit(1);

  const target = ROLE_DASHBOARD[dbUser?.role || "cashier"] || "/cashier";
  redirect(target);
}
