// app/api/kitchen/orders/route.ts
import { getKitchenOrders } from "@/server/queries/orders";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET() {
  const rawOrders = await getKitchenOrders();

  const orders = rawOrders.map((order) => ({
    id: order.id,
    orderNumber: order.orderNumber,
    orderType: order.orderType,
    createdAt: order.createdAt.toISOString(),
    table: order.table ? { code: order.table.code } : null,
    items: order.items.map((item) => ({
      id: item.id,
      quantity: item.quantity,
      status: item.status,
      notes: item.notes,
      createdAt: item.createdAt.toISOString(),
      startedAt: item.startedAt ? item.startedAt.toISOString() : null,
      completedAt: item.completedAt ? item.completedAt.toISOString() : null,
      product: {
        name: item.product.name,
        station: { type: item.product.station?.type || "kitchen" },
      },
      modifiers: item.modifiers.map((m) => ({ name: m.name })),
    })),
  }));

  return NextResponse.json({ orders });
}
