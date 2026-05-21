// src/db/relations.ts
import { relations } from "drizzle-orm";
import {
  users,
  diningTables,
  kitchenStations,
  categories,
  products,
  ingredients,
  recipes,
  modifierGroups,
  modifierOptions,
  modifierRecipes,
  productModifierGroups,
  orders,
  orderItems,
  orderItemModifiers,
  payments,
  voidLogs,
  inventoryTransactions,
  stockOpnames,
  stockOpnameItems,
  activityLogs,
} from "./schema";

// --- Products ---
export const categoriesRelations = relations(categories, ({ many }) => ({
  products: many(products),
}));

export const productsRelations = relations(products, ({ one, many }) => ({
  category: one(categories, {
    fields: [products.categoryId],
    references: [categories.id],
  }),
  station: one(kitchenStations, {
    fields: [products.stationId],
    references: [kitchenStations.id],
  }),
  recipes: many(recipes),
  productModifierGroups: many(productModifierGroups),
  orderItems: many(orderItems),
}));

export const ingredientsRelations = relations(ingredients, ({ many }) => ({
  recipes: many(recipes),
  modifierRecipes: many(modifierRecipes),
  inventoryTransactions: many(inventoryTransactions),
  stockOpnameItems: many(stockOpnameItems),
}));

export const recipesRelations = relations(recipes, ({ one }) => ({
  product: one(products, {
    fields: [recipes.productId],
    references: [products.id],
  }),
  ingredient: one(ingredients, {
    fields: [recipes.ingredientId],
    references: [ingredients.id],
  }),
}));

// --- Modifiers ---
export const modifierGroupsRelations = relations(
  modifierGroups,
  ({ many }) => ({
    options: many(modifierOptions),
    productModifierGroups: many(productModifierGroups),
  })
);

export const modifierOptionsRelations = relations(
  modifierOptions,
  ({ one, many }) => ({
    group: one(modifierGroups, {
      fields: [modifierOptions.groupId],
      references: [modifierGroups.id],
    }),
    modifierRecipes: many(modifierRecipes),
    orderItemModifiers: many(orderItemModifiers),
  })
);

export const modifierRecipesRelations = relations(
  modifierRecipes,
  ({ one }) => ({
    modifierOption: one(modifierOptions, {
      fields: [modifierRecipes.modifierOptionId],
      references: [modifierOptions.id],
    }),
    ingredient: one(ingredients, {
      fields: [modifierRecipes.ingredientId],
      references: [ingredients.id],
    }),
  })
);

export const productModifierGroupsRelations = relations(
  productModifierGroups,
  ({ one }) => ({
    product: one(products, {
      fields: [productModifierGroups.productId],
      references: [products.id],
    }),
    modifierGroup: one(modifierGroups, {
      fields: [productModifierGroups.modifierGroupId],
      references: [modifierGroups.id],
    }),
  })
);

// --- Restaurant ---
export const diningTablesRelations = relations(diningTables, ({ many }) => ({
  orders: many(orders),
}));

export const kitchenStationsRelations = relations(
  kitchenStations,
  ({ many }) => ({
    products: many(products),
  })
);

// --- Orders ---
export const ordersRelations = relations(orders, ({ one, many }) => ({
  table: one(diningTables, {
    fields: [orders.tableId],
    references: [diningTables.id],
  }),
  cashier: one(users, {
    fields: [orders.cashierId],
    references: [users.id],
  }),
  items: many(orderItems),
  payments: many(payments),
  voidLogs: many(voidLogs),
  inventoryTransactions: many(inventoryTransactions),
}));

export const orderItemsRelations = relations(orderItems, ({ one, many }) => ({
  order: one(orders, {
    fields: [orderItems.orderId],
    references: [orders.id],
  }),
  product: one(products, {
    fields: [orderItems.productId],
    references: [products.id],
  }),
  modifiers: many(orderItemModifiers),
}));

export const orderItemModifiersRelations = relations(
  orderItemModifiers,
  ({ one }) => ({
    orderItem: one(orderItems, {
      fields: [orderItemModifiers.orderItemId],
      references: [orderItems.id],
    }),
    modifierOption: one(modifierOptions, {
      fields: [orderItemModifiers.modifierOptionId],
      references: [modifierOptions.id],
    }),
  })
);

export const paymentsRelations = relations(payments, ({ one }) => ({
  order: one(orders, {
    fields: [payments.orderId],
    references: [orders.id],
  }),
}));

export const voidLogsRelations = relations(voidLogs, ({ one }) => ({
  order: one(orders, {
    fields: [voidLogs.orderId],
    references: [orders.id],
  }),
  orderItem: one(orderItems, {
    fields: [voidLogs.orderItemId],
    references: [orderItems.id],
  }),
  voidedBy: one(users, {
    fields: [voidLogs.voidedById],
    references: [users.id],
  }),
}));

// --- Inventory ---
export const inventoryTransactionsRelations = relations(
  inventoryTransactions,
  ({ one }) => ({
    ingredient: one(ingredients, {
      fields: [inventoryTransactions.ingredientId],
      references: [ingredients.id],
    }),
    order: one(orders, {
      fields: [inventoryTransactions.orderId],
      references: [orders.id],
    }),
    performedBy: one(users, {
      fields: [inventoryTransactions.performedById],
      references: [users.id],
    }),
  })
);

export const stockOpnamesRelations = relations(stockOpnames, ({ one, many }) => ({
  performedBy: one(users, {
    fields: [stockOpnames.performedById],
    references: [users.id],
  }),
  items: many(stockOpnameItems),
}));

export const stockOpnameItemsRelations = relations(
  stockOpnameItems,
  ({ one }) => ({
    opname: one(stockOpnames, {
      fields: [stockOpnameItems.opnameId],
      references: [stockOpnames.id],
    }),
    ingredient: one(ingredients, {
      fields: [stockOpnameItems.ingredientId],
      references: [ingredients.id],
    }),
  })
);

// --- Activity Logs ---
export const activityLogsRelations = relations(activityLogs, ({ one }) => ({
  user: one(users, {
    fields: [activityLogs.userId],
    references: [users.id],
  }),
}));

// --- Users ---
export const usersRelations = relations(users, ({ many }) => ({
  orders: many(orders),
  voidLogs: many(voidLogs),
  inventoryTransactions: many(inventoryTransactions),
  stockOpnames: many(stockOpnames),
  activityLogs: many(activityLogs),
}));

