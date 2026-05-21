// src/server/services/inventory.ts
"use server";

import { revalidatePath } from "next/cache";

import { db } from "@/db";
import {
  orderItems,
  orderItemModifiers,
  recipes,
  modifierRecipes,
  ingredients,
  inventoryTransactions,
} from "@/db/schema";
import { eq, and } from "drizzle-orm";

export async function deductInventoryForOrder(orderId: string) {
  // Get all undeducted order items for this order
  const items = await db.query.orderItems.findMany({
    where: and(
      eq(orderItems.orderId, orderId),
      eq(orderItems.inventoryDeducted, false)
    ),
    with: {
      modifiers: true,
    },
  });

  for (const item of items) {
    // Deduct product recipe ingredients
    const productRecipes = await db
      .select()
      .from(recipes)
      .where(eq(recipes.productId, item.productId));

    for (const recipe of productRecipes) {
      const qty = parseFloat(recipe.quantity) * item.quantity;
      await deductIngredient(recipe.ingredientId, qty, orderId);
    }

    // Deduct modifier recipe ingredients
    for (const modifier of item.modifiers) {
      const modRecipes = await db
        .select()
        .from(modifierRecipes)
        .where(eq(modifierRecipes.modifierOptionId, modifier.modifierOptionId));

      for (const mr of modRecipes) {
        const qty = parseFloat(mr.quantity) * item.quantity;
        await deductIngredient(mr.ingredientId, qty, orderId);
      }
    }

    // Mark item as deducted
    await db
      .update(orderItems)
      .set({ inventoryDeducted: true })
      .where(eq(orderItems.id, item.id));
  }
}

async function deductIngredient(
  ingredientId: string,
  qty: number,
  orderId: string
) {
  const [ingredient] = await db
    .select()
    .from(ingredients)
    .where(eq(ingredients.id, ingredientId));

  if (!ingredient) return;

  const stockBefore = parseFloat(ingredient.stock);
  const stockAfter = Math.max(0, stockBefore - qty);

  await db
    .update(ingredients)
    .set({
      stock: stockAfter.toFixed(3),
      updatedAt: new Date(),
    })
    .where(eq(ingredients.id, ingredientId));

  await db.insert(inventoryTransactions).values({
    ingredientId,
    orderId,
    type: "sale",
    quantity: (-qty).toFixed(3),
    stockBefore: stockBefore.toFixed(3),
    stockAfter: stockAfter.toFixed(3),
    note: `Auto-deducted from order`,
  });
}

export async function adjustStock(
  ingredientId: string,
  quantity: number,
  type: "purchase" | "adjustment" | "waste",
  note: string,
  performedById?: string
) {
  const [ingredient] = await db
    .select()
    .from(ingredients)
    .where(eq(ingredients.id, ingredientId));

  if (!ingredient) throw new Error("Ingredient not found");

  const stockBefore = parseFloat(ingredient.stock);
  const stockAfter = stockBefore + quantity;

  await db
    .update(ingredients)
    .set({
      stock: stockAfter.toFixed(3),
      updatedAt: new Date(),
    })
    .where(eq(ingredients.id, ingredientId));

  await db.insert(inventoryTransactions).values({
    ingredientId,
    type,
    quantity: quantity.toFixed(3),
    stockBefore: stockBefore.toFixed(3),
    stockAfter: stockAfter.toFixed(3),
    note,
    performedById: performedById || null,
  });

  return { success: true, stockAfter };
}

export async function createIngredient(data: {
  name: string;
  unit: string;
  stock?: string;
  minStock?: string;
  costPerUnit?: string;
}) {
  const [created] = await db
    .insert(ingredients)
    .values({
      name: data.name,
      unit: data.unit,
      stock: data.stock || "0",
      minStock: data.minStock || "0",
      costPerUnit: data.costPerUnit || "0",
    })
    .returning();

  revalidatePath("/admin/inventory");
  return { success: true, data: created };
}

export async function updateIngredient(
  id: string,
  data: {
    name?: string;
    unit?: string;
    minStock?: string;
    costPerUnit?: string;
    isActive?: boolean;
  }
) {
  const [updated] = await db
    .update(ingredients)
    .set({
      ...data,
      updatedAt: new Date(),
    })
    .where(eq(ingredients.id, id))
    .returning();

  revalidatePath("/admin/inventory");
  return { success: true, data: updated };
}

export async function deleteIngredient(id: string) {
  await db.delete(ingredients).where(eq(ingredients.id, id));
  revalidatePath("/admin/inventory");
  return { success: true };
}
