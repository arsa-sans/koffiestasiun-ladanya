export const dynamic = "force-dynamic";
export const revalidate = 0;

// app/cashier/history/page.tsx
import { getOrderHistory } from "@/server/queries/orders";
import HistoryClient from "./HistoryClient";
import { createClient } from "@/lib/supabase/server";

export default async function CashierHistoryPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const orders = await getOrderHistory(50);

  return (
    <div className="p-6 space-y-6" style={{ height: "100vh", overflowY: "auto" }}>
      <h1 className="text-2xl font-bold" style={{ color: "#2C241B", fontFamily: "Playfair Display, serif" }}>
        Riwayat Order
      </h1>

      <HistoryClient orders={orders} userId={user?.id} />
    </div>
  );
}
