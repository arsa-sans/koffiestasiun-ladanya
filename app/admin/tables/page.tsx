export const dynamic = "force-dynamic";
export const revalidate = 0;

import { db } from "@/db";
import { diningTables } from "@/db/schema";
import { asc } from "drizzle-orm";
import TablesClient from "@/components/admin/TablesClient";

export default async function TablesPage() {
  const allTables = await db.select().from(diningTables).orderBy(asc(diningTables.code));

  return (
    <TablesClient
      tables={allTables.map((t) => ({
        id: t.id,
        code: t.code,
        name: t.name,
        capacity: t.capacity,
        status: t.status,
        isActive: t.isActive,
      }))}
    />
  );
}
