"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  Coffee,
  ChefHat,
  LayoutDashboard,
  Package,
  ClipboardList,
  BarChart3,
  Users,
  UtensilsCrossed,
  TableProperties,
  FlaskConical,
  Settings,
  LogOut,
  Sliders,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";

interface NavItem {
  href: string;
  icon: React.ReactNode;
  label: string;
  section?: string;
}

interface SidebarProps {
  role: "cashier" | "kitchen" | "admin";
}

const cashierNav: NavItem[] = [
  { href: "/cashier", icon: <Coffee size={20} />, label: "Kasir" },
  { href: "/cashier/history", icon: <ClipboardList size={20} />, label: "Riwayat Order" },
];

const kitchenNav: NavItem[] = [
  { href: "/kitchen", icon: <ChefHat size={20} />, label: "Kitchen Display" },
];

const adminNav: NavItem[] = [
  { href: "/admin", icon: <LayoutDashboard size={20} />, label: "Overview", section: "Dashboard" },
  { href: "/admin/reports", icon: <BarChart3 size={20} />, label: "Laporan" },
  { href: "/admin/products", icon: <Coffee size={20} />, label: "Produk", section: "Katalog" },
  { href: "/admin/categories", icon: <UtensilsCrossed size={20} />, label: "Kategori" },
  { href: "/admin/recipes", icon: <FlaskConical size={20} />, label: "Resep" },
  { href: "/admin/modifiers", icon: <Sliders size={20} />, label: "Modifier" },
  { href: "/admin/inventory", icon: <Package size={20} />, label: "Inventaris", section: "Stok" },
  { href: "/admin/stock-opname", icon: <ClipboardList size={20} />, label: "Stock Opname" },
  { href: "/admin/tables", icon: <TableProperties size={20} />, label: "Meja", section: "Operasional" },
  { href: "/admin/stations", icon: <ChefHat size={20} />, label: "Stasiun Dapur" },
  { href: "/admin/users", icon: <Users size={20} />, label: "Pengguna" },
];

const navMap = {
  cashier: cashierNav,
  kitchen: kitchenNav,
  admin: adminNav,
};

const roleLabels = {
  cashier: "Kasir",
  kitchen: "Dapur",
  admin: "Admin",
};

const roleSwitcher = [
  { href: "/cashier", icon: <Coffee size={16} />, label: "Kasir" },
  { href: "/kitchen", icon: <ChefHat size={16} />, label: "Dapur" },
  { href: "/admin", icon: <Settings size={16} />, label: "Admin" },
];

export default function Sidebar({ role }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const navItems = navMap[role];

  const handleLogout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    toast.success("Berhasil keluar");
    router.push("/login");
    router.refresh();
  };

  let lastSection = "";

  return (
    <aside
      className="sidebar flex flex-col h-full w-64 flex-shrink-0"
      style={{ minHeight: "100vh" }}
    >
      {/* Logo */}
      <div className="px-5 py-6 border-b" style={{ borderColor: "rgba(255,255,255,0.06)" }}>
        <div className="flex items-center gap-3">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
            style={{ background: "rgba(192,139,92,0.15)", border: "1px solid rgba(192,139,92,0.25)" }}
          >
            <Coffee size={20} color="#C08B5C" />
          </div>
          <div>
            <div
              className="text-sm font-bold leading-tight"
              style={{ fontFamily: "Playfair Display, serif", color: "#C08B5C" }}
            >
              Koffie Station
            </div>
            <div className="text-xs" style={{ color: "rgba(216,198,181,0.4)", fontFamily: "Noto Serif JP, serif" }}>
              × Ladanya
            </div>
          </div>
        </div>
      </div>

      {/* Role Switcher */}
      <div className="px-4 py-3 border-b" style={{ borderColor: "rgba(255,255,255,0.04)" }}>
        <div
          className="flex rounded-xl overflow-hidden"
          style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}
        >
          {roleSwitcher.map((r) => {
            const isActive = pathname.startsWith(r.href);
            return (
              <Link
                key={r.href}
                href={r.href}
                className="flex-1 flex flex-col items-center gap-1 py-2 transition-all text-xs"
                style={{
                  color: isActive ? "#C08B5C" : "rgba(216,198,181,0.4)",
                  background: isActive ? "rgba(192,139,92,0.12)" : "transparent",
                }}
              >
                {r.icon}
                <span>{r.label}</span>
              </Link>
            );
          })}
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
        {navItems.map((item) => {
          const isActive =
            item.href === `/${role}`
              ? pathname === item.href
              : pathname.startsWith(item.href);

          const showSection = item.section && item.section !== lastSection;
          if (item.section) lastSection = item.section;

          return (
            <div key={item.href}>
              {showSection && (
                <p
                  className="text-xs font-semibold uppercase tracking-wider px-3 pt-4 pb-1"
                  style={{ color: "rgba(216,198,181,0.3)" }}
                >
                  {item.section}
                </p>
              )}
              <Link href={item.href}>
                <motion.div
                  whileTap={{ scale: 0.97 }}
                  className="flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all relative"
                  style={{
                    background: isActive
                      ? "rgba(192,139,92,0.12)"
                      : "transparent",
                    color: isActive ? "#C08B5C" : "rgba(216,198,181,0.6)",
                  }}
                >
                  {isActive && (
                    <motion.div
                      layoutId="activeNav"
                      className="absolute inset-0 rounded-xl"
                      style={{
                        background: "rgba(192,139,92,0.1)",
                        border: "1px solid rgba(192,139,92,0.2)",
                      }}
                    />
                  )}
                  <span className="relative z-10">{item.icon}</span>
                  <span className="relative z-10 text-sm font-medium">
                    {item.label}
                  </span>
                  {isActive && (
                    <div
                      className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-5 rounded-r-full"
                      style={{ background: "#C08B5C" }}
                    />
                  )}
                </motion.div>
              </Link>
            </div>
          );
        })}
      </nav>

      {/* User / Logout */}
      <div className="px-3 pb-4 border-t pt-3" style={{ borderColor: "rgba(255,255,255,0.06)" }}>
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 w-full px-3 py-2.5 rounded-xl transition-all"
          style={{ color: "rgba(216,198,181,0.5)" }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLElement).style.color = "#f87171";
            (e.currentTarget as HTMLElement).style.background = "rgba(239,68,68,0.08)";
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLElement).style.color = "rgba(216,198,181,0.5)";
            (e.currentTarget as HTMLElement).style.background = "transparent";
          }}
        >
          <LogOut size={18} />
          <span className="text-sm font-medium">Keluar</span>
        </button>
      </div>
    </aside>
  );
}
