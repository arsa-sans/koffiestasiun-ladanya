export const dynamic = "force-dynamic";
export const revalidate = 0;

// app/admin/page.tsx — Analytics Overview
import { db } from "@/db";
import { orders, orderItems, ingredients } from "@/db/schema";
import { eq, gte, sql, lte, and } from "drizzle-orm";
import AdminOverviewClient from "@/components/admin/AdminOverviewClient";

export default async function AdminPage() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayEnd = new Date();
  todayEnd.setHours(23, 59, 59, 999);

  const [todayRevenue, totalOrders, lowStockCount, recentOrders] = await Promise.all([
    db.select({ total: sql<string>`COALESCE(SUM(${orders.totalAmount}), 0)`, count: sql<number>`COUNT(*)` })
      .from(orders).where(and(eq(orders.status, "paid"), gte(orders.paidAt!, today))),
    db.select({ count: sql<number>`COUNT(*)` }).from(orders).where(eq(orders.status, "open")),
    db.select({ count: sql<number>`COUNT(*)` }).from(ingredients)
      .where(and(eq(ingredients.isActive, true), sql`${ingredients.stock} <= ${ingredients.minStock} * 1.2`)),
    db.query.orders.findMany({
      orderBy: (o, { desc }) => [desc(o.createdAt)],
      limit: 10,
      with: { table: true, items: { with: { product: true } }, payments: true },
    }),
  ]);

  return (
    <AdminOverviewClient
      todayRevenue={parseFloat(todayRevenue[0]?.total || "0")}
      todayOrderCount={Number(todayRevenue[0]?.count || 0)}
      activeOrders={Number(totalOrders[0]?.count || 0)}
      lowStockCount={Number(lowStockCount[0]?.count || 0)}
      recentOrders={recentOrders.map((o) => ({
        id: o.id,
        orderNumber: o.orderNumber,
        status: o.status,
        totalAmount: String(o.totalAmount),
        createdAt: o.createdAt.toISOString(),
        tableCode: o.table?.code || null,
        itemCount: o.items.length,
      }))}
    />
  );
}
