// app/cashier/layout.tsx
import { Metadata } from "next";
import Sidebar from "@/components/shared/Sidebar";

export const metadata: Metadata = {
  title: "Kasir",
};

export default function CashierLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex h-screen overflow-hidden" style={{ background: "#F8F5F2" }}>
      <Sidebar role="cashier" />
      <main className="flex-1 overflow-hidden">{children}</main>
    </div>
  );
}
