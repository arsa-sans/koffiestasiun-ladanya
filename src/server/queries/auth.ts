// src/server/queries/auth.ts
"use server";

import { db } from "@/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function getUserByAuthId(authId: string) {
  const [user] = await db
    .select({
      id: users.id,
      name: users.name,
      email: users.email,
      role: users.role,
      isActive: users.isActive,
    })
    .from(users)
    .where(eq(users.authId, authId))
    .limit(1);

  return user || null;
}

export async function getUserRole(authId: string): Promise<string | null> {
  const [user] = await db
    .select({ role: users.role })
    .from(users)
    .where(eq(users.authId, authId))
    .limit(1);

  return user?.role || null;
}
