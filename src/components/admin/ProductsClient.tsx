"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Edit2, Trash2, Search, X, ToggleLeft, ToggleRight } from "lucide-react";
import { formatCurrency } from "@/lib/utils/format";
import { createProduct, updateProduct, deleteProduct, toggleProductAvailability } from "@/server/services/products";
import { toast } from "sonner";

interface Product {
  id: string; name: string; description: string|null; price: string;
  imageUrl: string|null; isAvailable: boolean; categoryId: string;
  stationId: string; categoryName: string; stationName: string;
}
interface Category { id: string; name: string }
interface Station { id: string; name: string; type: string }

const STATION_COLORS: Record<string, string> = { bar: "#C08B5C", kitchen: "#EF4444", sushi: "#3B82F6" };

export default function ProductsClient({ products: init, categories, stations }: { products: Product[]; categories: Category[]; stations: Station[] }) {
  const [items, setItems] = useState(init);
  const [search, setSearch] = useState("");
  const [catFilter, setCatFilter] = useState("all");
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<string|null>(null);
  const [loading, setLoading] = useState(false);

  const [fName, setFName] = useState("");
  const [fDesc, setFDesc] = useState("");
  const [fPrice, setFPrice] = useState("");
  const [fCat, setFCat] = useState(categories[0]?.id || "");
  const [fStation, setFStation] = useState(stations[0]?.id || "");

  const filtered = items.filter(p => {
    if (catFilter !== "all" && p.categoryId !== catFilter) return false;
    if (search && !p.name.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const reset = () => { setFName(""); setFDesc(""); setFPrice(""); setFCat(categories[0]?.id||""); setFStation(stations[0]?.id||""); setEditId(null); setShowForm(false); };

  const openEdit = (p: Product) => { setFName(p.name); setFDesc(p.description||""); setFPrice(p.price); setFCat(p.categoryId); setFStation(p.stationId); setEditId(p.id); setShowForm(true); };

  const handleSubmit = async () => {
    if (!fName.trim() || !fPrice.trim()) { toast.error("Nama dan harga harus diisi"); return; }
    setLoading(true);
    try {
      if (editId) {
        const r = await updateProduct(editId, { name: fName, description: fDesc||undefined, price: fPrice, categoryId: fCat, stationId: fStation });
        if (r.success) {
          const catName = categories.find(c => c.id===fCat)?.name||"";
          const stName = stations.find(s => s.id===fStation)?.name||"";
          setItems(p => p.map(x => x.id===editId ? { ...x, name: fName, description: fDesc, price: fPrice, categoryId: fCat, stationId: fStation, categoryName: catName, stationName: stName } : x));
          toast.success("Produk diperbarui");
        }
      } else {
        const r = await createProduct({ name: fName, description: fDesc||undefined, price: fPrice, categoryId: fCat, stationId: fStation });
        if (r.success && r.data) {
          const catName = categories.find(c => c.id===fCat)?.name||"";
          const stName = stations.find(s => s.id===fStation)?.name||"";
          setItems(p => [...p, { id: r.data.id, name: r.data.name, description: r.data.description, price: String(r.data.price), imageUrl: r.data.imageUrl, isAvailable: r.data.isAvailable, categoryId: r.data.categoryId, stationId: r.data.stationId, categoryName: catName, stationName: stName }]);
          toast.success("Produk ditambahkan");
        }
      }
      reset();
    } catch { toast.error("Terjadi kesalahan"); } finally { setLoading(false); }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Yakin hapus produk ini?")) return;
    try { await deleteProduct(id); setItems(p => p.filter(x => x.id!==id)); toast.success("Produk dihapus"); } catch { toast.error("Gagal menghapus"); }
  };

  const handleToggle = async (id: string, cur: boolean) => {
    try { await toggleProductAvailability(id, !cur); setItems(p => p.map(x => x.id===id ? { ...x, isAvailable: !cur } : x)); toast.success(`Produk ${!cur?"tersedia":"dinonaktifkan"}`); } catch { toast.error("Gagal"); }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold" style={{ color: "#2C241B", fontFamily: "Playfair Display, serif" }}>Produk</h1>
        <button onClick={() => setShowForm(true)} className="btn-primary px-5" style={{ height: 44 }}><Plus size={16} /> Tambah Produk</button>
      </div>

      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-xs">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2" color="rgba(44,36,27,0.35)" />
          <input type="text" placeholder="Cari produk..." value={search} onChange={e => setSearch(e.target.value)} className="pos-input pl-9" style={{ fontSize: "13px" }} />
        </div>
        <select value={catFilter} onChange={e => setCatFilter(e.target.value)} className="pos-input" style={{ width: "auto", fontSize: "13px", padding: "9px 12px" }}>
          <option value="all">Semua Kategori</option>
          {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
      </div>

      <div className="rounded-2xl overflow-hidden" style={{ background: "#FFFFFF", border: "1px solid rgba(0,0,0,0.05)" }}>
        <table className="pos-table">
          <thead><tr><th>Produk</th><th>Kategori</th><th>Stasiun</th><th>Harga</th><th>Status</th><th>Aksi</th></tr></thead>
          <tbody>
            {filtered.map(product => {
              const stColor = STATION_COLORS[product.stationName?.toLowerCase().includes("bar")?"bar":product.stationName?.toLowerCase().includes("sushi")?"sushi":"kitchen"]||"#C08B5C";
              return (
                <tr key={product.id}>
                  <td>
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl overflow-hidden flex-shrink-0 flex items-center justify-center" style={{ background: "rgba(192,139,92,0.08)" }}>
                        {product.imageUrl ? <img src={product.imageUrl} alt={product.name} className="w-full h-full object-cover" /> : <span className="text-lg">☕</span>}
                      </div>
                      <div>
                        <p className="text-sm font-semibold" style={{ color: "#2C241B" }}>{product.name}</p>
                        {product.description && <p className="text-xs truncate max-w-xs" style={{ color: "rgba(44,36,27,0.4)" }}>{product.description}</p>}
                      </div>
                    </div>
                  </td>
                  <td><span className="text-xs px-2 py-1 rounded-full" style={{ background: "rgba(192,139,92,0.1)", color: "#C08B5C" }}>{product.categoryName}</span></td>
                  <td><span className="text-xs px-2 py-1 rounded-full" style={{ background: `${stColor}18`, color: stColor }}>{product.stationName}</span></td>
                  <td className="font-semibold" style={{ color: "#C08B5C" }}>{formatCurrency(parseFloat(product.price))}</td>
                  <td>
                    <button onClick={() => handleToggle(product.id, product.isAvailable)}>
                      {product.isAvailable
                        ? <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: "rgba(16,185,129,0.1)", color: "#10B981" }}>Tersedia</span>
                        : <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: "rgba(239,68,68,0.1)", color: "#f87171" }}>Habis</span>}
                    </button>
                  </td>
                  <td>
                    <div className="flex gap-2">
                      <button onClick={() => openEdit(product)} className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: "rgba(192,139,92,0.1)" }}><Edit2 size={13} color="#C08B5C" /></button>
                      <button onClick={() => handleDelete(product.id)} className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: "rgba(239,68,68,0.08)" }}><Trash2 size={13} color="#f87171" /></button>
                    </div>
                  </td>
                </tr>
              );
            })}
            {filtered.length===0 && <tr><td colSpan={6} className="text-center py-8" style={{ color: "rgba(44,36,27,0.3)" }}>Tidak ada produk</td></tr>}
          </tbody>
        </table>
      </div>

      <AnimatePresence>
        {showForm && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-center justify-center" style={{ background: "rgba(0,0,0,0.3)" }} onClick={reset}>
            <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }} className="rounded-3xl p-6 w-full max-w-lg" style={{ background: "#FFFFFF", border: "1px solid rgba(0,0,0,0.06)" }} onClick={e => e.stopPropagation()}>
              <div className="flex items-center justify-between mb-5">
                <h2 className="text-lg font-bold" style={{ color: "#2C241B" }}>{editId ? "Edit Produk" : "Tambah Produk"}</h2>
                <button onClick={reset} className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: "rgba(0,0,0,0.04)" }}><X size={16} color="rgba(44,36,27,0.5)" /></button>
              </div>
              <div className="space-y-4">
                <div><label className="block text-sm font-medium mb-1.5" style={{ color: "rgba(44,36,27,0.7)" }}>Nama Produk</label><input type="text" value={fName} onChange={e => setFName(e.target.value)} placeholder="Americano" className="pos-input" style={{ fontSize: "13px" }} /></div>
                <div><label className="block text-sm font-medium mb-1.5" style={{ color: "rgba(44,36,27,0.7)" }}>Deskripsi</label><input type="text" value={fDesc} onChange={e => setFDesc(e.target.value)} placeholder="Opsional" className="pos-input" style={{ fontSize: "13px" }} /></div>
                <div className="grid grid-cols-2 gap-3">
                  <div><label className="block text-sm font-medium mb-1.5" style={{ color: "rgba(44,36,27,0.7)" }}>Harga</label><input type="text" value={fPrice} onChange={e => setFPrice(e.target.value)} placeholder="25000" className="pos-input" style={{ fontSize: "13px" }} /></div>
                  <div><label className="block text-sm font-medium mb-1.5" style={{ color: "rgba(44,36,27,0.7)" }}>Kategori</label><select value={fCat} onChange={e => setFCat(e.target.value)} className="pos-input" style={{ fontSize: "13px" }}>{categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}</select></div>
                </div>
                <div><label className="block text-sm font-medium mb-1.5" style={{ color: "rgba(44,36,27,0.7)" }}>Stasiun</label><select value={fStation} onChange={e => setFStation(e.target.value)} className="pos-input" style={{ fontSize: "13px" }}>{stations.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}</select></div>
              </div>
              <div className="flex gap-3 mt-6">
                <button onClick={reset} className="flex-1 px-4 py-3 rounded-xl text-sm font-medium" style={{ background: "rgba(0,0,0,0.04)", color: "rgba(44,36,27,0.7)" }}>Batal</button>
                <button onClick={handleSubmit} disabled={loading} className="btn-primary flex-1" style={{ background: loading ? "#8A6A55" : "#C08B5C" }}>{loading ? "Menyimpan..." : editId ? "Simpan" : "Tambah"}</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
