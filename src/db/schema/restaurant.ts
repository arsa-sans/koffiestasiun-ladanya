// src/db/schema/restaurant.ts
import {
  pgTable,
  uuid,
  text,
  timestamp,
  pgEnum,
  boolean,
  integer,
} from "drizzle-orm/pg-core";

export const tableStatusEnum = pgEnum("table_status", [
  "available",
  "occupied",
  "reserved",
  "cleaning",
]);

export const stationTypeEnum = pgEnum("station_type", [
  "bar",
  "kitchen",
  "sushi",
]);

export const diningTables = pgTable("dining_tables", {
  id: uuid("id").primaryKey().defaultRandom(),
  code: text("code").notNull().unique(), // A01, B03 etc
  name: text("name").notNull(),
  capacity: integer("capacity").notNull().default(4),
  status: tableStatusEnum("status").notNull().default("available"),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const kitchenStations = pgTable("kitchen_stations", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  type: stationTypeEnum("type").notNull(),
  description: text("description"),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export type DiningTable = typeof diningTables.$inferSelect;
export type NewDiningTable = typeof diningTables.$inferInsert;
export type KitchenStation = typeof kitchenStations.$inferSelect;
export type NewKitchenStation = typeof kitchenStations.$inferInsert;
