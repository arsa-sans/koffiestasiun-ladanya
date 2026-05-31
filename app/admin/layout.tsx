// app/admin/layout.tsx
import { Metadata } from "next";
import Sidebar from "@/components/shared/Sidebar";
import BottomNav from "@/components/shared/BottomNav";

export const metadata: Metadata = {
  title: "Admin",
};

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex h-screen overflow-hidden" style={{ background: "#F8F5F2" }}>
      <Sidebar role="admin" />
      <main className="flex-1 overflow-y-auto pb-14 md:pb-0">{children}</main>
      <BottomNav role="admin" />
    </div>
  );
}
