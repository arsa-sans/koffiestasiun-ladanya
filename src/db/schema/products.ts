// src/db/schema/products.ts
import {
  pgTable,
  uuid,
  text,
  timestamp,
  boolean,
  integer,
  numeric,
  index,
} from "drizzle-orm/pg-core";
import { kitchenStations } from "./restaurant";

export const categories = pgTable("categories", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  slug: text("slug").notNull().unique(),
  description: text("description"),
  imageUrl: text("image_url"),
  sortOrder: integer("sort_order").notNull().default(0),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const products = pgTable(
  "products",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    categoryId: uuid("category_id")
      .notNull()
      .references(() => categories.id),
    stationId: uuid("station_id")
      .notNull()
      .references(() => kitchenStations.id),
    name: text("name").notNull(),
    description: text("description"),
    price: numeric("price", { precision: 12, scale: 2 }).notNull(),
    imageUrl: text("image_url"),
    isAvailable: boolean("is_available").notNull().default(true),
    sortOrder: integer("sort_order").notNull().default(0),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index("products_category_idx").on(table.categoryId),
    index("products_station_idx").on(table.stationId),
  ]
);

export const ingredients = pgTable("ingredients", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  unit: text("unit").notNull(), // ml, gr, pcs, liter
  stock: numeric("stock", { precision: 12, scale: 3 }).notNull().default("0"),
  minStock: numeric("min_stock", { precision: 12, scale: 3 })
    .notNull()
    .default("0"),
  costPerUnit: numeric("cost_per_unit", { precision: 12, scale: 2 })
    .notNull()
    .default("0"),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const recipes = pgTable(
  "recipes",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    productId: uuid("product_id")
      .notNull()
      .references(() => products.id, { onDelete: "cascade" }),
    ingredientId: uuid("ingredient_id")
      .notNull()
      .references(() => ingredients.id),
    quantity: numeric("quantity", { precision: 12, scale: 3 }).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index("recipes_product_idx").on(table.productId),
    index("recipes_ingredient_idx").on(table.ingredientId),
  ]
);

export type Category = typeof categories.$inferSelect;
export type NewCategory = typeof categories.$inferInsert;
export type Product = typeof products.$inferSelect;
export type NewProduct = typeof products.$inferInsert;
export type Ingredient = typeof ingredients.$inferSelect;
export type NewIngredient = typeof ingredients.$inferInsert;
export type Recipe = typeof recipes.$inferSelect;
export type NewRecipe = typeof recipes.$inferInsert;
