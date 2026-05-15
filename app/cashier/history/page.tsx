export const dynamic = "force-dynamic";
export const revalidate = 0;

// app/cashier/history/page.tsx
import { getOrderHistory } from "@/server/queries/orders";
import { formatCurrency, formatDateTime } from "@/lib/utils/format";
import { STATUS_COLORS } from "@/constants";

export default async function CashierHistoryPage() {
  const orders = await getOrderHistory(50);

  return (
    <div className="p-6 space-y-6" style={{ height: "100vh", overflowY: "auto" }}>
      <h1 className="text-2xl font-bold" style={{ color: "#EADBC8", fontFamily: "Playfair Display, serif" }}>
        Riwayat Order
      </h1>

      <div className="rounded-2xl overflow-hidden" style={{ background: "#181818", border: "1px solid rgba(255,255,255,0.05)" }}>
        <table className="pos-table">
          <thead>
            <tr><th>No. Order</th><th>Pelanggan</th><th>Meja</th><th>Item</th><th>Total</th><th>Status</th><th>Waktu</th></tr>
          </thead>
          <tbody>
            {orders.map((order) => {
              const sc = STATUS_COLORS[order.status] || "#C08B5C";
              return (
                <tr key={order.id}>
                  <td><span className="font-mono text-xs" style={{ color: "#C08B5C" }}>{order.orderNumber}</span></td>
                  <td style={{ color: "rgba(216,198,181,0.7)" }}>{order.customerName || "—"}</td>
                  <td style={{ color: "rgba(216,198,181,0.7)" }}>{order.table?.code ? `Meja ${order.table.code}` : "Takeaway"}</td>
                  <td style={{ color: "rgba(216,198,181,0.7)" }}>{order.items.length} item</td>
                  <td className="font-semibold" style={{ color: "#EADBC8" }}>{formatCurrency(parseFloat(String(order.totalAmount)))}</td>
                  <td><span className="text-xs px-2.5 py-1 rounded-full" style={{ background: `${sc}18`, color: sc }}>{order.status}</span></td>
                  <td className="text-xs" style={{ color: "rgba(216,198,181,0.4)" }}>{formatDateTime(order.createdAt)}</td>
                </tr>
              );
            })}
            {orders.length === 0 && (
              <tr><td colSpan={7} className="text-center py-8" style={{ color: "rgba(216,198,181,0.4)" }}>Belum ada order</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
