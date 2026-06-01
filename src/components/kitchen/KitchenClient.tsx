"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Clock, ChevronRight, Maximize2, Minimize2 } from "lucide-react";
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

  // Filter items by station
  const filteredOrders = orders
    .map((order) => ({
      ...order,
      items: order.items.filter((item) => {
        if (item.status === "delivered" || item.status === "canceled" || item.status === "void") return false;
        if (station !== "all") return item.product.station.type === station;
        return true;
      }),
    }))
    .filter((order) => order.items.length > 0);

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

  const getNextLabel = (status: string) => {
    const map: Record<string, string> = { pending: "Antri", queued: "Masak", cooking: "Siap", ready: "Selesai" };
    return map[status] || "→";
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
                className="px-4 py-2 rounded-xl text-sm font-medium transition-all"
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
          <span className="text-xs font-medium px-3 py-1 rounded-full" style={{ background: "rgba(16,185,129,0.1)", color: "#10B981" }}>
            {filteredOrders.length} order aktif
          </span>
          <div className="flex items-center gap-1.5 text-sm" style={{ color: "rgba(44,36,27,0.5)" }}>
            <Clock size={14} />
            {now.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })}
          </div>
          <button onClick={() => setFullscreen(!fullscreen)} className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: "rgba(0,0,0,0.06)" }}>
            {fullscreen ? <Minimize2 size={16} color="#2C241B" /> : <Maximize2 size={16} color="#2C241B" />}
          </button>
        </div>
      </div>

      {/* Order Queue */}
      <div className="flex-1 overflow-y-auto p-5">
        {filteredOrders.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full">
            <p className="text-xl font-semibold mb-2" style={{ color: "#2C241B", fontFamily: "Playfair Display, serif" }}>Tidak ada pesanan</p>
            <p className="text-sm" style={{ color: "rgba(44,36,27,0.4)" }}>Dapur sedang tenang...</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4 gap-4" style={{ alignItems: "start" }}>
            <AnimatePresence>
              {filteredOrders.map((order) => {
                const elapsedMins = getElapsedMins(order.createdAt);
                const elapsedFormatted = getElapsedFormatted(order.createdAt);
                const primaryStatus = order.items[0]?.status || "pending";
                const statusBarColor = primaryStatus === "cooking" ? "#3B82F6"
                  : primaryStatus === "ready" ? "#10B981"
                  : primaryStatus === "queued" ? "#D97706"
                  : "#F59E0B";
                const isTakeaway = !order.table;

                return (
                  <motion.div
                    key={order.id}
                    initial={false}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    layout
                    className="rounded-2xl overflow-hidden"
                    style={{ background: "#FFFFFF", border: "1px solid rgba(0,0,0,0.06)", boxShadow: "0 2px 12px rgba(0,0,0,0.04)" }}
                  >
                    {/* Color Bar Top */}
                    <div style={{ height: 4, background: statusBarColor }} />

                    {/* Card Header */}
                    <div className="px-4 py-3 flex items-center justify-between">
                      <div>
                        <p className="text-sm font-bold" style={{ color: "#2C241B" }}>{order.orderNumber}</p>
                        {isTakeaway
                          ? <span className="text-[11px] px-2 py-0.5 rounded-full font-semibold inline-block mt-0.5" style={{ background: "rgba(139,92,246,0.1)", color: "#8B5CF6" }}>📦 Takeaway</span>
                          : <p className="text-xs" style={{ color: "rgba(44,36,27,0.45)" }}>Meja {order.table!.code}</p>
                        }
                      </div>
                      <div className="flex items-center gap-1.5 px-2 py-1 rounded-lg" style={{ background: `${elapsedColor(elapsedMins)}12` }}>
                        <Clock size={11} color={elapsedColor(elapsedMins)} />
                        <span className="text-xs font-bold font-mono" style={{ color: elapsedColor(elapsedMins) }}>{elapsedFormatted}</span>
                      </div>
                    </div>

                    {/* Divider */}
                    <div style={{ height: 1, background: "rgba(0,0,0,0.04)", margin: "0 16px" }} />

                    {/* Card Items */}
                    <div className="p-3 space-y-2">
                      {order.items.map((item) => {
                        const statusColor = STATUS_COLORS[item.status] || "#C08B5C";
                        return (
                          <div key={item.id} className="rounded-xl p-3" style={{ background: "#F8F5F2" }}>
                            <div className="flex items-start justify-between gap-2 mb-2">
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-semibold" style={{ color: "#2C241B" }}>
                                  <span className="font-bold" style={{ color: "#C08B5C" }}>{item.quantity}×</span>{" "}
                                  {item.product.name}
                                </p>
                                {item.modifiers.length > 0 && (
                                  <p className="text-[11px] mt-0.5" style={{ color: "rgba(192,139,92,0.7)" }}>
                                    + {item.modifiers.map((m) => m.name).join(", ")}
                                  </p>
                                )}
                                {item.notes && (
                                  <p className="text-[11px] italic mt-0.5" style={{ color: "rgba(44,36,27,0.4)" }}>📝 {item.notes}</p>
                                )}
                              </div>
                              <span className="text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider flex-shrink-0"
                                style={{ background: `${statusColor}15`, color: statusColor }}>
                                {item.status}
                              </span>
                            </div>

                            {/* Cooking duration */}
                            {item.startedAt && (
                              <div className="text-[11px] flex items-center gap-1 mb-2" style={{ color: "rgba(44,36,27,0.45)" }}>
                                <Clock size={10} />
                                {item.completedAt ? (
                                  <span>Selesai dalam {getElapsedFormatted(item.startedAt)}</span>
                                ) : (
                                  <span className="font-mono">Memasak {getElapsedFormatted(item.startedAt)}</span>
                                )}
                              </div>
                            )}

                            {item.status !== "delivered" && (
                              <motion.button
                                whileTap={{ scale: 0.96 }}
                                onClick={() => handleAdvance(item.id, item.status)}
                                className="w-full py-2.5 rounded-lg text-sm font-bold flex items-center justify-center gap-1.5"
                                style={{
                                  background: item.status === "ready" ? "rgba(139,92,246,0.12)" : `${statusColor}12`,
                                  color: item.status === "ready" ? "#8B5CF6" : statusColor,
                                  border: item.status === "ready" ? "1px solid rgba(139,92,246,0.25)" : `1px solid ${statusColor}25`,
                                }}>
                                {item.status === "ready" ? "✓ Selesai Diantar" : getNextLabel(item.status)}
                                {item.status !== "ready" && <ChevronRight size={14} />}
                              </motion.button>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        )}
      </div>
    </div>
  );
}
