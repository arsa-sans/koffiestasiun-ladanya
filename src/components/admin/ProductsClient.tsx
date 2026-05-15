"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Edit2, Trash2, ToggleLeft, ToggleRight, Search } from "lucide-react";
import { formatCurrency } from "@/lib/utils/format";
import { db } from "@/db";
import { toast } from "sonner";

interface Product {
  id: string; name: string; description: string | null; price: string;
  imageUrl: string | null; isAvailable: boolean; categoryId: string;
  stationId: string; categoryName: string; stationName: string;
}
interface Category { id: string; name: string }
interface Station { id: string; name: string; type: string }
interface ProductsClientProps { products: Product[]; categories: Category[]; stations: Station[] }

const STATION_COLORS: Record<string, string> = { bar: "#C08B5C", kitchen: "#EF4444", sushi: "#3B82F6" };

export default function ProductsClient({ products, categories, stations }: ProductsClientProps) {
  const [search, setSearch] = useState("");
  const [catFilter, setCatFilter] = useState("all");
  const [showForm, setShowForm] = useState(false);

  const filtered = products.filter((p) => {
    if (catFilter !== "all" && p.categoryId !== catFilter) return false;
    if (search && !p.name.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold" style={{ color: "#EADBC8", fontFamily: "Playfair Display, serif" }}>Produk</h1>
        <button onClick={() => setShowForm(true)} className="btn-primary px-5" style={{ height: 44 }}>
          <Plus size={16} /> Tambah Produk
        </button>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-xs">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2" color="rgba(216,198,181,0.35)" />
          <input type="text" placeholder="Cari produk..." value={search} onChange={(e) => setSearch(e.target.value)}
            className="pos-input pl-9" style={{ fontSize: "13px" }} />
        </div>
        <select value={catFilter} onChange={(e) => setCatFilter(e.target.value)}
          className="pos-input" style={{ width: "auto", fontSize: "13px", padding: "9px 12px" }}>
          <option value="all">Semua Kategori</option>
          {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
      </div>

      {/* Products Table */}
      <div className="rounded-2xl overflow-hidden" style={{ background: "#181818", border: "1px solid rgba(255,255,255,0.05)" }}>
        <table className="pos-table">
          <thead><tr><th>Produk</th><th>Kategori</th><th>Stasiun</th><th>Harga</th><th>Status</th><th>Aksi</th></tr></thead>
          <tbody>
            {filtered.map((product) => {
              const stColor = STATION_COLORS[product.stationName?.toLowerCase().includes("bar") ? "bar" : product.stationName?.toLowerCase().includes("sushi") ? "sushi" : "kitchen"] || "#C08B5C";
              return (
                <tr key={product.id}>
                  <td>
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl overflow-hidden flex-shrink-0 flex items-center justify-center" style={{ background: "rgba(192,139,92,0.08)" }}>
                        {product.imageUrl ? <img src={product.imageUrl} alt={product.name} className="w-full h-full object-cover" /> : <span className="text-lg">☕</span>}
                      </div>
                      <div>
                        <p className="text-sm font-semibold" style={{ color: "#EADBC8" }}>{product.name}</p>
                        {product.description && <p className="text-xs truncate max-w-xs" style={{ color: "rgba(216,198,181,0.4)" }}>{product.description}</p>}
                      </div>
                    </div>
                  </td>
                  <td><span className="text-xs px-2 py-1 rounded-full" style={{ background: "rgba(192,139,92,0.1)", color: "#C08B5C" }}>{product.categoryName}</span></td>
                  <td><span className="text-xs px-2 py-1 rounded-full" style={{ background: `${stColor}18`, color: stColor }}>{product.stationName}</span></td>
                  <td className="font-semibold" style={{ color: "#C08B5C" }}>{formatCurrency(parseFloat(product.price))}</td>
                  <td>
                    {product.isAvailable
                      ? <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: "rgba(16,185,129,0.1)", color: "#10B981" }}>Tersedia</span>
                      : <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: "rgba(239,68,68,0.1)", color: "#f87171" }}>Habis</span>}
                  </td>
                  <td>
                    <div className="flex gap-2">
                      <button className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: "rgba(192,139,92,0.1)" }}>
                        <Edit2 size={13} color="#C08B5C" />
                      </button>
                      <button className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: "rgba(239,68,68,0.08)" }}>
                        <Trash2 size={13} color="#f87171" />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
