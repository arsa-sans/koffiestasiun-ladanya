export const dynamic = "force-dynamic";
export const revalidate = 0;

import { db } from "@/db";
import { users } from "@/db/schema";
import { asc } from "drizzle-orm";
import UsersClient from "@/components/admin/UsersClient";

export default async function UsersPage() {
  const allUsers = await db.select().from(users).orderBy(asc(users.name));

  return (
    <UsersClient
      users={allUsers.map((u) => ({
        id: u.id,
        name: u.name,
        email: u.email,
        role: u.role,
        isActive: u.isActive,
        createdAt: u.createdAt.toISOString(),
      }))}
    />
  );
}
