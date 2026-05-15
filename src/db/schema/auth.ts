// src/db/schema/auth.ts
import {
  pgTable,
  uuid,
  text,
  timestamp,
  pgEnum,
} from "drizzle-orm/pg-core";

export const userRoleEnum = pgEnum("user_role", [
  "admin",
  "cashier",
  "kitchen",
]);

export const users = pgTable("users", {
  id: uuid("id").primaryKey().defaultRandom(),
  authId: uuid("auth_id").unique(), // Supabase auth.users id
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  role: userRoleEnum("role").notNull().default("cashier"),
  avatarUrl: text("avatar_url"),
  isActive: text("is_active").notNull().default("true"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
