// src/server/services/products.ts
"use server";

import { db } from "@/db";
import { products } from "@/db/schema";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

export async function createProduct(data: {
  name: string;
  categoryId: string;
  stationId: string;
  price: string;
  description?: string;
  imageUrl?: string;
  sortOrder?: number;
}) {
  const [created] = await db
    .insert(products)
    .values({
      name: data.name,
      categoryId: data.categoryId,
      stationId: data.stationId,
      price: data.price,
      description: data.description || null,
      imageUrl: data.imageUrl || null,
      sortOrder: data.sortOrder ?? 0,
    })
    .returning();

  revalidatePath("/admin/products");
  return { success: true, data: created };
}

export async function updateProduct(
  id: string,
  data: {
    name?: string;
    categoryId?: string;
    stationId?: string;
    price?: string;
    description?: string;
    imageUrl?: string;
    sortOrder?: number;
    isAvailable?: boolean;
  }
) {
  const [updated] = await db
    .update(products)
    .set({
      ...data,
      updatedAt: new Date(),
    })
    .where(eq(products.id, id))
    .returning();

  revalidatePath("/admin/products");
  return { success: true, data: updated };
}

export async function deleteProduct(id: string) {
  await db.delete(products).where(eq(products.id, id));
  revalidatePath("/admin/products");
  return { success: true };
}

export async function toggleProductAvailability(id: string, isAvailable: boolean) {
  const [updated] = await db
    .update(products)
    .set({ isAvailable, updatedAt: new Date() })
    .where(eq(products.id, id))
    .returning();

  revalidatePath("/admin/products");
  return { success: true, data: updated };
}
