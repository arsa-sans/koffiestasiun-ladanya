// src/server/queries/inventory.ts
"use server";

import { db } from "@/db";
import { ingredients, inventoryTransactions, stockOpnames } from "@/db/schema";
import { eq, desc, lt, sql, and } from "drizzle-orm";

export async function getLowStockIngredients() {
  return db
    .select()
    .from(ingredients)
    .where(
      and(
        eq(ingredients.isActive, true),
        sql`${ingredients.stock} <= ${ingredients.minStock} * 1.2`
      )
    )
    .orderBy(ingredients.name);
}

export async function getInventoryTransactions(ingredientId?: string, limit = 50) {
  return db.query.inventoryTransactions.findMany({
    where: ingredientId ? eq(inventoryTransactions.ingredientId, ingredientId) : undefined,
    orderBy: desc(inventoryTransactions.createdAt),
    limit,
    with: {
      ingredient: true,
      performedBy: true,
    },
  });
}

export async function getStockOpnames() {
  return db.query.stockOpnames.findMany({
    orderBy: desc(stockOpnames.createdAt),
    with: {
      performedBy: true,
      items: { with: { ingredient: true } },
    },
  });
}
