// src/components/admin/SqlEditorClient.tsx
"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Terminal,
  Play,
  Trash2,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Database,
  Sparkles,
  Download,
  Info,
  ChevronRight,
  DatabaseZap,
  Code2,
  X,
  FileCode,
} from "lucide-react";
import { executeSqlQuery, SqlQueryResult } from "@/server/actions/sql";
import { toast } from "sonner";

const TABLES_LIST = [
  { name: "users", desc: "Data Pengguna (Admin, Kasir, Dapur)" },
  { name: "orders", desc: "Data Pesanan Transaksi" },
  { name: "order_items", desc: "Detail Item Pesanan" },
  { name: "order_item_modifiers", desc: "Detail Kustomisasi Item Pesanan" },
  { name: "payments", desc: "Data Pembayaran Transaksi" },
  { name: "products", desc: "Katalog Produk Minuman/Makanan" },
  { name: "categories", desc: "Kategori Produk" },
  { name: "ingredients", desc: "Inventaris Bahan Baku" },
  { name: "recipes", desc: "Resep Link Produk ke Bahan Baku" },
  { name: "dining_tables", desc: "Data Meja Restoran" },
  { name: "kitchen_stations", desc: "Stasiun Dapur Pemrosesan" },
  { name: "modifier_groups", desc: "Kelompok Pilihan Kustomisasi" },
  { name: "modifier_options", desc: "Opsi Pilihan Kustomisasi" },
  { name: "modifier_recipes", desc: "Resep Opsi Kustomisasi ke Bahan Baku" },
  { name: "product_modifier_groups", desc: "Link Produk ke Pilihan Kustomisasi" },
  { name: "inventory_transactions", desc: "Riwayat Perubahan Stok" },
  { name: "stock_opnames", desc: "Data Stock Opname Mandiri" },
  { name: "stock_opname_items", desc: "Detail Item Stock Opname" },
  { name: "activity_logs", desc: "Log Aktivitas Semua Pengguna" },
  { name: "additional_fees", desc: "Biaya Layanan/Tambahan POS" },
];

const TRUNCATE_QUERY = `-- KOSONGKAN SEMUA DATA DUMMY (KECUALI DATA USER)
-- Script ini akan menghapus semua data transaksi, inventaris, menu, meja, dan stasiun
-- Data pengguna (users) di tabel 'users' TIDAK AKAN DIHAPUS.

TRUNCATE TABLE 
  activity_logs,
  inventory_transactions,
  stock_opname_items,
  stock_opnames,
  void_logs,
  payments,
  order_item_modifiers,
  order_items,
  orders,
  product_modifier_groups,
  modifier_recipes,
  modifier_options,
  modifier_groups,
  recipes,
  ingredients,
  products,
  categories,
  dining_tables,
  kitchen_stations,
  additional_fees
RESTART IDENTITY CASCADE;

-- Catatan: CASCADE otomatis mengosongkan tabel relasi yang bergantung secara aman.`;

const SHORTCUTS = [
  {
    label: "Kosongkan Data Dummy (Kecuali Users)",
    query: TRUNCATE_QUERY,
    variant: "danger",
    icon: <Trash2 size={13} />,
  },
  {
    label: "Lihat Semua Pengguna",
    query: "SELECT id, name, email, role, is_active, created_at FROM users ORDER BY role ASC;",
    variant: "default",
    icon: <Database size={13} />,
  },
  {
    label: "Lihat Pesanan Hari Ini",
    query: "SELECT id, order_number, status, total_amount, created_at FROM orders WHERE created_at >= CURRENT_DATE ORDER BY created_at DESC;",
    variant: "default",
    icon: <DatabaseZap size={13} />,
  },
  {
    label: "Cek Stok Bahan Menipis",
    query: "SELECT name, stock, min_stock, unit FROM ingredients WHERE CAST(stock AS float) <= CAST(min_stock AS float) * 1.2 ORDER BY CAST(stock AS float) ASC;",
    variant: "default",
    icon: <AlertTriangle size={13} />,
  },
];

export default function SqlEditorClient() {
  const [query, setQuery] = useState("SELECT * FROM users LIMIT 10;");
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<SqlQueryResult | null>(null);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);

  // Focus textarea on load
  useEffect(() => {
    const el = document.getElementById("sql-textarea");
    if (el) el.focus();
  }, []);

  const handleShortcutClick = (sqlStr: string) => {
    setQuery(sqlStr);
    const el = document.getElementById("sql-textarea");
    if (el) el.focus();
    toast.success("Query dimuat ke editor!");
  };

  const handleTableClick = (tableName: string) => {
    setQuery(`SELECT * FROM ${tableName} LIMIT 50;`);
    const el = document.getElementById("sql-textarea");
    if (el) el.focus();
    toast.success(`Query SELECT untuk tabel '${tableName}' dimuat!`);
  };

  const isDestructiveQuery = (sqlText: string) => {
    const text = sqlText.toLowerCase();
    return (
      text.includes("truncate") ||
      text.includes("drop") ||
      text.includes("delete") ||
      text.includes("update")
    );
  };

  const onExecuteClick = () => {
    if (!query.trim()) {
      toast.error("Silakan tulis query SQL terlebih dahulu!");
      return;
    }

    if (isDestructiveQuery(query)) {
      setIsConfirmOpen(true);
    } else {
      runQuery();
    }
  };

  const runQuery = async () => {
    setIsConfirmOpen(false);
    setIsLoading(true);
    setResult(null);

    const promise = executeSqlQuery(query);
    toast.promise(promise, {
      loading: "Mengeksekusi SQL query...",
      success: (res) => {
        if (res.success) return "Eksekusi berhasil!";
        throw new Error(res.error);
      },
      error: (err) => err.message || "Gagal mengeksekusi SQL.",
    });

    try {
      const res = await promise;
      setResult(res);
    } catch (e: any) {
      setResult({
        success: false,
        error: e.message || "Terjadi kesalahan saat memproses data.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    // Ctrl + Enter or Cmd + Enter to run
    if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
      e.preventDefault();
      onExecuteClick();
    }
  };

  const downloadJson = () => {
    if (!result || !result.rows) return;
    const jsonStr = JSON.stringify(result.rows, null, 2);
    const blob = new Blob([jsonStr], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `koffiepos_sql_result_${result.command?.toLowerCase() || "query"}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success("Berhasil mengekspor hasil ke JSON!");
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1
            className="text-2xl font-bold flex items-center gap-2"
            style={{ fontFamily: "Playfair Display, serif", color: "#2C241B" }}
          >
            <Terminal className="text-[#C08B5C]" /> SQL Editor & Database Manager
          </h1>
          <p className="text-sm mt-1" style={{ color: "rgba(44,36,27,0.5)" }}>
            Kelola database Postgres secara langsung melalui instruksi SQL mentah.
          </p>
        </div>
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold" style={{ background: "rgba(192,139,92,0.1)", color: "#C08B5C", border: "1px solid rgba(192,139,92,0.2)" }}>
          <Database size={13} className="animate-pulse" /> Connected to Supabase
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Left Panel: Shortcuts & Schema */}
        <div className="lg:col-span-1 space-y-6 flex flex-col h-[calc(100vh-210px)] overflow-y-auto pr-1">
          {/* Shortcuts Panel */}
          <div className="bg-white p-5 rounded-2xl border border-black/[0.04] shadow-sm space-y-4">
            <h3 className="text-sm font-bold flex items-center gap-2" style={{ color: "#2C241B" }}>
              <Sparkles size={16} className="text-[#C08B5C]" /> Pintasan Query
            </h3>
            <div className="space-y-2.5">
              {SHORTCUTS.map((sc, idx) => (
                <button
                  key={idx}
                  onClick={() => handleShortcutClick(sc.query)}
                  className={`w-full text-left px-3.5 py-3 rounded-xl text-xs font-semibold flex items-start gap-2.5 transition-all border ${
                    sc.variant === "danger"
                      ? "bg-red-50/50 border-red-100 hover:bg-red-50 text-red-600 hover:border-red-200"
                      : "bg-[#F8F5F2] hover:bg-[#F3EFEA] border-black/[0.03] text-[#2C241B] hover:border-black/[0.08]"
                  }`}
                >
                  <span className="mt-0.5">{sc.icon}</span>
                  <span>{sc.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Database Schema Panel */}
          <div className="bg-white p-5 rounded-2xl border border-black/[0.04] shadow-sm flex-1 flex flex-col min-h-[350px]">
            <h3 className="text-sm font-bold flex items-center gap-2 mb-3" style={{ color: "#2C241B" }}>
              <Code2 size={16} className="text-[#C08B5C]" /> Skema Tabel ({TABLES_LIST.length})
            </h3>
            <div className="space-y-1 overflow-y-auto flex-1 max-h-[350px] lg:max-h-none pr-1">
              {TABLES_LIST.map((table) => {
                const isUsers = table.name === "users";
                return (
                  <button
                    key={table.name}
                    onClick={() => handleTableClick(table.name)}
                    className="w-full text-left px-3 py-2 rounded-xl text-xs hover:bg-[#F8F5F2] flex items-center justify-between group transition-all"
                  >
                    <div className="min-w-0 pr-2">
                      <span className={`font-mono font-bold block ${isUsers ? "text-green-600" : "text-[#2C241B]"}`}>
                        {table.name} {isUsers && <span className="text-[10px] bg-green-50 text-green-600 border border-green-200 px-1 rounded ml-1 font-sans">PROTECTED</span>}
                      </span>
                      <span className="text-[10px] text-gray-400 block truncate leading-relaxed">
                        {table.desc}
                      </span>
                    </div>
                    <ChevronRight size={12} className="text-gray-300 opacity-0 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all flex-shrink-0" />
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right Panel: Editor & Terminal */}
        <div className="lg:col-span-3 space-y-6 flex flex-col">
          {/* SQL Editor Area */}
          <div className="bg-[#1E1E1E] rounded-2xl shadow-xl border border-[#2D2D2D] overflow-hidden flex flex-col">
            {/* Editor Top Bar */}
            <div className="bg-[#252526] px-5 py-3 border-b border-[#2D2D2D] flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="flex gap-1.5">
                  <div className="w-3 h-3 rounded-full bg-red-500/80" />
                  <div className="w-3 h-3 rounded-full bg-yellow-500/80" />
                  <div className="w-3 h-3 rounded-full bg-green-500/80" />
                </div>
                <span className="text-xs font-mono text-gray-400 ml-3 flex items-center gap-1.5">
                  <FileCode size={14} className="text-[#C08B5C]" /> query.sql
                </span>
              </div>
              <div className="text-[10px] text-gray-500 font-mono">
                Press <kbd className="bg-[#333] px-1 py-0.5 rounded text-gray-300">Ctrl</kbd> + <kbd className="bg-[#333] px-1 py-0.5 rounded text-gray-300">Enter</kbd> to run
              </div>
            </div>

            {/* Code Textarea */}
            <div className="relative flex-1">
              <textarea
                id="sql-textarea"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={handleKeyDown}
                rows={10}
                className="w-full bg-[#1E1E1E] text-[#D4D4D4] font-mono text-sm p-5 border-0 focus:ring-0 focus:outline-none resize-y leading-relaxed selection:bg-[#3A3D41]"
                style={{ minHeight: "200px" }}
                placeholder="Tulis instruksi SQL di sini..."
              />
            </div>

            {/* Editor Action Bar */}
            <div className="bg-[#1E1E1E] border-t border-[#2D2D2D] px-5 py-4 flex items-center justify-between">
              <button
                onClick={() => setQuery("")}
                className="px-4 py-2 text-xs font-medium text-gray-400 hover:text-white transition-colors"
              >
                Clear Editor
              </button>
              <button
                onClick={onExecuteClick}
                disabled={isLoading}
                className="flex items-center gap-2 px-5 py-2.5 bg-[#C08B5C] hover:bg-[#A9754B] disabled:opacity-50 text-white rounded-xl text-xs font-bold transition-all shadow-md active:scale-95"
              >
                {isLoading ? (
                  <>
                    <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Executing...
                  </>
                ) : (
                  <>
                    <Play size={13} fill="currentColor" /> Run Query
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Results Terminal Output */}
          <div className="bg-white rounded-2xl border border-black/[0.04] shadow-sm overflow-hidden flex flex-col flex-1 min-h-[300px]">
            {/* Results Title Bar */}
            <div className="px-5 py-4 border-b border-black/[0.03] flex items-center justify-between bg-[#F8F5F2]">
              <h3 className="text-sm font-bold flex items-center gap-2" style={{ color: "#2C241B" }}>
                <Terminal size={15} className="text-[#C08B5C]" /> Hasil Eksekusi
              </h3>
              {result?.success && result.rows && (
                <button
                  onClick={downloadJson}
                  className="flex items-center gap-1.5 text-xs text-[#C08B5C] hover:text-[#A9754B] font-semibold transition-colors"
                >
                  <Download size={13} /> Export JSON
                </button>
              )}
            </div>

            {/* Results Container */}
            <div className="p-5 flex-1 flex flex-col overflow-x-auto min-h-[220px]">
              <AnimatePresence mode="wait">
                {/* Loader */}
                {isLoading && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="flex-1 flex flex-col items-center justify-center py-12 space-y-3"
                  >
                    <span className="w-8 h-8 border-3 border-[#C08B5C]/20 border-t-[#C08B5C] rounded-full animate-spin" />
                    <p className="text-xs text-gray-400 font-medium">Mengeksekusi SQL query di database...</p>
                  </motion.div>
                )}

                {/* Initial state */}
                {!isLoading && !result && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="flex-1 flex flex-col items-center justify-center py-16 text-center"
                  >
                    <div className="w-12 h-12 rounded-2xl bg-[#F8F5F2] border border-black/[0.02] flex items-center justify-center mb-3">
                      <Terminal size={20} className="text-gray-300" />
                    </div>
                    <p className="text-xs font-semibold" style={{ color: "rgba(44,36,27,0.5)" }}>
                      Terminal Siap
                    </p>
                    <p className="text-[11px] text-gray-400 mt-1 max-w-[280px]">
                      Silakan tulis dan jalankan query SQL Anda di editor di atas untuk melihat hasilnya.
                    </p>
                  </motion.div>
                )}

                {/* Error Response */}
                {!isLoading && result && !result.success && (
                  <motion.div
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    className="flex-1 bg-red-50/50 border border-red-100 rounded-xl p-5 font-mono text-xs text-red-600 overflow-y-auto space-y-2.5"
                  >
                    <div className="flex items-center gap-2 font-sans font-bold text-red-700">
                      <AlertTriangle size={15} /> Database Error!
                    </div>
                    <div className="bg-[#1E1E1E] text-red-400 p-4 rounded-lg overflow-x-auto whitespace-pre-wrap select-all font-mono leading-relaxed border border-[#3A1E1E]">
                      {result.error}
                    </div>
                    <div className="text-[10px] text-gray-400 font-sans flex items-center gap-3">
                      <span className="flex items-center gap-1"><Clock size={11} /> {result.executionTime}ms</span>
                    </div>
                  </motion.div>
                )}

                {/* Success Response with NO Data Rows (e.g. TRUNCATE, UPDATE, DELETE) */}
                {!isLoading && result && result.success && !result.rows && (
                  <motion.div
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    className="flex-1 flex flex-col justify-center py-10"
                  >
                    <div className="bg-emerald-50/50 border border-emerald-100 rounded-2xl p-6 text-center max-w-md mx-auto space-y-3">
                      <div className="w-10 h-10 rounded-full bg-emerald-100/50 flex items-center justify-center mx-auto text-emerald-600">
                        <CheckCircle2 size={20} />
                      </div>
                      <div>
                        <h4 className="text-sm font-bold text-emerald-800">Query Berhasil Dieksekusi</h4>
                        <p className="text-xs text-emerald-600/80 mt-1">
                          Perintah <span className="font-mono font-bold bg-emerald-100 px-1 py-0.5 rounded text-emerald-800">{result.command}</span> berhasil diselesaikan tanpa kesalahan.
                        </p>
                      </div>
                      <div className="pt-2 border-t border-emerald-100/40 text-[10px] text-emerald-600/70 font-mono flex items-center justify-center gap-4">
                        {result.affectedRows !== undefined && (
                          <span>Baris Terdampak: {result.affectedRows}</span>
                        )}
                        <span>Durasi: {result.executionTime}ms</span>
                      </div>
                    </div>
                  </motion.div>
                )}

                {/* Success Response with Data Rows (SELECT) */}
                {!isLoading && result && result.success && result.rows && result.columns && (
                  <motion.div
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    className="flex-1 flex flex-col space-y-3"
                  >
                    {/* Execution Meta */}
                    <div className="flex items-center justify-between text-xs text-gray-400 px-1">
                      <span className="font-medium">
                        Ditemukan <span className="font-bold text-gray-700">{result.rows.length}</span> baris data
                      </span>
                      <span className="flex items-center gap-1.5 text-[11px] font-mono">
                        <Clock size={11} /> {result.executionTime}ms
                      </span>
                    </div>

                    {/* Table View */}
                    <div className="border border-black/[0.03] rounded-xl overflow-hidden overflow-x-auto max-h-[380px] scrollbar-thin">
                      <table className="w-full text-left border-collapse text-xs">
                        <thead>
                          <tr className="bg-[#F8F5F2] border-b border-black/[0.03] text-gray-500 font-semibold sticky top-0 z-10">
                            <th className="py-2.5 px-4 font-mono text-[10px] w-12 text-center select-none border-r border-black/[0.02]">#</th>
                            {result.columns.map((col) => (
                              <th key={col} className="py-2.5 px-4 font-mono text-[11px] tracking-tight border-r border-black/[0.02] last:border-r-0">
                                {col}
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-black/[0.02] font-mono text-[11px]">
                          {result.rows.map((row, idx) => (
                            <tr key={idx} className="hover:bg-[#F8F5F2]/50 transition-colors odd:bg-white even:bg-[#F8F5F2]/10">
                              <td className="py-2 px-4 text-center text-gray-400 select-none font-sans font-medium border-r border-black/[0.01]">{idx + 1}</td>
                              {result.columns!.map((col) => {
                                const val = row[col];
                                let renderVal = "";
                                if (val === null) {
                                  renderVal = "null";
                                } else if (typeof val === "object") {
                                  renderVal = JSON.stringify(val);
                                } else {
                                  renderVal = String(val);
                                }

                                return (
                                  <td
                                    key={col}
                                    className={`py-2 px-4 whitespace-nowrap overflow-hidden max-w-xs truncate border-r border-black/[0.01] last:border-r-0 ${
                                      val === null ? "text-gray-300 italic font-sans" : "text-gray-700"
                                    }`}
                                    title={renderVal}
                                  >
                                    {renderVal}
                                  </td>
                                );
                              })}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>
      </div>

      {/* Confirmation Dialog Modal (For destructive queries) */}
      <AnimatePresence>
        {isConfirmOpen && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-3xl p-6 shadow-2xl max-w-md w-full border border-red-50 space-y-4"
            >
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-red-50 flex items-center justify-center text-red-600 flex-shrink-0">
                  <AlertTriangle size={24} />
                </div>
                <div>
                  <h3 className="text-base font-bold" style={{ color: "#2C241B" }}>
                    Konfirmasi Tindakan Destruktif
                  </h3>
                  <p className="text-xs text-red-600/80 font-medium">
                    Tindakan ini tidak dapat dibatalkan!
                  </p>
                </div>
              </div>

              <div className="bg-red-50/50 border border-red-100 rounded-2xl p-4 text-xs space-y-2">
                <div className="font-semibold text-red-800 flex items-center gap-1">
                  <Info size={13} /> Peringatan Keamanan
                </div>
                <p className="text-red-700/80 leading-relaxed font-sans">
                  Query Anda mengandung kata kunci modifikasi/penghapusan data (<span className="font-mono font-bold bg-red-100 text-red-800 px-0.5 rounded">TRUNCATE / DELETE / DROP / UPDATE</span>). Menjalankan query ini akan mengubah data produksi secara permanen di Supabase.
                </p>
              </div>

              <div className="pt-2 flex items-center gap-3 justify-end text-xs font-bold">
                <button
                  onClick={() => setIsConfirmOpen(false)}
                  className="px-4.5 py-2.5 hover:bg-gray-100 text-gray-500 rounded-xl transition-colors active:scale-95"
                >
                  Batal
                </button>
                <button
                  onClick={runQuery}
                  className="px-5 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-xl shadow-lg shadow-red-600/15 transition-all active:scale-95 flex items-center gap-1.5"
                >
                  <Trash2 size={13} /> Ya, Jalankan Query
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
