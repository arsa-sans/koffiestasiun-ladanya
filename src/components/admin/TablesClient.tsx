"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Edit2, Trash2, X, Search, Users } from "lucide-react";
import { createTable, updateTable, deleteTable } from "@/server/services/tables";
import { toast } from "sonner";
import ConfirmDialog from "@/components/shared/ConfirmDialog";

interface TableItem {
  id: string; code: string; name: string; capacity: number;
  status: string; isActive: boolean;
}

const STATUS_MAP: Record<string, { label: string; color: string }> = {
  available: { label: "Tersedia", color: "#10B981" },
  occupied: { label: "Terisi", color: "#EF4444" },
  reserved: { label: "Dipesan", color: "#F59E0B" },
  cleaning: { label: "Dibersihkan", color: "#3B82F6" },
};

export default function TablesClient({ tables: init }: { tables: TableItem[] }) {
  const [items, setItems] = useState(init);
  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<string|null>(null);
  const [loading, setLoading] = useState(false);
  const [fCode, setFCode] = useState("");
  const [fName, setFName] = useState("");
  const [fCap, setFCap] = useState(4);

  const [confirmDeleteId, setConfirmDeleteId] = useState<string|null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const filtered = items.filter(t => !search || t.code.toLowerCase().includes(search.toLowerCase()) || t.name.toLowerCase().includes(search.toLowerCase()));

  const reset = () => { setFCode(""); setFName(""); setFCap(4); setEditId(null); setShowForm(false); };

  const openEdit = (t: TableItem) => { setFCode(t.code); setFName(t.name); setFCap(t.capacity); setEditId(t.id); setShowForm(true); };

  const handleSubmit = async () => {
    if (!fCode.trim() || !fName.trim()) { toast.error("Kode dan nama meja harus diisi"); return; }
    setLoading(true);
    try {
      if (editId) {
        const r = await updateTable(editId, { code: fCode, name: fName, capacity: fCap });
        if (r.success) { setItems(p => p.map(t => t.id===editId ? { ...t, code: fCode, name: fName, capacity: fCap } : t)); toast.success("Meja diperbarui"); }
      } else {
        const r = await createTable({ code: fCode, name: fName, capacity: fCap });
        if (r.success && r.data) { setItems(p => [...p, { id: r.data.id, code: r.data.code, name: r.data.name, capacity: r.data.capacity, status: r.data.status, isActive: r.data.isActive }]); toast.success("Meja ditambahkan"); }
      }
      reset();
    } catch { toast.error("Terjadi kesalahan"); } finally { setLoading(false); }
  };

  const handleDelete = async () => {
    if (!confirmDeleteId) return;
    setDeleteLoading(true);
    try {
      await deleteTable(confirmDeleteId);
      setItems(p => p.filter(t => t.id !== confirmDeleteId));
      toast.success("Meja dihapus");
    } catch {
      toast.error("Gagal menghapus");
    } finally {
      setDeleteLoading(false);
      setConfirmDeleteId(null);
    }
  };

  const toggleActive = async (id: string, cur: boolean) => {
    try { await updateTable(id, { isActive: !cur }); setItems(p => p.map(t => t.id===id ? { ...t, isActive: !cur } : t)); toast.success(`Meja ${!cur?"diaktifkan":"dinonaktifkan"}`); } catch { toast.error("Gagal"); }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold" style={{ color: "#2C241B", fontFamily: "Playfair Display, serif" }}>Manajemen Meja</h1>
        <button onClick={() => setShowForm(true)} className="btn-primary px-5" style={{ height: 44 }}><Plus size={16} /> Tambah Meja</button>
      </div>

      <div className="relative max-w-xs">
        <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2" color="rgba(44,36,27,0.35)" />
        <input type="text" placeholder="Cari meja..." value={search} onChange={e => setSearch(e.target.value)} className="pos-input pl-9" style={{ fontSize: "13px" }} />
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
        {filtered.map(t => {
          const st = STATUS_MAP[t.status] || STATUS_MAP.available;
          return (
            <motion.div key={t.id} layout className="rounded-2xl p-4 text-center relative" style={{ background: "#FFFFFF", border: `1px solid ${t.isActive ? "rgba(0,0,0,0.05)" : "rgba(239,68,68,0.15)"}`, opacity: t.isActive ? 1 : 0.6 }}>
              <div className="text-2xl font-bold mb-1" style={{ color: "#2C241B", fontFamily: "Playfair Display, serif" }}>{t.code}</div>
              <p className="text-xs mb-2" style={{ color: "rgba(44,36,27,0.5)" }}>{t.name}</p>
              <div className="flex items-center justify-center gap-1 mb-2">
                <Users size={12} color="rgba(44,36,27,0.4)" />
                <span className="text-xs" style={{ color: "rgba(44,36,27,0.5)" }}>{t.capacity} kursi</span>
              </div>
              <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: `${st.color}15`, color: st.color }}>{st.label}</span>
              <div className="flex justify-center gap-2 mt-3">
                <button onClick={() => openEdit(t)} className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: "rgba(192,139,92,0.1)" }}><Edit2 size={12} color="#C08B5C" /></button>
                <button onClick={() => toggleActive(t.id, t.isActive)} className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: t.isActive ? "rgba(239,68,68,0.08)" : "rgba(16,185,129,0.08)" }}>
                  <span className="text-[10px] font-bold" style={{ color: t.isActive ? "#f87171" : "#10B981" }}>{t.isActive ? "OFF" : "ON"}</span>
                </button>
                <button onClick={() => setConfirmDeleteId(t.id)} className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: "rgba(239,68,68,0.08)" }}><Trash2 size={12} color="#f87171" /></button>
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
                <h2 className="text-lg font-bold" style={{ color: "#2C241B" }}>{editId ? "Edit Meja" : "Tambah Meja"}</h2>
                <button onClick={reset} className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: "rgba(0,0,0,0.04)" }}><X size={16} color="rgba(44,36,27,0.5)" /></button>
              </div>
              <div className="space-y-4">
                <div><label className="block text-sm font-medium mb-1.5" style={{ color: "rgba(44,36,27,0.7)" }}>Kode Meja</label><input type="text" value={fCode} onChange={e => setFCode(e.target.value)} placeholder="A01" className="pos-input" style={{ fontSize: "13px" }} /></div>
                <div><label className="block text-sm font-medium mb-1.5" style={{ color: "rgba(44,36,27,0.7)" }}>Nama Meja</label><input type="text" value={fName} onChange={e => setFName(e.target.value)} placeholder="Meja A01" className="pos-input" style={{ fontSize: "13px" }} /></div>
                <div><label className="block text-sm font-medium mb-1.5" style={{ color: "rgba(44,36,27,0.7)" }}>Kapasitas</label><input type="number" value={fCap} onChange={e => setFCap(parseInt(e.target.value)||1)} className="pos-input" style={{ fontSize: "13px", width: 100 }} /></div>
              </div>
              <div className="flex gap-3 mt-6">
                <button onClick={reset} className="flex-1 px-4 py-3 rounded-xl text-sm font-medium" style={{ background: "rgba(0,0,0,0.04)", color: "rgba(44,36,27,0.7)" }}>Batal</button>
                <button onClick={handleSubmit} disabled={loading} className="btn-primary flex-1" style={{ background: loading ? "#8A6A55" : "#C08B5C" }}>{loading ? "Menyimpan..." : editId ? "Simpan" : "Tambah"}</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <ConfirmDialog
        isOpen={!!confirmDeleteId}
        onClose={() => setConfirmDeleteId(null)}
        onConfirm={handleDelete}
        isLoading={deleteLoading}
        title="Hapus Meja"
        message={`Apakah Anda yakin ingin menghapus meja ${items.find(t => t.id === confirmDeleteId)?.code || ""} (${items.find(t => t.id === confirmDeleteId)?.name || ""})? Meja ini akan dihapus secara permanen dari database.`}
        confirmText="Ya, Hapus"
        cancelText="Batal"
        variant="danger"
      />
    </div>
  );
}
