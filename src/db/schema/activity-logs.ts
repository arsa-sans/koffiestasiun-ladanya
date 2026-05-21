// src/db/schema/activity-logs.ts
import {
  pgTable,
  uuid,
  text,
  timestamp,
  jsonb,
  index,
} from "drizzle-orm/pg-core";
import { users } from "./auth";

export const activityLogs = pgTable(
  "activity_logs",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id").references(() => users.id),
    role: text("role"), // admin, cashier, kitchen
    activity: text("activity").notNull(), // login, logout, create, update, delete, payment, stock_change
    entityType: text("entity_type"), // order, product, ingredient, user, table, category, fee
    entityId: text("entity_id"), // ID of the affected entity
    description: text("description"), // Human-readable description
    metadata: jsonb("metadata"), // Additional data (JSON)
    page: text("page"), // /admin, /cashier, /kitchen
    ipAddress: text("ip_address"),
    userAgent: text("user_agent"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index("activity_logs_user_idx").on(table.userId),
    index("activity_logs_activity_idx").on(table.activity),
    index("activity_logs_entity_idx").on(table.entityType),
    index("activity_logs_created_idx").on(table.createdAt),
  ]
);

export type ActivityLog = typeof activityLogs.$inferSelect;
export type NewActivityLog = typeof activityLogs.$inferInsert;
