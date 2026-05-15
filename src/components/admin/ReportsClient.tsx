"use client";

import { formatCurrency, formatDateTime } from "@/lib/utils/format";
import { STATUS_COLORS, PAYMENT_METHOD_LABELS } from "@/constants";

interface Order {
  id: string; orderNumber: string; status: string; subtotal: string;
  taxAmount: string; serviceAmount: string; totalAmount: string;
  createdAt: string; paidAt: string | null; tableCode: string | null;
  itemCount: number; paymentMethods: string[];
}

export default function ReportsClient({ orders }: { orders: Order[] }) {
  const paidOrders = orders.filter((o) => o.status === "paid");
  const totalRevenue = paidOrders.reduce((s, o) => s + parseFloat(o.totalAmount), 0);
  const totalTax = paidOrders.reduce((s, o) => s + parseFloat(o.taxAmount), 0);
  const totalService = paidOrders.reduce((s, o) => s + parseFloat(o.serviceAmount), 0);

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-bold" style={{ color: "#EADBC8", fontFamily: "Playfair Display, serif" }}>Laporan Penjualan</h1>

      <div className="grid grid-cols-3 gap-4">
        {[
          { label: "Total Pendapatan", val: formatCurrency(totalRevenue), color: "#10B981" },
          { label: "Total PPN 12%", val: formatCurrency(totalTax), color: "#C08B5C" },
          { label: "Total Service 5%", val: formatCurrency(totalService), color: "#8B5CF6" },
        ].map((s) => (
          <div key={s.label} className="rounded-2xl p-5" style={{ background: "#181818", border: "1px solid rgba(255,255,255,0.05)" }}>
            <p className="text-xs mb-2" style={{ color: "rgba(216,198,181,0.5)" }}>{s.label}</p>
            <p className="text-xl font-bold" style={{ color: s.color }}>{s.val}</p>
          </div>
        ))}
      </div>

      <div className="rounded-2xl overflow-hidden" style={{ background: "#181818", border: "1px solid rgba(255,255,255,0.05)" }}>
        <table className="pos-table">
          <thead><tr><th>No. Order</th><th>Meja</th><th>Item</th><th>Subtotal</th><th>PPN</th><th>Total</th><th>Metode</th><th>Status</th><th>Waktu</th></tr></thead>
          <tbody>
            {orders.map((o) => {
              const sc = STATUS_COLORS[o.status] || "#C08B5C";
              return (
                <tr key={o.id}>
                  <td><span className="font-mono text-xs" style={{ color: "#C08B5C" }}>{o.orderNumber}</span></td>
                  <td style={{ color: "rgba(216,198,181,0.6)" }}>{o.tableCode ? `Meja ${o.tableCode}` : "Takeaway"}</td>
                  <td style={{ color: "rgba(216,198,181,0.6)" }}>{o.itemCount}</td>
                  <td style={{ color: "rgba(216,198,181,0.8)" }}>{formatCurrency(parseFloat(o.subtotal))}</td>
                  <td style={{ color: "rgba(216,198,181,0.6)" }}>{formatCurrency(parseFloat(o.taxAmount))}</td>
                  <td className="font-bold" style={{ color: "#EADBC8" }}>{formatCurrency(parseFloat(o.totalAmount))}</td>
                  <td>
                    <div className="flex gap-1 flex-wrap">
                      {o.paymentMethods.map((m, i) => (
                        <span key={i} className="text-xs px-1.5 py-0.5 rounded-md" style={{ background: "rgba(192,139,92,0.1)", color: "#C08B5C" }}>
                          {PAYMENT_METHOD_LABELS[m] || m}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td><span className="text-xs px-2 py-0.5 rounded-full" style={{ background: `${sc}18`, color: sc }}>{o.status}</span></td>
                  <td className="text-xs" style={{ color: "rgba(216,198,181,0.4)" }}>{formatDateTime(o.createdAt)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
