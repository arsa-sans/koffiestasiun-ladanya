// app/kitchen/layout.tsx
import { Metadata } from "next";
import Sidebar from "@/components/shared/Sidebar";
import BottomNav from "@/components/shared/BottomNav";

export const metadata: Metadata = {
  title: "Kitchen Display",
};

export default function KitchenLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex h-screen overflow-hidden" style={{ background: "#F8F5F2" }}>
      <Sidebar role="kitchen" />
      <main className="flex-1 overflow-hidden pb-14 md:pb-0">{children}</main>
      <BottomNav role="kitchen" />
    </div>
  );
}
