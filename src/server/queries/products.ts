// src/server/queries/products.ts
"use server";

import { db } from "@/db";
import { categories, products, ingredients, recipes, modifierGroups, modifierOptions, productModifierGroups } from "@/db/schema";
import { eq, and, asc, ilike } from "drizzle-orm";

export async function getCategories() {
  return db
    .select()
    .from(categories)
    .where(eq(categories.isActive, true))
    .orderBy(asc(categories.sortOrder));
}

export async function getProducts(categoryId?: string) {
  const conditions = [eq(products.isAvailable, true)];
  if (categoryId) {
    conditions.push(eq(products.categoryId, categoryId));
  }
  return db
    .select({
      id: products.id,
      name: products.name,
      description: products.description,
      price: products.price,
      imageUrl: products.imageUrl,
      isAvailable: products.isAvailable,
      categoryId: products.categoryId,
      stationId: products.stationId,
    })
    .from(products)
    .where(and(...conditions))
    .orderBy(asc(products.sortOrder));
}

export async function getAllProducts() {
  return db
    .select()
    .from(products)
    .orderBy(asc(products.sortOrder));
}

export async function getProductWithModifiers(productId: string) {
  const product = await db.query.products.findFirst({
    where: eq(products.id, productId),
    with: {
      recipes: {
        with: { ingredient: true },
      },
      productModifierGroups: {
        orderBy: asc(productModifierGroups.sortOrder),
        with: {
          modifierGroup: {
            with: {
              options: {
                where: eq(modifierOptions.isActive, true),
                orderBy: asc(modifierOptions.sortOrder),
              },
            },
          },
        },
      },
    },
  });
  return product;
}

export async function getIngredients() {
  return db.select().from(ingredients).where(eq(ingredients.isActive, true)).orderBy(asc(ingredients.name));
}

export async function getAllIngredients() {
  return db.select().from(ingredients).orderBy(asc(ingredients.name));
}

export async function getModifierGroups() {
  return db.query.modifierGroups.findMany({
    where: eq(modifierGroups.isActive, true),
    orderBy: asc(modifierGroups.sortOrder),
    with: {
      options: {
        where: eq(modifierOptions.isActive, true),
        orderBy: asc(modifierOptions.sortOrder),
      },
    },
  });
}
