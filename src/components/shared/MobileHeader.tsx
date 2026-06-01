"use client";

import { Menu, Coffee } from "lucide-react";

interface MobileHeaderProps {
  title: string;
}

export default function MobileHeader({ title }: MobileHeaderProps) {
  const handleOpen = () => {
    window.dispatchEvent(new Event("open-sidebar"));
  };

  return (
    <header
      className="hide-on-desktop-tablet flex items-center justify-between px-4 py-3 border-b sticky top-0 z-30"
      style={{
        background: "rgba(248, 245, 242, 0.96)",
        borderColor: "rgba(0, 0, 0, 0.05)",
        backdropFilter: "blur(8px)",
      }}
    >
      <div className="flex items-center gap-2">
        <button
          onClick={handleOpen}
          className="w-10 h-10 rounded-xl flex items-center justify-center hover:bg-black/5 active:scale-95 transition-all text-[#2C241B]"
          title="Buka Menu"
        >
          <Menu size={20} />
        </button>
        <span
          className="text-sm font-bold tracking-tight uppercase"
          style={{ fontFamily: "Playfair Display, serif", color: "#C08B5C" }}
        >
          {title}
        </span>
      </div>
      <div
        className="w-8 h-8 rounded-lg flex items-center justify-center"
        style={{ background: "rgba(192,139,92,0.12)" }}
      >
        <Coffee size={16} color="#C08B5C" />
      </div>
    </header>
  );
}
