// src/db/schema/fees.ts
import {
  pgTable,
  uuid,
  text,
  timestamp,
  boolean,
  numeric,
  pgEnum,
} from "drizzle-orm/pg-core";

export const feeTypeEnum = pgEnum("fee_type", ["percentage", "fixed"]);

export const additionalFees = pgTable("additional_fees", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  type: feeTypeEnum("type").notNull().default("percentage"),
  value: numeric("value", { precision: 12, scale: 4 }).notNull().default("0"),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export type AdditionalFee = typeof additionalFees.$inferSelect;
export type NewAdditionalFee = typeof additionalFees.$inferInsert;
