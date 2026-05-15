// app/kitchen/page.tsx
import { getKitchenOrders } from "@/server/queries/orders";
import KitchenClient from "@/components/kitchen/KitchenClient";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function KitchenPage() {
  const rawOrders = await getKitchenOrders();

  const orders = rawOrders.map((order) => ({
    id: order.id,
    orderNumber: order.orderNumber,
    createdAt: order.createdAt.toISOString(),
    table: order.table ? { code: order.table.code } : null,
    items: order.items.map((item) => ({
      id: item.id,
      quantity: item.quantity,
      status: item.status,
      notes: item.notes,
      createdAt: item.createdAt.toISOString(),
      product: {
        name: item.product.name,
        station: { type: item.product.station?.type || "kitchen" },
      },
      modifiers: item.modifiers.map((m) => ({ name: m.name })),
    })),
  }));

  return <KitchenClient initialOrders={orders} />;
}
