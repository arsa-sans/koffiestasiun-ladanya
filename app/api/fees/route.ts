// app/api/fees/route.ts
import { getActiveFees } from "@/server/services/fees";

export const dynamic = "force-dynamic";

export async function GET() {
  const fees = await getActiveFees();

  return Response.json({
    fees: fees.map((f) => ({
      id: f.id,
      name: f.name,
      type: f.type,
      value: String(f.value),
    })),
  });
}
