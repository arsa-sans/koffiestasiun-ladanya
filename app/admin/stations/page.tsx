export const dynamic = "force-dynamic";
export const revalidate = 0;

import { db } from "@/db";
import { kitchenStations, products } from "@/db/schema";
import { sql } from "drizzle-orm";
import StationsClient from "@/components/admin/StationsClient";

export default async function StationsPage() {
  const allStations = await db.select().from(kitchenStations);

  const productCounts = await db
    .select({ stationId: products.stationId, count: sql<number>`COUNT(*)` })
    .from(products)
    .groupBy(products.stationId);

  const countMap = Object.fromEntries(productCounts.map((pc) => [pc.stationId, Number(pc.count)]));

  return (
    <StationsClient
      stations={allStations.map((s) => ({
        id: s.id,
        name: s.name,
        type: s.type,
        description: s.description,
        isActive: s.isActive,
        productCount: countMap[s.id] || 0,
      }))}
    />
  );
}
