// src/db/schema/inventory.ts
import {
  pgTable,
  uuid,
  text,
  timestamp,
  numeric,
  pgEnum,
  index,
} from "drizzle-orm/pg-core";
import { ingredients } from "./products";
import { orders } from "./orders";
import { users } from "./auth";

export const transactionTypeEnum = pgEnum("transaction_type", [
  "purchase",
  "sale",
  "adjustment",
  "waste",
  "opname",
]);

export const inventoryTransactions = pgTable(
  "inventory_transactions",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    ingredientId: uuid("ingredient_id")
      .notNull()
      .references(() => ingredients.id),
    orderId: uuid("order_id").references(() => orders.id),
    type: transactionTypeEnum("type").notNull(),
    quantity: numeric("quantity", { precision: 12, scale: 3 }).notNull(), // + add, - deduct
    stockBefore: numeric("stock_before", {
      precision: 12,
      scale: 3,
    }).notNull(),
    stockAfter: numeric("stock_after", { precision: 12, scale: 3 }).notNull(),
    note: text("note"),
    performedById: uuid("performed_by_id").references(() => users.id),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index("inv_tx_ingredient_idx").on(table.ingredientId),
    index("inv_tx_order_idx").on(table.orderId),
    index("inv_tx_type_idx").on(table.type),
    index("inv_tx_created_idx").on(table.createdAt),
  ]
);

export const opnameStatusEnum = pgEnum("opname_status", [
  "draft",
  "confirmed",
]);

export const stockOpnames = pgTable(
  "stock_opnames",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    code: text("code").notNull().unique(), // OPN-20240514-001
    status: opnameStatusEnum("status").notNull().default("draft"),
    notes: text("notes"),
    performedById: uuid("performed_by_id").references(() => users.id),
    confirmedAt: timestamp("confirmed_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  }
);

export const stockOpnameItems = pgTable(
  "stock_opname_items",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    opnameId: uuid("opname_id")
      .notNull()
      .references(() => stockOpnames.id, { onDelete: "cascade" }),
    ingredientId: uuid("ingredient_id")
      .notNull()
      .references(() => ingredients.id),
    systemStock: numeric("system_stock", {
      precision: 12,
      scale: 3,
    }).notNull(),
    physicalStock: numeric("physical_stock", {
      precision: 12,
      scale: 3,
    }).notNull(),
    variance: numeric("variance", { precision: 12, scale: 3 }).notNull(), // physical - system
    note: text("note"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index("opname_items_opname_idx").on(table.opnameId),
    index("opname_items_ingredient_idx").on(table.ingredientId),
  ]
);

export type InventoryTransaction = typeof inventoryTransactions.$inferSelect;
export type NewInventoryTransaction = typeof inventoryTransactions.$inferInsert;
export type StockOpname = typeof stockOpnames.$inferSelect;
export type NewStockOpname = typeof stockOpnames.$inferInsert;
export type StockOpnameItem = typeof stockOpnameItems.$inferSelect;
export type NewStockOpnameItem = typeof stockOpnameItems.$inferInsert;
