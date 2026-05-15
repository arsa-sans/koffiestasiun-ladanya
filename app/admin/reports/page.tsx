export const dynamic = "force-dynamic";
export const revalidate = 0;

// app/admin/reports/page.tsx
import { db } from "@/db";
import { orders, payments } from "@/db/schema";
import { eq, gte, desc } from "drizzle-orm";
import ReportsClient from "@/components/admin/ReportsClient";

export default async function ReportsPage() {
  const allOrders = await db.query.orders.findMany({
    orderBy: (o, { desc }) => [desc(o.createdAt)],
    limit: 100,
    with: { table: true, items: { with: { product: true } }, payments: true },
  });

  return (
    <ReportsClient
      orders={allOrders.map((o) => ({
        id: o.id, orderNumber: o.orderNumber, status: o.status,
        subtotal: String(o.subtotal), taxAmount: String(o.taxAmount),
        serviceAmount: String(o.serviceAmount), totalAmount: String(o.totalAmount),
        createdAt: o.createdAt.toISOString(), paidAt: o.paidAt?.toISOString() || null,
        tableCode: o.table?.code || null, itemCount: o.items.length,
        paymentMethods: o.payments.map((p) => p.method),
      }))}
    />
  );
}
