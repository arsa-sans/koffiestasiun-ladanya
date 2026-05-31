"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Coffee, ChefHat, LayoutDashboard, Package, ClipboardList, BarChart3 } from "lucide-react";
import { motion } from "framer-motion";

interface BottomNavProps {
  role: "cashier" | "kitchen" | "admin";
}

const cashierNav = [
  { href: "/cashier", icon: <Coffee size={20} />, label: "Kasir" },
  { href: "/cashier/history", icon: <ClipboardList size={20} />, label: "Riwayat" },
];

const kitchenNav = [
  { href: "/kitchen", icon: <ChefHat size={20} />, label: "Dapur" },
  { href: "/kitchen/inventory", icon: <Package size={20} />, label: "Bahan Baku" },
];

const adminNav = [
  { href: "/admin", icon: <LayoutDashboard size={20} />, label: "Beranda" },
  { href: "/admin/products", icon: <Coffee size={20} />, label: "Menu" },
  { href: "/admin/inventory", icon: <Package size={20} />, label: "Stok" },
  { href: "/admin/reports", icon: <BarChart3 size={20} />, label: "Laporan" },
];

export default function BottomNav({ role }: BottomNavProps) {
  const pathname = usePathname();
  let navItems = cashierNav;
  
  if (role === "admin") navItems = adminNav;
  if (role === "kitchen") navItems = kitchenNav;

  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-black/5 pb-safe pt-1 z-[100] px-2 shadow-[0_-4px_12px_rgba(0,0,0,0.03)]">
      <div className="flex justify-around items-center h-14">
        {navItems.map((item) => {
          const isActive =
            item.href === `/${role}`
              ? pathname === item.href
              : pathname.startsWith(item.href);

          return (
            <Link
              key={item.href}
              href={item.href}
              className="flex flex-col items-center justify-center w-full h-full relative"
              style={{ color: isActive ? "#C08B5C" : "rgba(44,36,27,0.5)" }}
            >
              <motion.div
                whileTap={{ scale: 0.9 }}
                className="flex flex-col items-center justify-center p-1"
              >
                {item.icon}
                <span className="text-[10px] mt-1 font-medium">{item.label}</span>
              </motion.div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
