// src/server/queries/orders.ts
"use server";

import { db } from "@/db";
import { orders, orderItems, payments, diningTables } from "@/db/schema";
import { eq, desc, and, gte, lte, sql } from "drizzle-orm";

export async function getActiveOrders() {
  return db.query.orders.findMany({
    where: eq(orders.status, "open"),
    orderBy: desc(orders.createdAt),
    with: {
      table: true,
      cashier: true,
      items: {
        with: {
          product: true,
          modifiers: true,
        },
      },
      payments: true,
    },
  });
}

export async function getOrderById(id: string) {
  return db.query.orders.findFirst({
    where: eq(orders.id, id),
    with: {
      table: true,
      cashier: true,
      items: {
        with: {
          product: true,
          modifiers: true,
        },
      },
      payments: true,
    },
  });
}

export async function getKitchenOrders() {
  return db.query.orders.findMany({
    where: eq(orders.status, "open"),
    orderBy: desc(orders.createdAt),
    with: {
      table: true,
      items: {
        with: {
          product: {
            with: { station: true },
          },
          modifiers: true,
        },
      },
    },
  });
}

export async function getOrderHistory(limit = 50) {
  return db.query.orders.findMany({
    orderBy: desc(orders.createdAt),
    limit,
    with: {
      table: true,
      cashier: true,
      items: { with: { product: true, modifiers: true } },
      payments: true,
    },
  });
}

export async function getDailyRevenue(date: Date) {
  const start = new Date(date);
  start.setHours(0, 0, 0, 0);
  const end = new Date(date);
  end.setHours(23, 59, 59, 999);

  const result = await db
    .select({
      total: sql<number>`COALESCE(SUM(${orders.totalAmount}), 0)`,
      count: sql<number>`COUNT(*)`,
    })
    .from(orders)
    .where(
      and(
        eq(orders.status, "paid"),
        gte(orders.paidAt, start),
        lte(orders.paidAt, end)
      )
    );

  return result[0];
}
