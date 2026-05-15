// app/admin/layout.tsx
import { Metadata } from "next";
import Sidebar from "@/components/shared/Sidebar";

export const metadata: Metadata = {
  title: "Admin",
};

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex h-screen overflow-hidden" style={{ background: "#111111" }}>
      <Sidebar role="admin" />
      <main className="flex-1 overflow-y-auto">{children}</main>
    </div>
  );
}
