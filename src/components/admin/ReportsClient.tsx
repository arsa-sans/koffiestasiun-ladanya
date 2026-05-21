"use client";

import { formatCurrency, formatDateTime } from "@/lib/utils/format";
import { STATUS_COLORS, PAYMENT_METHOD_LABELS } from "@/constants";
import { Download, FileSpreadsheet } from "lucide-react";
import { toast } from "sonner";

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

  const handleExport = async (entity: string) => {
    toast.info("Mengunduh...");
    try {
      const res = await fetch(`/api/export/${entity}`);
      if (!res.ok) throw new Error("Export failed");
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = res.headers.get("Content-Disposition")?.split('filename="')[1]?.replace('"', '') || `${entity}.xlsx`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success("File berhasil diunduh");
    } catch {
      toast.error("Gagal mengunduh file");
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold" style={{ color: "#2C241B", fontFamily: "Playfair Display, serif" }}>Laporan Penjualan</h1>
        <div className="flex items-center gap-2">
          <button
            onClick={() => handleExport("orders")}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium transition-colors"
            style={{ background: "rgba(16,185,129,0.1)", color: "#10B981", border: "1px solid rgba(16,185,129,0.2)" }}
          >
            <FileSpreadsheet size={14} />
            Export Order
          </button>
          <button
            onClick={() => handleExport("full-report")}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium transition-colors"
            style={{ background: "rgba(192,139,92,0.1)", color: "#C08B5C", border: "1px solid rgba(192,139,92,0.2)" }}
          >
            <Download size={14} />
            Full Report
          </button>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4">
        {[
          { label: "Total Pendapatan", val: formatCurrency(totalRevenue), color: "#10B981" },
          { label: "Total PPN 12%", val: formatCurrency(totalTax), color: "#C08B5C" },
          { label: "Total Service 5%", val: formatCurrency(totalService), color: "#8B5CF6" },
        ].map((s) => (
          <div key={s.label} className="rounded-2xl p-5" style={{ background: "#FFFFFF", border: "1px solid rgba(0,0,0,0.05)" }}>
            <p className="text-xs mb-2" style={{ color: "rgba(44,36,27,0.5)" }}>{s.label}</p>
            <p className="text-xl font-bold" style={{ color: s.color }}>{s.val}</p>
          </div>
        ))}
      </div>

      <div className="rounded-2xl overflow-hidden" style={{ background: "#FFFFFF", border: "1px solid rgba(0,0,0,0.05)" }}>
        <table className="pos-table">
          <thead><tr><th>No. Order</th><th>Meja</th><th>Item</th><th>Subtotal</th><th>PPN</th><th>Total</th><th>Metode</th><th>Status</th><th>Waktu</th></tr></thead>
          <tbody>
            {orders.map((o) => {
              const sc = STATUS_COLORS[o.status] || "#C08B5C";
              return (
                <tr key={o.id}>
                  <td><span className="font-mono text-xs" style={{ color: "#C08B5C" }}>{o.orderNumber}</span></td>
                  <td style={{ color: "rgba(44,36,27,0.6)" }}>{o.tableCode ? `Meja ${o.tableCode}` : "Takeaway"}</td>
                  <td style={{ color: "rgba(44,36,27,0.6)" }}>{o.itemCount}</td>
                  <td style={{ color: "rgba(44,36,27,0.8)" }}>{formatCurrency(parseFloat(o.subtotal))}</td>
                  <td style={{ color: "rgba(44,36,27,0.6)" }}>{formatCurrency(parseFloat(o.taxAmount))}</td>
                  <td className="font-bold" style={{ color: "#2C241B" }}>{formatCurrency(parseFloat(o.totalAmount))}</td>
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
                  <td className="text-xs" style={{ color: "rgba(44,36,27,0.4)" }}>{formatDateTime(o.createdAt)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
