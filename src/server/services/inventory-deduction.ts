// src/server/services/inventory-deduction.ts
import { db } from "@/db";
import {
  orderItems,
  recipes,
  orderItemModifiers,
  modifierRecipes,
  ingredients,
  inventoryTransactions,
} from "@/db/schema";
import { eq, inArray } from "drizzle-orm";

export async function deductInventoryForItem(orderItemId: string) {
  return await db.transaction(async (tx) => {
    // 1. Fetch order item with modifiers
    const item = await tx.query.orderItems.findFirst({
      where: eq(orderItems.id, orderItemId),
      with: {
        order: true,
      },
    });

    if (!item || item.inventoryDeducted) {
      return { success: false, message: "Item not found or already deducted" };
    }

    const itemModifiers = await tx.query.orderItemModifiers.findMany({
      where: eq(orderItemModifiers.orderItemId, orderItemId),
    });

    // 2. Map required ingredients and quantities
    const requiredIngredients: Record<string, number> = {};

    // 2a. Product recipe
    const productRecipes = await tx.query.recipes.findMany({
      where: eq(recipes.productId, item.productId),
    });

    for (const recipe of productRecipes) {
      const totalQty = Number(recipe.quantity) * item.quantity;
      requiredIngredients[recipe.ingredientId] =
        (requiredIngredients[recipe.ingredientId] || 0) + totalQty;
    }

    // 2b. Modifier recipes
    if (itemModifiers.length > 0) {
      const modifierOptionIds = itemModifiers.map((m) => m.modifierOptionId);
      const modRecipes = await tx.query.modifierRecipes.findMany({
        where: inArray(modifierRecipes.modifierOptionId, modifierOptionIds),
      });

      for (const recipe of modRecipes) {
        const totalQty = Number(recipe.quantity) * item.quantity;
        requiredIngredients[recipe.ingredientId] =
          (requiredIngredients[recipe.ingredientId] || 0) + totalQty;
      }
    }

    // 3. Process deductions
    const ingredientIds = Object.keys(requiredIngredients);
    if (ingredientIds.length === 0) {
      // No ingredients to deduct, just mark as deducted
      await tx
        .update(orderItems)
        .set({ inventoryDeducted: true })
        .where(eq(orderItems.id, orderItemId));
      return { success: true };
    }

    const currentIngredients = await tx.query.ingredients.findMany({
      where: inArray(ingredients.id, ingredientIds),
    });

    for (const ingredient of currentIngredients) {
      const qtyToDeduct = requiredIngredients[ingredient.id];
      if (!qtyToDeduct) continue;

      const stockBefore = Number(ingredient.stock);
      const stockAfter = stockBefore - qtyToDeduct;

      // Update stock
      await tx
        .update(ingredients)
        .set({
          stock: stockAfter.toFixed(3),
          updatedAt: new Date(),
        })
        .where(eq(ingredients.id, ingredient.id));

      // Record transaction
      await tx.insert(inventoryTransactions).values({
        ingredientId: ingredient.id,
        orderId: item.orderId,
        type: "sale",
        quantity: qtyToDeduct.toFixed(3),
        stockBefore: stockBefore.toFixed(3),
        stockAfter: stockAfter.toFixed(3),
        note: `Order ${item.order?.orderNumber} - Item deduction`,
      });

      // Optional: Check min stock and log warning here
      if (stockAfter < Number(ingredient.minStock)) {
        console.warn(`Low stock alert for ingredient: ${ingredient.name}`);
      }
    }

    // 4. Mark item as deducted
    await tx
      .update(orderItems)
      .set({ inventoryDeducted: true })
      .where(eq(orderItems.id, orderItemId));

    return { success: true };
  });
}

export async function restoreInventoryForItem(orderItemId: string, performedById?: string) {
  return await db.transaction(async (tx) => {
    // 1. Fetch order item
    const item = await tx.query.orderItems.findFirst({
      where: eq(orderItems.id, orderItemId),
      with: {
        order: true,
      },
    });

    if (!item || !item.inventoryDeducted) {
      return { success: false, message: "Item not found or not deducted" };
    }

    const itemModifiers = await tx.query.orderItemModifiers.findMany({
      where: eq(orderItemModifiers.orderItemId, orderItemId),
    });

    // 2. Map required ingredients to restore
    const requiredIngredients: Record<string, number> = {};

    const productRecipes = await tx.query.recipes.findMany({
      where: eq(recipes.productId, item.productId),
    });

    for (const recipe of productRecipes) {
      const totalQty = Number(recipe.quantity) * item.quantity;
      requiredIngredients[recipe.ingredientId] =
        (requiredIngredients[recipe.ingredientId] || 0) + totalQty;
    }

    if (itemModifiers.length > 0) {
      const modifierOptionIds = itemModifiers.map((m) => m.modifierOptionId);
      const modRecipes = await tx.query.modifierRecipes.findMany({
        where: inArray(modifierRecipes.modifierOptionId, modifierOptionIds),
      });

      for (const recipe of modRecipes) {
        const totalQty = Number(recipe.quantity) * item.quantity;
        requiredIngredients[recipe.ingredientId] =
          (requiredIngredients[recipe.ingredientId] || 0) + totalQty;
      }
    }

    // 3. Process restoration
    const ingredientIds = Object.keys(requiredIngredients);
    if (ingredientIds.length === 0) {
      await tx
        .update(orderItems)
        .set({ inventoryDeducted: false })
        .where(eq(orderItems.id, orderItemId));
      return { success: true };
    }

    const currentIngredients = await tx.query.ingredients.findMany({
      where: inArray(ingredients.id, ingredientIds),
    });

    for (const ingredient of currentIngredients) {
      const qtyToRestore = requiredIngredients[ingredient.id];
      if (!qtyToRestore) continue;

      const stockBefore = Number(ingredient.stock);
      const stockAfter = stockBefore + qtyToRestore;

      // Update stock
      await tx
        .update(ingredients)
        .set({
          stock: stockAfter.toFixed(3),
          updatedAt: new Date(),
        })
        .where(eq(ingredients.id, ingredient.id));

      // Record transaction
      await tx.insert(inventoryTransactions).values({
        ingredientId: ingredient.id,
        orderId: item.orderId,
        type: "adjustment", // or waste depending on logic, but adjustment/void fits best
        quantity: qtyToRestore.toFixed(3),
        stockBefore: stockBefore.toFixed(3),
        stockAfter: stockAfter.toFixed(3),
        note: `Order ${item.order?.orderNumber} - Item void/cancel restoration`,
        performedById: performedById || null,
      });
    }

    // 4. Unmark item as deducted
    await tx
      .update(orderItems)
      .set({ inventoryDeducted: false })
      .where(eq(orderItems.id, orderItemId));

    return { success: true };
  });
}
