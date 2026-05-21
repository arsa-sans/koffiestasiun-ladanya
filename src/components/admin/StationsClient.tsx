"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Edit2, Trash2, X, Zap } from "lucide-react";
import { createStation, updateStation, deleteStation } from "@/server/services/stations";
import { toast } from "sonner";
import { STATION_LABELS, STATION_COLORS } from "@/constants";

interface StationItem {
  id: string; name: string; type: "bar"|"kitchen"|"sushi";
  description: string|null; isActive: boolean; productCount: number;
}

export default function StationsClient({ stations: init }: { stations: StationItem[] }) {
  const [items, setItems] = useState(init);
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<string|null>(null);
  const [loading, setLoading] = useState(false);
  const [fName, setFName] = useState("");
  const [fType, setFType] = useState<"bar"|"kitchen"|"sushi">("bar");
  const [fDesc, setFDesc] = useState("");

  const reset = () => { setFName(""); setFType("bar"); setFDesc(""); setEditId(null); setShowForm(false); };

  const openEdit = (s: StationItem) => { setFName(s.name); setFType(s.type); setFDesc(s.description||""); setEditId(s.id); setShowForm(true); };

  const handleSubmit = async () => {
    if (!fName.trim()) { toast.error("Nama harus diisi"); return; }
    setLoading(true);
    try {
      if (editId) {
        const r = await updateStation(editId, { name: fName, type: fType, description: fDesc||undefined });
        if (r.success) { setItems(p => p.map(s => s.id===editId ? { ...s, name: fName, type: fType, description: fDesc } : s)); toast.success("Berhasil diperbarui"); }
      } else {
        const r = await createStation({ name: fName, type: fType, description: fDesc||undefined });
        if (r.success && r.data) { setItems(p => [...p, { id: r.data.id, name: r.data.name, type: r.data.type as "bar"|"kitchen"|"sushi", description: r.data.description, isActive: r.data.isActive, productCount: 0 }]); toast.success("Berhasil ditambahkan"); }
      }
      reset();
    } catch { toast.error("Terjadi kesalahan"); } finally { setLoading(false); }
  };

  const handleDelete = async (id: string) => {
    const s = items.find(x => x.id===id);
    if (s && s.productCount > 0) { toast.error("Tidak bisa hapus stasiun yang punya produk"); return; }
    if (!confirm("Yakin hapus stasiun ini?")) return;
    try { await deleteStation(id); setItems(p => p.filter(x => x.id!==id)); toast.success("Berhasil dihapus"); } catch { toast.error("Gagal menghapus"); }
  };

  const toggleActive = async (id: string, cur: boolean) => {
    try { await updateStation(id, { isActive: !cur }); setItems(p => p.map(s => s.id===id ? { ...s, isActive: !cur } : s)); toast.success(`Stasiun ${!cur?"diaktifkan":"dinonaktifkan"}`); } catch { toast.error("Gagal mengubah status"); }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold" style={{ color: "#2C241B", fontFamily: "Playfair Display, serif" }}>Stasiun Dapur</h1>
        <button onClick={() => setShowForm(true)} className="btn-primary px-5" style={{ height: 44 }}><Plus size={16} /> Tambah Stasiun</button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {items.map(st => {
          const color = STATION_COLORS[st.type]||"#C08B5C";
          return (
            <motion.div key={st.id} layout className="rounded-2xl p-5 relative overflow-hidden" style={{ background: "#FFFFFF", border: "1px solid rgba(0,0,0,0.05)" }}>
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: `${color}15` }}><Zap size={18} color={color} /></div>
                  <div>
                    <p className="text-sm font-bold" style={{ color: "#2C241B" }}>{st.name}</p>
                    <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: `${color}15`, color }}>{STATION_LABELS[st.type]||st.type}</span>
                  </div>
                </div>
                <button onClick={() => toggleActive(st.id, st.isActive)}>
                  {st.isActive ? <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: "rgba(16,185,129,0.1)", color: "#10B981" }}>Aktif</span> : <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: "rgba(239,68,68,0.1)", color: "#f87171" }}>Nonaktif</span>}
                </button>
              </div>
              {st.description && <p className="text-xs mb-3" style={{ color: "rgba(44,36,27,0.45)" }}>{st.description}</p>}
              <div className="flex items-center justify-between mt-2">
                <span className="text-xs" style={{ color: "rgba(44,36,27,0.4)" }}>{st.productCount} produk</span>
                <div className="flex gap-2">
                  <button onClick={() => openEdit(st)} className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: "rgba(192,139,92,0.1)" }}><Edit2 size={13} color="#C08B5C" /></button>
                  <button onClick={() => handleDelete(st.id)} className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: "rgba(239,68,68,0.08)" }}><Trash2 size={13} color="#f87171" /></button>
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>

      <AnimatePresence>
        {showForm && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-center justify-center" style={{ background: "rgba(0,0,0,0.3)" }} onClick={reset}>
            <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }} className="rounded-3xl p-6 w-full max-w-md" style={{ background: "#FFFFFF", border: "1px solid rgba(0,0,0,0.06)" }} onClick={e => e.stopPropagation()}>
              <div className="flex items-center justify-between mb-5">
                <h2 className="text-lg font-bold" style={{ color: "#2C241B" }}>{editId ? "Edit Stasiun" : "Tambah Stasiun"}</h2>
                <button onClick={reset} className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: "rgba(0,0,0,0.04)" }}><X size={16} color="rgba(44,36,27,0.5)" /></button>
              </div>
              <div className="space-y-4">
                <div><label className="block text-sm font-medium mb-1.5" style={{ color: "rgba(44,36,27,0.7)" }}>Nama</label><input type="text" value={fName} onChange={e => setFName(e.target.value)} placeholder="Coffee Bar" className="pos-input" style={{ fontSize: "13px" }} /></div>
                <div><label className="block text-sm font-medium mb-1.5" style={{ color: "rgba(44,36,27,0.7)" }}>Tipe</label><select value={fType} onChange={e => setFType(e.target.value as "bar"|"kitchen"|"sushi")} className="pos-input" style={{ fontSize: "13px" }}><option value="bar">Coffee Bar</option><option value="kitchen">Hot Kitchen</option><option value="sushi">Sushi Station</option></select></div>
                <div><label className="block text-sm font-medium mb-1.5" style={{ color: "rgba(44,36,27,0.7)" }}>Deskripsi</label><input type="text" value={fDesc} onChange={e => setFDesc(e.target.value)} placeholder="Opsional" className="pos-input" style={{ fontSize: "13px" }} /></div>
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
