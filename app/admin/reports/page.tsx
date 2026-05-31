export const dynamic = "force-dynamic";
export const revalidate = 0;

// app/admin/reports/page.tsx
import { db } from "@/db";
import { eq, gte, desc, and, isNotNull } from "drizzle-orm";
import { orderItems } from "@/db/schema";
import ReportsClient from "@/components/admin/ReportsClient";

export default async function ReportsPage() {
  const allOrders = await db.query.orders.findMany({
    orderBy: (o, { desc }) => [desc(o.createdAt)],
    limit: 100,
    with: { table: true, items: { with: { product: { with: { station: true } } } }, payments: true },
  });

  const completedItems = await db.query.orderItems.findMany({
    where: and(isNotNull(orderItems.startedAt), isNotNull(orderItems.completedAt)),
    with: { product: { with: { station: true } } }
  });

  let totalPrepTime = 0;
  let itemsCount = 0;
  
  const stationMetrics: Record<string, { count: number; totalTime: number }> = {};

  for (const item of completedItems) {
    if (item.startedAt && item.completedAt) {
      const timeMs = item.completedAt.getTime() - item.startedAt.getTime();
      totalPrepTime += timeMs;
      itemsCount++;

      const stationId = item.product.station?.id || "unknown";
      const stationName = item.product.station?.name || "Unknown Station";
      
      if (!stationMetrics[stationId]) {
        stationMetrics[stationId] = { count: 0, totalTime: 0, name: stationName } as any;
      }
      stationMetrics[stationId].count++;
      stationMetrics[stationId].totalTime += timeMs;
    }
  }

  const avgPrepTimeMins = itemsCount > 0 ? (totalPrepTime / itemsCount) / 60000 : 0;
  
  const formattedStationMetrics = Object.values(stationMetrics).map((s: any) => ({
    name: s.name,
    count: s.count,
    avgTimeMins: s.count > 0 ? (s.totalTime / s.count) / 60000 : 0
  }));

  return (
    <ReportsClient
      orders={allOrders.map((o) => ({
        id: o.id, orderNumber: o.orderNumber, status: o.status,
        subtotal: String(o.subtotal), taxAmount: String(o.taxAmount),
        serviceAmount: String(o.serviceAmount), totalAmount: String(o.totalAmount),
        createdAt: o.createdAt.toISOString(), paidAt: o.paidAt?.toISOString() || null,
        itemCount: o.items.length,
        paymentMethods: o.payments.map((p) => p.method),
      }))}
      kitchenMetrics={{
        avgPrepTimeMins,
        itemsCount,
        stationMetrics: formattedStationMetrics
      }}
    />
  );
}
