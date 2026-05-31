"use client";

import { useState } from "react";
import { formatCurrency, formatDateTime } from "@/lib/utils/format";
import { STATUS_COLORS } from "@/constants";
import ConfirmDialog from "@/components/shared/ConfirmDialog";
import { voidOrder } from "@/server/actions/orders";
import { toast } from "sonner";
import { XCircle, Printer, Eye } from "lucide-react";
import { useRef } from "react";
import { useReactToPrint } from "react-to-print";
import Receipt, { ReceiptData } from "@/components/cashier/Receipt";

export default function HistoryClient({ orders, userId }: { orders: any[], userId?: string }) {
  const [voidingOrderId, setVoidingOrderId] = useState<string | null>(null);
  const [voidReason, setVoidReason] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [printingOrder, setPrintingOrder] = useState<any | null>(null);
  const receiptRef = useRef<HTMLDivElement>(null);

  const handlePrint = useReactToPrint({
    contentRef: receiptRef,
    onAfterPrint: () => setPrintingOrder(null),
  });

  const handleVoidOrder = async () => {
    if (!voidingOrderId) return;
    if (!voidReason.trim()) {
      toast.error("Alasan void harus diisi");
      return;
    }

    setIsLoading(true);
    try {
      const res = await voidOrder(voidingOrderId, voidReason, userId);
      if (res.success) {
        toast.success("Order berhasil di-void");
        setVoidingOrderId(null);
        setVoidReason("");
      } else {
        toast.error("Gagal melakukan void");
      }
    } catch (error) {
      toast.error("Terjadi kesalahan sistem");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <div className="rounded-2xl overflow-hidden" style={{ background: "#FFFFFF", border: "1px solid rgba(0,0,0,0.05)" }}>
        <table className="pos-table">
          <thead>
            <tr>
              <th>No. Order</th>
              <th>Pelanggan</th>
              <th>Meja</th>
              <th>Item</th>
              <th>Total</th>
              <th>Status</th>
              <th>Waktu</th>
              <th>Aksi</th>
            </tr>
          </thead>
          <tbody>
            {orders.map((order) => {
              const sc = STATUS_COLORS[order.status] || "#C08B5C";
              const canVoid = order.status === "open" || order.status === "paid";
              
              return (
                <tr key={order.id}>
                  <td><span className="font-mono text-xs font-medium" style={{ color: "#C08B5C" }}>{order.orderNumber}</span></td>
                  <td style={{ color: "rgba(44,36,27,0.7)" }}>{order.customerName || "—"}</td>
                  <td style={{ color: "rgba(44,36,27,0.7)" }}>{order.table?.code ? `Meja ${order.table.code}` : "Takeaway"}</td>
                  <td style={{ color: "rgba(44,36,27,0.7)" }}>{order.items.length} item</td>
                  <td className="font-semibold" style={{ color: "#2C241B" }}>{formatCurrency(parseFloat(String(order.totalAmount)))}</td>
                  <td><span className="text-xs px-2.5 py-1 rounded-full font-medium" style={{ background: `${sc}18`, color: sc }}>{order.status}</span></td>
                  <td className="text-xs" style={{ color: "rgba(44,36,27,0.4)" }}>{formatDateTime(order.createdAt)}</td>
                  <td>
                    <div className="flex gap-2">
                      {order.status === "paid" && (
                        <button 
                          onClick={() => {
                            setPrintingOrder(order);
                            setTimeout(() => handlePrint(), 50);
                          }}
                          className="p-2 rounded-lg bg-emerald-50 text-emerald-600 hover:bg-emerald-100 transition-colors" 
                          title="Print Struk"
                        >
                          <Printer size={16} />
                        </button>
                      )}
                      {canVoid && (
                        <button 
                          onClick={() => setVoidingOrderId(order.id)}
                          className="p-2 rounded-lg bg-red-50 text-red-600 hover:bg-red-100 transition-colors" 
                          title="Void Order"
                        >
                          <XCircle size={16} />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
            {orders.length === 0 && (
              <tr><td colSpan={8} className="text-center py-8" style={{ color: "rgba(44,36,27,0.4)" }}>Belum ada order</td></tr>
            )}
          </tbody>
        </table>
      </div>

      <ConfirmDialog
        isOpen={!!voidingOrderId}
        onClose={() => {
          setVoidingOrderId(null);
          setVoidReason("");
        }}
        onConfirm={handleVoidOrder}
        title="Void Order"
        message="Apakah Anda yakin ingin membatalkan order ini? Stok bahan akan dikembalikan jika sudah diproses."
        confirmText="Ya, Void Order"
        variant="danger"
        isLoading={isLoading}
      />
      
      {/* Extra Reason Input appended inside modal if possible, but ConfirmDialog doesn't support children currently. 
          For now, we might need a custom modal or just add it to the ConfirmDialog message area via a trick.
          Actually, let's just make a custom modal for Void since it requires reason.
      */}
      {voidingOrderId && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center pointer-events-none p-4">
           {/* We overlay an input on top of the confirm dialog, this is hacky. I'll modify ConfirmDialog or just use a custom one. */}
           <div className="pointer-events-auto bg-white p-4 rounded-xl shadow-lg mt-32 w-full max-w-sm border">
             <label className="block text-sm mb-2 font-medium">Alasan Void</label>
             <input 
               type="text" 
               autoFocus
               className="w-full px-3 py-2 border rounded-lg text-sm"
               placeholder="Contoh: Pelanggan salah pesan"
               value={voidReason}
               onChange={e => setVoidReason(e.target.value)}
             />
             <p className="text-xs text-gray-500 mt-2">Isi alasan ini sebelum menekan "Ya, Void Order" di dialog utama.</p>
           </div>
        </div>
      )}

      {/* Hidden Receipt for Printing */}
      <div style={{ display: "none" }}>
        {printingOrder && <Receipt ref={receiptRef} data={printingOrder as unknown as ReceiptData} />}
      </div>
    </>
  );
}
