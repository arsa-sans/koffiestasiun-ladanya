// src/db/schema/modifiers.ts
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
import { products } from "./products";
import { ingredients } from "./products";

export const modifierGroups = pgTable("modifier_groups", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(), // Size, Toppings, Sugar Level
  description: text("description"),
  isRequired: boolean("is_required").notNull().default(false),
  isMultiple: boolean("is_multiple").notNull().default(false), // allow multi-select
  minSelect: integer("min_select").notNull().default(0),
  maxSelect: integer("max_select").notNull().default(1),
  sortOrder: integer("sort_order").notNull().default(0),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const modifierOptions = pgTable(
  "modifier_options",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    groupId: uuid("group_id")
      .notNull()
      .references(() => modifierGroups.id, { onDelete: "cascade" }),
    name: text("name").notNull(), // Small, Large, Boba, Extra Shot
    price: numeric("price", { precision: 12, scale: 2 }).notNull().default("0"),
    sortOrder: integer("sort_order").notNull().default(0),
    isActive: boolean("is_active").notNull().default(true),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [index("modifier_options_group_idx").on(table.groupId)]
);

// Modifier ingredient deduction recipes
export const modifierRecipes = pgTable(
  "modifier_recipes",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    modifierOptionId: uuid("modifier_option_id")
      .notNull()
      .references(() => modifierOptions.id, { onDelete: "cascade" }),
    ingredientId: uuid("ingredient_id")
      .notNull()
      .references(() => ingredients.id),
    quantity: numeric("quantity", { precision: 12, scale: 3 }).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index("modifier_recipes_option_idx").on(table.modifierOptionId),
    index("modifier_recipes_ingredient_idx").on(table.ingredientId),
  ]
);

// Product <-> ModifierGroup join table
export const productModifierGroups = pgTable(
  "product_modifier_groups",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    productId: uuid("product_id")
      .notNull()
      .references(() => products.id, { onDelete: "cascade" }),
    modifierGroupId: uuid("modifier_group_id")
      .notNull()
      .references(() => modifierGroups.id, { onDelete: "cascade" }),
    sortOrder: integer("sort_order").notNull().default(0),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index("pmg_product_idx").on(table.productId),
    index("pmg_group_idx").on(table.modifierGroupId),
  ]
);

export type ModifierGroup = typeof modifierGroups.$inferSelect;
export type NewModifierGroup = typeof modifierGroups.$inferInsert;
export type ModifierOption = typeof modifierOptions.$inferSelect;
export type NewModifierOption = typeof modifierOptions.$inferInsert;
export type ModifierRecipe = typeof modifierRecipes.$inferSelect;
export type NewModifierRecipe = typeof modifierRecipes.$inferInsert;
export type ProductModifierGroup = typeof productModifierGroups.$inferSelect;
export type NewProductModifierGroup = typeof productModifierGroups.$inferInsert;
