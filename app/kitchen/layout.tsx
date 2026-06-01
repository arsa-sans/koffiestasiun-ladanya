// app/kitchen/layout.tsx
import { Metadata } from "next";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { db } from "@/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";
import Sidebar from "@/components/shared/Sidebar";
import BottomNav from "@/components/shared/BottomNav";

export const metadata: Metadata = {
  title: "Kitchen Display",
};

export default async function KitchenLayout({
  children,
}: {
  children: React.ReactNode;
}) {
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

  if (!dbUser || (dbUser.role !== "kitchen" && dbUser.role !== "admin")) {
    redirect("/unauthorized");
  }

  return (
    <div className="flex h-screen overflow-hidden" style={{ background: "#F8F5F2" }}>
      <Sidebar role="kitchen" />
      <main className="flex-1 overflow-hidden pb-14 lg:pb-0">{children}</main>
      <BottomNav role="kitchen" />
    </div>
  );
}

