// src/server/services/modifiers.ts
"use server";

import { db } from "@/db";
import { modifierGroups, modifierOptions } from "@/db/schema";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

// ====== MODIFIER GROUPS ======

export async function createModifierGroup(data: {
  name: string;
  description?: string;
  isRequired?: boolean;
  isMultiple?: boolean;
  minSelect?: number;
  maxSelect?: number;
  sortOrder?: number;
}) {
  const [created] = await db
    .insert(modifierGroups)
    .values({
      name: data.name,
      description: data.description || null,
      isRequired: data.isRequired ?? false,
      isMultiple: data.isMultiple ?? false,
      minSelect: data.minSelect ?? 0,
      maxSelect: data.maxSelect ?? 1,
      sortOrder: data.sortOrder ?? 0,
    })
    .returning();

  revalidatePath("/admin/modifiers");
  return { success: true, data: created };
}

export async function updateModifierGroup(
  id: string,
  data: {
    name?: string;
    description?: string;
    isRequired?: boolean;
    isMultiple?: boolean;
    minSelect?: number;
    maxSelect?: number;
    sortOrder?: number;
    isActive?: boolean;
  }
) {
  const [updated] = await db
    .update(modifierGroups)
    .set({
      ...data,
      updatedAt: new Date(),
    })
    .where(eq(modifierGroups.id, id))
    .returning();

  revalidatePath("/admin/modifiers");
  return { success: true, data: updated };
}

export async function deleteModifierGroup(id: string) {
  await db.delete(modifierGroups).where(eq(modifierGroups.id, id));
  revalidatePath("/admin/modifiers");
  return { success: true };
}

// ====== MODIFIER OPTIONS ======

export async function createModifierOption(data: {
  groupId: string;
  name: string;
  price?: string;
  sortOrder?: number;
}) {
  const [created] = await db
    .insert(modifierOptions)
    .values({
      groupId: data.groupId,
      name: data.name,
      price: data.price ?? "0",
      sortOrder: data.sortOrder ?? 0,
    })
    .returning();

  revalidatePath("/admin/modifiers");
  return { success: true, data: created };
}

export async function updateModifierOption(
  id: string,
  data: {
    name?: string;
    price?: string;
    sortOrder?: number;
    isActive?: boolean;
  }
) {
  const [updated] = await db
    .update(modifierOptions)
    .set({
      ...data,
      updatedAt: new Date(),
    })
    .where(eq(modifierOptions.id, id))
    .returning();

  revalidatePath("/admin/modifiers");
  return { success: true, data: updated };
}

export async function deleteModifierOption(id: string) {
  await db.delete(modifierOptions).where(eq(modifierOptions.id, id));
  revalidatePath("/admin/modifiers");
  return { success: true };
}
