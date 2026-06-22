"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Clock, ChevronRight, Maximize2, Minimize2, Layers, ChefHat, Send } from "lucide-react";
import { advanceItemStatus } from "@/server/actions/kitchen";
import { STATION_COLORS, STATION_LABELS, STATUS_COLORS } from "@/constants";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";

interface KitchenItem {
  id: string;
  quantity: number;
  status: string;
  notes?: string | null;
  createdAt: string;
  startedAt?: string | null;
  completedAt?: string | null;
  product: { name: string; station: { type: string } };
  modifiers: { name: string }[];
}

interface KitchenOrder {
  id: string;
  orderNumber: string;
  orderType: string;
  createdAt: string;
  table?: { code: string } | null;
  items: KitchenItem[];
}

const STATIONS = ["all", "bar", "kitchen", "sushi"] as const;

export default function KitchenClient({ initialOrders }: { initialOrders: KitchenOrder[] }) {
  const [orders, setOrders] = useState(initialOrders);
  const [station, setStation] = useState<string>("all");
  const [fullscreen, setFullscreen] = useState(false);
  const [now, setNow] = useState(new Date());
  const [activeTab, setActiveTab] = useState<"antri" | "masak" | "antar">("antri");

  // Live clock
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  // Polling: auto-refresh every 10s — primary sync mechanism
  useEffect(() => {
    const poll = setInterval(() => {
      fetch("/api/kitchen/orders")
        .then((r) => r.json())
        .then((data) => { if (data.orders) setOrders(data.orders); })
        .catch(() => {});
    }, 10000);
    return () => clearInterval(poll);
  }, []);

  // Supabase Realtime (instant updates if configured)
  useEffect(() => {
    try {
      const supabase = createClient();
      const channel = supabase
        .channel("kitchen-orders")
        .on("postgres_changes", { event: "INSERT", schema: "public", table: "orders" }, () => {
          fetch("/api/kitchen/orders")
            .then((r) => r.json())
            .then((data) => { if (data.orders) setOrders(data.orders); })
            .catch(() => {});
        })
        .on("postgres_changes", { event: "UPDATE", schema: "public", table: "order_items" }, (payload) => {
          const updated = payload.new as Record<string, unknown>;
          if (updated && typeof updated.id === "string" && typeof updated.status === "string") {
            setOrders((prev) =>
              prev.map((order) => ({
                ...order,
                items: order.items.map((item) =>
                  item.id === updated.id ? { ...item, status: updated.status as string } : item
                ),
              }))
            );
          }
        })
        .subscribe();
      return () => { supabase.removeChannel(channel); };
    } catch {
      // Supabase realtime not available, polling handles it
    }
  }, []);

  const ITEM_STATUS_FLOW = ["pending", "queued", "cooking", "ready", "delivered"];

  const handleAdvance = async (itemId: string, currentStatus: string) => {
    const currentIndex = ITEM_STATUS_FLOW.indexOf(currentStatus);
    if (currentIndex === -1 || currentIndex >= ITEM_STATUS_FLOW.length - 1) return;
    const nextStatus = ITEM_STATUS_FLOW[currentIndex + 1];

    // Optimistic update
    setOrders((prev) =>
      prev.map((order) => ({
        ...order,
        items: order.items.map((item) =>
          item.id === itemId ? { ...item, status: nextStatus } : item
        ),
      }))
    );

    const result = await advanceItemStatus(itemId, currentStatus);
    if (!result.success) {
      // Rollback
      setOrders((prev) =>
        prev.map((order) => ({
          ...order,
          items: order.items.map((item) =>
            item.id === itemId ? { ...item, status: currentStatus } : item
          ),
        }))
      );
      toast.error("Gagal update status");
    }
  };

  // Flatten and filter items by station & valid statuses
  const derivedItems = orders.flatMap((order) =>
    order.items
      .filter((item) => {
        if (item.status === "delivered" || item.status === "canceled" || item.status === "void") return false;
        if (station !== "all") return item.product.station.type === station;
        return true;
      })
      .map((item) => ({
        ...item,
        orderId: order.id,
        orderNumber: order.orderNumber,
        orderType: order.orderType,
        tableCode: order.table?.code,
      }))
  );

  // Split into Kanban columns
  const antriItems = derivedItems.filter((item) => item.status === "pending" || item.status === "queued");
  const masakItems = derivedItems.filter((item) => item.status === "cooking");
  const antarItems = derivedItems.filter((item) => item.status === "ready");

  const getElapsedMins = (dateStr: string) => Math.floor((now.getTime() - new Date(dateStr).getTime()) / 60000);
  const getElapsedFormatted = (dateStr: string) => {
    const diff = Math.max(0, now.getTime() - new Date(dateStr).getTime());
    const m = Math.floor(diff / 60000);
    const s = Math.floor((diff % 60000) / 1000);
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  const elapsedColor = (mins: number) => {
    if (mins < 5) return "#10B981";
    if (mins < 10) return "#F59E0B";
    return "#EF4444";
  };

  const getButtonLabel = (status: string) => {
    if (status === "pending") return "Mulai Antrean";
    if (status === "queued") return "Mulai Masak";
    if (status === "cooking") return "Selesai Masak";
    if (status === "ready") return "Selesai Diantar";
    return "Lanjut";
  };

  const renderItemCard = (item: any) => {
    const elapsedMins = getElapsedMins(item.createdAt);
    const elapsedFormatted = getElapsedFormatted(item.createdAt);
    const statusColor = STATUS_COLORS[item.status] || "#C08B5C";
    const isTakeaway = item.orderType === "takeaway";

    return (
      <motion.div
        key={item.id}
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95 }}
        layout
        className="rounded-2xl overflow-hidden bg-white border border-black/5 hover:border-[#C08B5C]/35 hover:shadow-md transition-all duration-200"
        style={{
          boxShadow: "0 2px 12px rgba(0,0,0,0.03)",
        }}
      >
        {/* Top Accent line based on status */}
        <div style={{ height: 4, background: statusColor }} />

        {/* Card Content */}
        <div className="p-4 flex flex-col gap-3">
          {/* Header */}
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-1.5 flex-wrap">
              {isTakeaway ? (
                <span className="text-[10px] px-2 py-0.5 rounded-full font-bold inline-block bg-purple-500/10 text-purple-600">
                  📦 Takeaway
                </span>
              ) : (
                <span className="text-[10px] px-2 py-0.5 rounded-full font-bold inline-block bg-[rgba(192,139,92,0.1)] text-[#C08B5C]">
                  🪑 Meja {item.tableCode || "-"}
                </span>
              )}
              <span className="text-[10px] font-mono font-semibold text-[#2C241B]/40">
                #{item.orderNumber}
              </span>
            </div>

            <div className="flex items-center gap-1 px-1.5 py-0.5 rounded-lg" style={{ background: `${elapsedColor(elapsedMins)}12` }}>
              <Clock size={11} color={elapsedColor(elapsedMins)} />
              <span className="text-xs font-bold font-mono" style={{ color: elapsedColor(elapsedMins) }}>
                {elapsedFormatted}
              </span>
            </div>
          </div>

          {/* Divider */}
          <div className="h-[1px] bg-black/[0.04]" />

          {/* Product and details */}
          <div className="min-w-0">
            <h4 className="text-sm font-bold text-[#2C241B] leading-snug">
              <span className="text-[#C08B5C] font-extrabold mr-1.5">{item.quantity}×</span>
              {item.product.name}
            </h4>

            {item.modifiers.length > 0 && (
              <p className="text-[11px] mt-1 text-[#C08B5C]/80 font-medium">
                + {item.modifiers.map((m: any) => m.name).join(", ")}
              </p>
            )}

            {item.notes && (
              <p className="text-[11px] italic mt-2 text-[#2C241B]/50 bg-black/[0.02] px-2.5 py-1.5 rounded-lg border border-black/[0.03]">
                📝 {item.notes}
              </p>
            )}
          </div>

          {/* Cooking timer */}
          {item.startedAt && (
            <div className="text-[10px] flex items-center gap-1 text-[#2C241B]/50 font-medium">
              <Clock size={10} />
              {item.status === "cooking" ? (
                <span className="font-mono text-blue-600">Memasak: {getElapsedFormatted(item.startedAt)}</span>
              ) : (
                <span className="font-mono">Selesai Masak: {item.completedAt ? getElapsedFormatted(item.startedAt) : "-"}</span>
              )}
            </div>
          )}

          {/* Ready timer */}
          {item.status === "ready" && item.completedAt && (
            <div className="text-[10px] flex items-center gap-1 text-emerald-600 font-medium">
              <Clock size={10} />
              <span className="font-mono">Menunggu Antar: {getElapsedFormatted(item.completedAt)}</span>
            </div>
          )}

          {/* Action Button */}
          <motion.button
            whileTap={{ scale: 0.97 }}
            onClick={() => handleAdvance(item.id, item.status)}
            className="w-full mt-1 py-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer"
            style={{
              background: item.status === "ready" ? "rgba(16,185,129,0.12)" : `${statusColor}12`,
              color: item.status === "ready" ? "#10B981" : statusColor,
              border: item.status === "ready" ? "1px solid rgba(16,185,129,0.2)" : `1px solid ${statusColor}20`,
            }}
          >
            <span>{getButtonLabel(item.status)}</span>
            {item.status !== "ready" && <ChevronRight size={12} />}
          </motion.button>
        </div>
      </motion.div>
    );
  };

  return (
    <div className="flex flex-col h-full" style={{ background: fullscreen ? "#FFFFFF" : undefined }}>
      {/* Station Filter Bar */}
      <div className="px-5 py-3 flex items-center justify-between flex-shrink-0" style={{ borderBottom: "1px solid rgba(0,0,0,0.06)", background: "rgba(248,245,242,0.95)" }}>
        <div className="flex items-center gap-2">
          {STATIONS.map((s) => {
            const isActive = station === s;
            const color = s === "all" ? "#C08B5C" : STATION_COLORS[s];
            return (
              <motion.button key={s} whileTap={{ scale: 0.95 }} onClick={() => setStation(s)}
                className="px-4 py-2 rounded-xl text-sm font-medium transition-all cursor-pointer"
                style={{
                  background: isActive ? `${color}22` : "rgba(0,0,0,0.04)",
                  color: isActive ? color : "rgba(44,36,27,0.5)",
                  border: isActive ? `1px solid ${color}44` : "1px solid transparent",
                }}>
                {s === "all" ? "Semua" : STATION_LABELS[s]}
              </motion.button>
            );
          })}
        </div>

        <div className="flex items-center gap-3">
          <span className="text-xs font-medium px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-600">
            {derivedItems.length} menu aktif
          </span>
          <div className="flex items-center gap-1.5 text-sm" style={{ color: "rgba(44,36,27,0.5)" }}>
            <Clock size={14} />
            {now.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })}
          </div>
          <button onClick={() => setFullscreen(!fullscreen)} className="w-9 h-9 rounded-xl flex items-center justify-center cursor-pointer hover:bg-black/5" style={{ background: "rgba(0,0,0,0.06)" }}>
            {fullscreen ? <Minimize2 size={16} color="#2C241B" /> : <Maximize2 size={16} color="#2C241B" />}
          </button>
        </div>
      </div>

      {/* Mobile view Tab selector */}
      <div className="flex md:hidden bg-white/95 backdrop-blur-md p-2 gap-2 border-b border-black/5 flex-shrink-0">
        <button
          onClick={() => setActiveTab("antri")}
          className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
            activeTab === "antri"
              ? "bg-amber-500/10 text-amber-700 border border-amber-500/20"
              : "text-[#2C241B]/55 border border-transparent"
          }`}
        >
          <Layers size={13} />
          <span>Antri</span>
          <span className="px-1.5 py-0.5 rounded-full text-[9px] bg-amber-500/15 text-amber-700 font-extrabold">
            {antriItems.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab("masak")}
          className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
            activeTab === "masak"
              ? "bg-blue-500/10 text-blue-700 border border-blue-500/20"
              : "text-[#2C241B]/55 border border-transparent"
          }`}
        >
          <ChefHat size={13} />
          <span>Masak</span>
          <span className="px-1.5 py-0.5 rounded-full text-[9px] bg-blue-500/15 text-blue-700 font-extrabold">
            {masakItems.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab("antar")}
          className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
            activeTab === "antar"
              ? "bg-emerald-500/10 text-emerald-700 border border-emerald-500/20"
              : "text-[#2C241B]/55 border border-transparent"
          }`}
        >
          <Send size={13} />
          <span>Antar</span>
          <span className="px-1.5 py-0.5 rounded-full text-[9px] bg-emerald-500/15 text-emerald-700 font-extrabold">
            {antarItems.length}
          </span>
        </button>
      </div>

      {/* Main Kanban Content */}
      <div className="flex-1 min-h-0 overflow-hidden relative">
        {derivedItems.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full">
            <p className="text-xl font-semibold mb-2" style={{ color: "#2C241B", fontFamily: "Playfair Display, serif" }}>Tidak ada pesanan</p>
            <p className="text-sm" style={{ color: "rgba(44,36,27,0.4)" }}>Dapur sedang tenang...</p>
          </div>
        ) : (
          <>
            {/* Desktop & Tablet: 3 columns layout */}
            <div className="hidden md:grid md:grid-cols-3 gap-5 p-5 h-full min-h-0 overflow-hidden">
              {/* Column 1: Antri */}
              <div className="flex flex-col h-full bg-[#F4F0EC]/40 border border-black/5 rounded-2xl min-h-0 overflow-hidden">
                <div className="p-4 border-b border-black/5 bg-white flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-xl bg-amber-500/10 flex items-center justify-center text-amber-600">
                      <Layers size={16} />
                    </div>
                    <span className="font-bold text-sm text-[#2C241B]">Antrean Dapur</span>
                  </div>
                  <span className="px-2.5 py-0.5 rounded-full text-xs bg-amber-500/10 text-amber-700 font-bold">
                    {antriItems.length} menu
                  </span>
                </div>
                <div className="flex-1 overflow-y-auto p-4 space-y-3">
                  <AnimatePresence mode="popLayout">
                    {antriItems.map((item) => renderItemCard(item))}
                  </AnimatePresence>
                  {antriItems.length === 0 && (
                    <div className="h-full flex items-center justify-center text-xs text-[#2C241B]/40 py-8">
                      Tidak ada antrean
                    </div>
                  )}
                </div>
              </div>

              {/* Column 2: Masak */}
              <div className="flex flex-col h-full bg-[#F4F0EC]/40 border border-black/5 rounded-2xl min-h-0 overflow-hidden">
                <div className="p-4 border-b border-black/5 bg-white flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-600">
                      <ChefHat size={16} />
                    </div>
                    <span className="font-bold text-sm text-[#2C241B]">Sedang Dimasak</span>
                  </div>
                  <span className="px-2.5 py-0.5 rounded-full text-xs bg-blue-500/10 text-blue-700 font-bold">
                    {masakItems.length} menu
                  </span>
                </div>
                <div className="flex-1 overflow-y-auto p-4 space-y-3">
                  <AnimatePresence mode="popLayout">
                    {masakItems.map((item) => renderItemCard(item))}
                  </AnimatePresence>
                  {masakItems.length === 0 && (
                    <div className="h-full flex items-center justify-center text-xs text-[#2C241B]/40 py-8">
                      Belum ada yang dimasak
                    </div>
                  )}
                </div>
              </div>

              {/* Column 3: Antar */}
              <div className="flex flex-col h-full bg-[#F4F0EC]/40 border border-black/5 rounded-2xl min-h-0 overflow-hidden">
                <div className="p-4 border-b border-black/5 bg-white flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-600">
                      <Send size={16} />
                    </div>
                    <span className="font-bold text-sm text-[#2C241B]">Siap Diantar</span>
                  </div>
                  <span className="px-2.5 py-0.5 rounded-full text-xs bg-emerald-500/10 text-emerald-700 font-bold">
                    {antarItems.length} menu
                  </span>
                </div>
                <div className="flex-1 overflow-y-auto p-4 space-y-3">
                  <AnimatePresence mode="popLayout">
                    {antarItems.map((item) => renderItemCard(item))}
                  </AnimatePresence>
                  {antarItems.length === 0 && (
                    <div className="h-full flex items-center justify-center text-xs text-[#2C241B]/40 py-8">
                      Belum ada yang siap antar
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Mobile (sm): single column tab content layout */}
            <div className="md:hidden h-full flex flex-col min-h-0 overflow-hidden">
              <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-[#F4F0EC]/20">
                <AnimatePresence mode="popLayout">
                  {activeTab === "antri" && (
                    <>
                      {antriItems.map((item) => renderItemCard(item))}
                      {antriItems.length === 0 && (
                        <div className="h-full flex flex-col items-center justify-center text-xs text-[#2C241B]/40 py-16">
                          Tidak ada antrean
                        </div>
                      )}
                    </>
                  )}
                  {activeTab === "masak" && (
                    <>
                      {masakItems.map((item) => renderItemCard(item))}
                      {masakItems.length === 0 && (
                        <div className="h-full flex flex-col items-center justify-center text-xs text-[#2C241B]/40 py-16">
                          Belum ada yang dimasak
                        </div>
                      )}
                    </>
                  )}
                  {activeTab === "antar" && (
                    <>
                      {antarItems.map((item) => renderItemCard(item))}
                      {antarItems.length === 0 && (
                        <div className="h-full flex flex-col items-center justify-center text-xs text-[#2C241B]/40 py-16">
                          Belum ada yang siap antar
                        </div>
                      )}
                    </>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

