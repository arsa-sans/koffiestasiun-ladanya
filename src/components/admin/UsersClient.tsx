"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Edit2, Trash2, X, Search, Shield, ChefHat, CreditCard } from "lucide-react";
import { createUser, updateUser, deleteUser } from "@/server/services/users";
import { toast } from "sonner";

interface UserItem {
  id: string; name: string; email: string;
  role: string; isActive: string; createdAt: string;
}

const ROLE_CONFIG: Record<string, { label: string; color: string; icon: typeof Shield }> = {
  admin: { label: "Admin", color: "#8B5CF6", icon: Shield },
  cashier: { label: "Kasir", color: "#C08B5C", icon: CreditCard },
  kitchen: { label: "Kitchen", color: "#EF4444", icon: ChefHat },
};

export default function UsersClient({ users: init }: { users: UserItem[] }) {
  const [items, setItems] = useState(init);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<string|null>(null);
  const [loading, setLoading] = useState(false);
  const [fName, setFName] = useState("");
  const [fEmail, setFEmail] = useState("");
  const [fRole, setFRole] = useState<"admin"|"cashier"|"kitchen">("cashier");

  const filtered = items.filter(u => {
    if (roleFilter !== "all" && u.role !== roleFilter) return false;
    if (search && !u.name.toLowerCase().includes(search.toLowerCase()) && !u.email.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const reset = () => { setFName(""); setFEmail(""); setFRole("cashier"); setEditId(null); setShowForm(false); };

  const openEdit = (u: UserItem) => { setFName(u.name); setFEmail(u.email); setFRole(u.role as "admin"|"cashier"|"kitchen"); setEditId(u.id); setShowForm(true); };

  const handleSubmit = async () => {
    if (!fName.trim() || !fEmail.trim()) { toast.error("Nama dan email harus diisi"); return; }
    setLoading(true);
    try {
      if (editId) {
        const r = await updateUser(editId, { name: fName, email: fEmail, role: fRole });
        if (r.success) { setItems(p => p.map(u => u.id===editId ? { ...u, name: fName, email: fEmail, role: fRole } : u)); toast.success("Pengguna diperbarui"); }
      } else {
        const r = await createUser({ name: fName, email: fEmail, role: fRole });
        if (r.success && r.data) { setItems(p => [...p, { id: r.data.id, name: r.data.name, email: r.data.email, role: r.data.role, isActive: r.data.isActive, createdAt: r.data.createdAt.toISOString() }]); toast.success("Pengguna ditambahkan"); }
      }
      reset();
    } catch { toast.error("Terjadi kesalahan"); } finally { setLoading(false); }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Yakin hapus pengguna ini?")) return;
    try { await deleteUser(id); setItems(p => p.filter(u => u.id!==id)); toast.success("Pengguna dihapus"); } catch { toast.error("Gagal menghapus"); }
  };

  const toggleActive = async (id: string, cur: string) => {
    const next = cur === "true" ? "false" : "true";
    try { await updateUser(id, { isActive: next }); setItems(p => p.map(u => u.id===id ? { ...u, isActive: next } : u)); toast.success(`Pengguna ${next==="true"?"diaktifkan":"dinonaktifkan"}`); } catch { toast.error("Gagal"); }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold" style={{ color: "#2C241B", fontFamily: "Playfair Display, serif" }}>Manajemen Pengguna</h1>
        <button onClick={() => setShowForm(true)} className="btn-primary px-5" style={{ height: 44 }}><Plus size={16} /> Tambah Pengguna</button>
      </div>

      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-xs">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2" color="rgba(44,36,27,0.35)" />
          <input type="text" placeholder="Cari nama/email..." value={search} onChange={e => setSearch(e.target.value)} className="pos-input pl-9" style={{ fontSize: "13px" }} />
        </div>
        <select value={roleFilter} onChange={e => setRoleFilter(e.target.value)} className="pos-input" style={{ width: "auto", fontSize: "13px", padding: "9px 12px" }}>
          <option value="all">Semua Role</option>
          <option value="admin">Admin</option>
          <option value="cashier">Kasir</option>
          <option value="kitchen">Kitchen</option>
        </select>
      </div>

      <div className="rounded-2xl overflow-hidden" style={{ background: "#FFFFFF", border: "1px solid rgba(0,0,0,0.05)" }}>
        <table className="pos-table">
          <thead><tr><th>Pengguna</th><th>Email</th><th>Role</th><th>Status</th><th>Aksi</th></tr></thead>
          <tbody>
            {filtered.map(u => {
              const rc = ROLE_CONFIG[u.role] || ROLE_CONFIG.cashier;
              const Icon = rc.icon;
              return (
                <tr key={u.id}>
                  <td>
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: `${rc.color}15` }}><Icon size={16} color={rc.color} /></div>
                      <p className="text-sm font-semibold" style={{ color: "#2C241B" }}>{u.name}</p>
                    </div>
                  </td>
                  <td className="text-sm" style={{ color: "rgba(44,36,27,0.6)" }}>{u.email}</td>
                  <td><span className="text-xs px-2 py-0.5 rounded-full" style={{ background: `${rc.color}15`, color: rc.color }}>{rc.label}</span></td>
                  <td>
                    <button onClick={() => toggleActive(u.id, u.isActive)}>
                      {u.isActive==="true" ? <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: "rgba(16,185,129,0.1)", color: "#10B981" }}>Aktif</span> : <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: "rgba(239,68,68,0.1)", color: "#f87171" }}>Nonaktif</span>}
                    </button>
                  </td>
                  <td>
                    <div className="flex gap-2">
                      <button onClick={() => openEdit(u)} className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: "rgba(192,139,92,0.1)" }}><Edit2 size={13} color="#C08B5C" /></button>
                      <button onClick={() => handleDelete(u.id)} className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: "rgba(239,68,68,0.08)" }}><Trash2 size={13} color="#f87171" /></button>
                    </div>
                  </td>
                </tr>
              );
            })}
            {filtered.length===0 && <tr><td colSpan={5} className="text-center py-8" style={{ color: "rgba(44,36,27,0.3)" }}>Tidak ada pengguna</td></tr>}
          </tbody>
        </table>
      </div>

      <AnimatePresence>
        {showForm && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-center justify-center" style={{ background: "rgba(0,0,0,0.3)" }} onClick={reset}>
            <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }} className="rounded-3xl p-6 w-full max-w-md" style={{ background: "#FFFFFF", border: "1px solid rgba(0,0,0,0.06)" }} onClick={e => e.stopPropagation()}>
              <div className="flex items-center justify-between mb-5">
                <h2 className="text-lg font-bold" style={{ color: "#2C241B" }}>{editId ? "Edit Pengguna" : "Tambah Pengguna"}</h2>
                <button onClick={reset} className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: "rgba(0,0,0,0.04)" }}><X size={16} color="rgba(44,36,27,0.5)" /></button>
              </div>
              <div className="space-y-4">
                <div><label className="block text-sm font-medium mb-1.5" style={{ color: "rgba(44,36,27,0.7)" }}>Nama</label><input type="text" value={fName} onChange={e => setFName(e.target.value)} placeholder="Nama lengkap" className="pos-input" style={{ fontSize: "13px" }} /></div>
                <div><label className="block text-sm font-medium mb-1.5" style={{ color: "rgba(44,36,27,0.7)" }}>Email</label><input type="email" value={fEmail} onChange={e => setFEmail(e.target.value)} placeholder="email@example.com" className="pos-input" style={{ fontSize: "13px" }} /></div>
                <div><label className="block text-sm font-medium mb-1.5" style={{ color: "rgba(44,36,27,0.7)" }}>Role</label><select value={fRole} onChange={e => setFRole(e.target.value as "admin"|"cashier"|"kitchen")} className="pos-input" style={{ fontSize: "13px" }}><option value="admin">Admin</option><option value="cashier">Kasir</option><option value="kitchen">Kitchen</option></select></div>
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
