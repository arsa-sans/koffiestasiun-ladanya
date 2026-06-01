// app/admin/sql/page.tsx
import { Metadata } from "next";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { db } from "@/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";
import SqlEditorClient from "@/components/admin/SqlEditorClient";

export const metadata: Metadata = {
  title: "SQL Editor - Admin",
};

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function SqlEditorPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // Get user role from db
  const [dbUser] = await db
    .select({ role: users.role })
    .from(users)
    .where(eq(users.authId, user.id))
    .limit(1);

  if (!dbUser || dbUser.role !== "admin") {
    redirect("/unauthorized");
  }

  return <SqlEditorClient />;
}
