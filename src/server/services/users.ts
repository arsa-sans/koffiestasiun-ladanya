// src/server/services/users.ts
"use server";

import { db } from "@/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

export async function createUser(data: {
  name: string;
  email: string;
  role: "admin" | "cashier" | "kitchen";
}) {
  const [created] = await db
    .insert(users)
    .values({
      name: data.name,
      email: data.email,
      role: data.role,
    })
    .returning();

  revalidatePath("/admin/users");
  return { success: true, data: created };
}

export async function updateUser(
  id: string,
  data: {
    name?: string;
    email?: string;
    role?: "admin" | "cashier" | "kitchen";
    isActive?: string;
  }
) {
  const [updated] = await db
    .update(users)
    .set({
      ...data,
      updatedAt: new Date(),
    })
    .where(eq(users.id, id))
    .returning();

  revalidatePath("/admin/users");
  return { success: true, data: updated };
}

export async function deleteUser(id: string) {
  await db.delete(users).where(eq(users.id, id));
  revalidatePath("/admin/users");
  return { success: true };
}
