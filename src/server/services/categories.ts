// src/server/services/categories.ts
"use server";

import { db } from "@/db";
import { categories } from "@/db/schema";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

export async function createCategory(data: {
  name: string;
  slug: string;
  description?: string;
  sortOrder?: number;
}) {
  const [created] = await db
    .insert(categories)
    .values({
      name: data.name,
      slug: data.slug,
      description: data.description || null,
      sortOrder: data.sortOrder ?? 0,
    })
    .returning();

  revalidatePath("/admin/categories");
  return { success: true, data: created };
}

export async function updateCategory(
  id: string,
  data: {
    name?: string;
    slug?: string;
    description?: string;
    sortOrder?: number;
    isActive?: boolean;
  }
) {
  const [updated] = await db
    .update(categories)
    .set({
      ...data,
      updatedAt: new Date(),
    })
    .where(eq(categories.id, id))
    .returning();

  revalidatePath("/admin/categories");
  return { success: true, data: updated };
}

export async function deleteCategory(id: string) {
  await db.delete(categories).where(eq(categories.id, id));
  revalidatePath("/admin/categories");
  return { success: true };
}
