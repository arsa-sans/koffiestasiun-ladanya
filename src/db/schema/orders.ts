// src/db/schema/orders.ts
import {
  pgTable,
  uuid,
  text,
  timestamp,
  boolean,
  numeric,
  pgEnum,
  index,
  integer,
} from "drizzle-orm/pg-core";
import { diningTables } from "./restaurant";
import { users } from "./auth";
import { products } from "./products";
import { modifierOptions } from "./modifiers";

export const orderStatusEnum = pgEnum("order_status", [
  "open",
  "paid",
  "void",
  "canceled",
]);

export const itemStatusEnum = pgEnum("item_status", [
  "pending",
  "queued",
  "cooking",
  "ready",
  "delivered",
  "canceled",
  "void",
]);

export const paymentMethodEnum = pgEnum("payment_method", [
  "cash",
  "qris",
  "card",
  "ewallet",
  "transfer",
]);

export const orderTypeEnum = pgEnum("order_type", ["dine_in", "takeaway"]);

export const orders = pgTable(
  "orders",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    orderNumber: text("order_number").notNull().unique(), // ORD-20240514-001
    tableId: uuid("table_id").references(() => diningTables.id),
    cashierId: uuid("cashier_id").references(() => users.id),
    customerName: text("customer_name"),
    orderType: orderTypeEnum("order_type").notNull().default("dine_in"),
    status: orderStatusEnum("status").notNull().default("open"),
    subtotal: numeric("subtotal", { precision: 12, scale: 2 })
      .notNull()
      .default("0"),
    taxAmount: numeric("tax_amount", { precision: 12, scale: 2 })
      .notNull()
      .default("0"),
    serviceAmount: numeric("service_amount", { precision: 12, scale: 2 })
      .notNull()
      .default("0"),
    discountAmount: numeric("discount_amount", { precision: 12, scale: 2 })
      .notNull()
      .default("0"),
    totalAmount: numeric("total_amount", { precision: 12, scale: 2 })
      .notNull()
      .default("0"),
    notes: text("notes"),
    paidAt: timestamp("paid_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index("orders_status_idx").on(table.status),
    index("orders_table_idx").on(table.tableId),
    index("orders_cashier_idx").on(table.cashierId),
    index("orders_created_idx").on(table.createdAt),
  ]
);

export const orderItems = pgTable(
  "order_items",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    orderId: uuid("order_id")
      .notNull()
      .references(() => orders.id, { onDelete: "cascade" }),
    productId: uuid("product_id")
      .notNull()
      .references(() => products.id),
    quantity: integer("quantity").notNull().default(1),
    unitPrice: numeric("unit_price", { precision: 12, scale: 2 }).notNull(),
    totalPrice: numeric("total_price", { precision: 12, scale: 2 }).notNull(),
    status: itemStatusEnum("status").notNull().default("pending"),
    notes: text("notes"),
    inventoryDeducted: boolean("inventory_deducted").notNull().default(false),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index("order_items_order_idx").on(table.orderId),
    index("order_items_product_idx").on(table.productId),
    index("order_items_status_idx").on(table.status),
  ]
);

export const orderItemModifiers = pgTable(
  "order_item_modifiers",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    orderItemId: uuid("order_item_id")
      .notNull()
      .references(() => orderItems.id, { onDelete: "cascade" }),
    modifierOptionId: uuid("modifier_option_id")
      .notNull()
      .references(() => modifierOptions.id),
    name: text("name").notNull(), // snapshot
    price: numeric("price", { precision: 12, scale: 2 }).notNull().default("0"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index("order_item_modifiers_item_idx").on(table.orderItemId),
  ]
);

export const payments = pgTable(
  "payments",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    orderId: uuid("order_id")
      .notNull()
      .references(() => orders.id, { onDelete: "cascade" }),
    method: paymentMethodEnum("method").notNull(),
    amount: numeric("amount", { precision: 12, scale: 2 }).notNull(),
    reference: text("reference"), // QRIS reference, card last 4
    note: text("note"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [index("payments_order_idx").on(table.orderId)]
);

export const voidLogs = pgTable(
  "void_logs",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    orderId: uuid("order_id").references(() => orders.id),
    orderItemId: uuid("order_item_id").references(() => orderItems.id),
    reason: text("reason").notNull(),
    voidedById: uuid("voided_by_id").references(() => users.id),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [index("void_logs_order_idx").on(table.orderId)]
);

export type Order = typeof orders.$inferSelect;
export type NewOrder = typeof orders.$inferInsert;
export type OrderItem = typeof orderItems.$inferSelect;
export type NewOrderItem = typeof orderItems.$inferInsert;
export type OrderItemModifier = typeof orderItemModifiers.$inferSelect;
export type NewOrderItemModifier = typeof orderItemModifiers.$inferInsert;
export type Payment = typeof payments.$inferSelect;
export type NewPayment = typeof payments.$inferInsert;
export type VoidLog = typeof voidLogs.$inferSelect;
export type NewVoidLog = typeof voidLogs.$inferInsert;
