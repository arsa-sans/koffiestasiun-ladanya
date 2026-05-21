"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { ClipboardList, Plus } from "lucide-react";
import { formatDateTime } from "@/lib/utils/format";

interface Opname { id: string; code: string; status: string; notes: string | null; createdAt: string; performedBy: string | null; itemCount: number }
interface Ingredient { id: string; name: string; unit: string; stock: string }

interface StockOpnameClientProps { opnames: Opname[]; ingredients: Ingredient[] }

export default function StockOpnameClient({ opnames, ingredients }: StockOpnameClientProps) {
  const [showNew, setShowNew] = useState(false);
  const [physicalCounts, setPhysicalCounts] = useState<Record<string, string>>({});

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold" style={{ color: "#2C241B", fontFamily: "Playfair Display, serif" }}>Stock Opname</h1>
        <button onClick={() => setShowNew(!showNew)} className="btn-primary px-5" style={{ height: 44 }}>
          <Plus size={16} /> Opname Baru
        </button>
      </div>

      {showNew && (
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
          className="rounded-2xl p-5" style={{ background: "#FFFFFF", border: "1px solid rgba(192,139,92,0.2)" }}>
          <h2 className="font-semibold mb-4" style={{ color: "#2C241B" }}>Input Stok Fisik</h2>
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {ingredients.map((ing) => (
              <div key={ing.id} className="flex items-center gap-4 py-2" style={{ borderBottom: "1px solid rgba(0,0,0,0.04)" }}>
                <span className="flex-1 text-sm" style={{ color: "#2C241B" }}>{ing.name}</span>
                <span className="text-xs w-20 text-right" style={{ color: "rgba(44,36,27,0.5)" }}>Sistem: {parseFloat(ing.stock).toLocaleString("id-ID")} {ing.unit}</span>
                <input type="number" placeholder="Fisik" value={physicalCounts[ing.id] || ""}
                  onChange={(e) => setPhysicalCounts({ ...physicalCounts, [ing.id]: e.target.value })}
                  className="pos-input w-28" style={{ fontSize: "13px", padding: "7px 10px" }} />
                <span className="text-xs w-8" style={{ color: "rgba(44,36,27,0.5)" }}>{ing.unit}</span>
                {physicalCounts[ing.id] && (
                  <span className="text-xs font-bold w-20 text-right" style={{
                    color: parseFloat(physicalCounts[ing.id]) - parseFloat(ing.stock) >= 0 ? "#10B981" : "#EF4444"
                  }}>
                    {(parseFloat(physicalCounts[ing.id]) - parseFloat(ing.stock)) >= 0 ? "+" : ""}
                    {(parseFloat(physicalCounts[ing.id]) - parseFloat(ing.stock)).toLocaleString("id-ID")}
                  </span>
                )}
              </div>
            ))}
          </div>
          <div className="flex gap-3 mt-4">
            <button className="btn-primary px-6" style={{ height: 44 }}>Simpan Draft</button>
            <button onClick={() => setShowNew(false)} className="btn-secondary px-6" style={{ height: 44 }}>Batal</button>
          </div>
        </motion.div>
      )}

      <div className="rounded-2xl overflow-hidden" style={{ background: "#FFFFFF", border: "1px solid rgba(0,0,0,0.05)" }}>
        {opnames.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16">
            <ClipboardList size={32} color="rgba(44,36,27,0.2)" />
            <p className="mt-3 text-sm" style={{ color: "rgba(44,36,27,0.4)" }}>Belum ada stock opname</p>
          </div>
        ) : (
          <table className="pos-table">
            <thead><tr><th>Kode</th><th>Status</th><th>Item</th><th>Dilakukan Oleh</th><th>Waktu</th></tr></thead>
            <tbody>
              {opnames.map((o) => (
                <tr key={o.id}>
                  <td><span className="font-mono text-xs" style={{ color: "#C08B5C" }}>{o.code}</span></td>
                  <td><span className="text-xs px-2 py-0.5 rounded-full" style={{ background: o.status === "confirmed" ? "rgba(16,185,129,0.1)" : "rgba(245,158,11,0.1)", color: o.status === "confirmed" ? "#10B981" : "#F59E0B" }}>{o.status}</span></td>
                  <td style={{ color: "rgba(44,36,27,0.7)" }}>{o.itemCount} bahan</td>
                  <td style={{ color: "rgba(44,36,27,0.7)" }}>{o.performedBy || "-"}</td>
                  <td className="text-xs" style={{ color: "rgba(44,36,27,0.4)" }}>{formatDateTime(o.createdAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
