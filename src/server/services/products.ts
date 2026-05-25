// src/server/services/products.ts
"use server";

import { db } from "@/db";
import { products, recipes, productModifierGroups } from "@/db/schema";
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
  recipes?: { ingredientId: string; quantity: string }[];
  modifierGroupIds?: string[];
}) {
  return await db.transaction(async (tx) => {
    const [created] = await tx
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

    if (data.recipes && data.recipes.length > 0) {
      await tx.insert(recipes).values(
        data.recipes.map((r) => ({
          productId: created.id,
          ingredientId: r.ingredientId,
          quantity: r.quantity,
        }))
      );
    }

    if (data.modifierGroupIds && data.modifierGroupIds.length > 0) {
      await tx.insert(productModifierGroups).values(
        data.modifierGroupIds.map((groupId, index) => ({
          productId: created.id,
          modifierGroupId: groupId,
          sortOrder: index,
        }))
      );
    }

    revalidatePath("/admin/products");
    return { success: true, data: created };
  });
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
    recipes?: { ingredientId: string; quantity: string }[];
    modifierGroupIds?: string[];
  }
) {
  return await db.transaction(async (tx) => {
    const { recipes: recipeList, modifierGroupIds, ...productDetails } = data;

    const [updated] = await tx
      .update(products)
      .set({
        ...productDetails,
        updatedAt: new Date(),
      })
      .where(eq(products.id, id))
      .returning();

    if (recipeList !== undefined) {
      await tx.delete(recipes).where(eq(recipes.productId, id));
      if (recipeList.length > 0) {
        await tx.insert(recipes).values(
          recipeList.map((r) => ({
            productId: id,
            ingredientId: r.ingredientId,
            quantity: r.quantity,
          }))
        );
      }
    }

    if (modifierGroupIds !== undefined) {
      await tx.delete(productModifierGroups).where(eq(productModifierGroups.productId, id));
      if (modifierGroupIds.length > 0) {
        await tx.insert(productModifierGroups).values(
          modifierGroupIds.map((groupId, index) => ({
            productId: id,
            modifierGroupId: groupId,
            sortOrder: index,
          }))
        );
      }
    }

    revalidatePath("/admin/products");
    return { success: true, data: updated };
  });
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
