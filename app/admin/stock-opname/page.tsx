export const dynamic = "force-dynamic";
export const revalidate = 0;

// app/admin/stock-opname/page.tsx
import { db } from "@/db";
import { stockOpnames, ingredients } from "@/db/schema";
import { desc, asc } from "drizzle-orm";
import StockOpnameClient from "@/components/admin/StockOpnameClient";

export default async function StockOpnamePage() {
  const [opnames, allIngredients] = await Promise.all([
    db.query.stockOpnames.findMany({
      orderBy: (o, { desc }) => [desc(o.createdAt)],
      with: { performedBy: true, items: { with: { ingredient: true } } },
    }),
    db.select().from(ingredients).orderBy(asc(ingredients.name)),
  ]);

  return (
    <StockOpnameClient
      opnames={opnames.map((o) => ({
        id: o.id, code: o.code, status: o.status, notes: o.notes,
        createdAt: o.createdAt.toISOString(),
        performedBy: o.performedBy?.name || null,
        itemCount: o.items.length,
      }))}
      ingredients={allIngredients.map((i) => ({
        id: i.id, name: i.name, unit: i.unit, stock: String(i.stock),
      }))}
    />
  );
}
