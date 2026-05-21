// src/server/services/tables.ts
"use server";

import { db } from "@/db";
import { diningTables } from "@/db/schema";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

export async function createTable(data: {
  code: string;
  name: string;
  capacity: number;
}) {
  const [created] = await db
    .insert(diningTables)
    .values({
      code: data.code,
      name: data.name,
      capacity: data.capacity,
    })
    .returning();

  revalidatePath("/admin/tables");
  revalidatePath("/cashier");
  return { success: true, data: created };
}

export async function updateTable(
  id: string,
  data: {
    code?: string;
    name?: string;
    capacity?: number;
    status?: "available" | "occupied" | "reserved" | "cleaning";
    isActive?: boolean;
  }
) {
  const [updated] = await db
    .update(diningTables)
    .set({
      ...data,
      updatedAt: new Date(),
    })
    .where(eq(diningTables.id, id))
    .returning();

  revalidatePath("/admin/tables");
  revalidatePath("/cashier");
  return { success: true, data: updated };
}

export async function deleteTable(id: string) {
  await db.delete(diningTables).where(eq(diningTables.id, id));
  revalidatePath("/admin/tables");
  revalidatePath("/cashier");
  return { success: true };
}
