export const dynamic = "force-dynamic";
export const revalidate = 0;

// app/admin/fees/page.tsx
import { getAllFees } from "@/server/services/fees";
import FeesClient from "@/components/admin/FeesClient";

export default async function FeesPage() {
  const fees = await getAllFees();

  return (
    <FeesClient
      fees={fees.map((f) => ({
        ...f,
        value: String(f.value),
        createdAt: f.createdAt.toISOString(),
      }))}
    />
  );
}
