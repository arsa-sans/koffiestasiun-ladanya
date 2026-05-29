import React, { forwardRef } from "react";
import { formatCurrency, formatDateTime } from "@/lib/utils/format";

export interface ReceiptData {
  orderNumber: string;
  createdAt: Date | string;
  orderType: string;
  cashier?: { name: string } | null;
  table?: { code: string } | null;
  customerName?: string | null;
  items: {
    id: string;
    quantity: number;
    unitPrice: string;
    totalPrice: string;
    product: { name: string };
    modifiers: { name: string; price: string }[];
  }[];
  subtotal: string;
  taxAmount: string;
  serviceAmount: string;
  totalAmount: string;
  payments: { method: string; amount: string }[];
}

interface ReceiptProps {
  data: ReceiptData;
}

const Receipt = forwardRef<HTMLDivElement, ReceiptProps>(({ data }, ref) => {
  const isTakeaway = data.orderType === "takeaway";

  return (
    <div ref={ref} className="bg-white text-black p-4" style={{ width: "300px", fontFamily: "monospace", fontSize: "12px", color: "#000" }}>
      {/* Dummy Logo Image */}
      <div className="flex justify-center mb-3">
        <img src="https://placehold.co/120x60/EEE/31343C?text=Koffie+Logo" alt="Logo" style={{ width: "120px", objectFit: "contain" }} />
      </div>

      <div className="text-center mb-3">
        <h2 className="font-bold text-base m-0 leading-tight">KOFFIESTASIUN</h2>
        <p className="m-0 text-[10px]">Jl. Stasiun Kota No.1</p>
        <p className="m-0 text-[10px]">Telp: 0812-3456-7890</p>
      </div>

      <div className="border-t border-b border-dashed border-gray-400 py-1.5 mb-2">
        <div className="flex justify-between">
          <span>No: {data.orderNumber}</span>
          <span>{isTakeaway ? "TAKEAWAY" : `Meja: ${data.table?.code || "-"}`}</span>
        </div>
        <div className="flex justify-between">
          <span>Tgl: {formatDateTime(new Date(data.createdAt))}</span>
        </div>
        <div className="flex justify-between">
          <span>Kasir: {data.cashier?.name || "-"}</span>
        </div>
        {data.customerName && (
          <div className="flex justify-between mt-0.5">
            <span>Pelanggan: {data.customerName}</span>
          </div>
        )}
      </div>

      <div className="py-1">
        {data.items.map((item) => (
          <div key={item.id} className="mb-2">
            <div className="flex justify-between font-bold">
              <span>{item.product.name}</span>
            </div>
            <div className="flex justify-between">
              <span>{item.quantity} x {formatCurrency(parseFloat(item.unitPrice))}</span>
              <span>{formatCurrency(parseFloat(item.totalPrice))}</span>
            </div>
            {item.modifiers.length > 0 && (
              <div className="text-[10px] ml-2">
                {item.modifiers.map((mod, i) => (
                  <div key={i} className="flex justify-between">
                    <span>- {mod.name}</span>
                    {parseFloat(mod.price) > 0 && (
                      <span>{formatCurrency(parseFloat(mod.price))}</span>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="border-t border-dashed border-gray-400 py-1.5">
        <div className="flex justify-between">
          <span>Subtotal</span>
          <span>{formatCurrency(parseFloat(data.subtotal))}</span>
        </div>
        {parseFloat(data.taxAmount) > 0 && (
          <div className="flex justify-between">
            <span>Pajak</span>
            <span>{formatCurrency(parseFloat(data.taxAmount))}</span>
          </div>
        )}
        {parseFloat(data.serviceAmount) > 0 && (
          <div className="flex justify-between">
            <span>Layanan</span>
            <span>{formatCurrency(parseFloat(data.serviceAmount))}</span>
          </div>
        )}
        <div className="flex justify-between font-bold text-sm mt-1">
          <span>TOTAL</span>
          <span>{formatCurrency(parseFloat(data.totalAmount))}</span>
        </div>
      </div>

      <div className="border-t border-dashed border-gray-400 py-1.5">
        {data.payments.map((pay, idx) => (
          <div key={idx} className="flex justify-between">
            <span>Bayar ({pay.method.toUpperCase()})</span>
            <span>{formatCurrency(parseFloat(pay.amount))}</span>
          </div>
        ))}
        {(() => {
          const totalPaid = data.payments.reduce((s, p) => s + parseFloat(p.amount), 0);
          const change = totalPaid - parseFloat(data.totalAmount);
          return change > 0 ? (
            <div className="flex justify-between font-bold mt-1">
              <span>KEMBALI</span>
              <span>{formatCurrency(change)}</span>
            </div>
          ) : null;
        })()}
      </div>

      <div className="text-center mt-3 pt-2 border-t border-dashed border-gray-400">
        <p className="m-0 font-bold">Terima Kasih</p>
        <p className="m-0 text-[10px]">Silakan datang kembali!</p>
        <p className="m-0 text-[10px] mt-1">www.koffiestasiun.com</p>
      </div>
    </div>
  );
});

Receipt.displayName = "Receipt";

export default Receipt;
