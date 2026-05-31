export const dynamic = "force-dynamic";
export const revalidate = 0;

// app/admin/inventory/page.tsx
import { db } from "@/db";
import { ingredients, inventoryTransactions } from "@/db/schema";
import { eq, desc, asc, sql } from "drizzle-orm";
import InventoryClient from "@/components/admin/InventoryClient";

export default async function InventoryPage() {
  const allIngredients = await db.select().from(ingredients).orderBy(asc(ingredients.name));
  const recentTx = await db.query.inventoryTransactions.findMany({
    orderBy: (t, { desc }) => [desc(t.createdAt)],
    limit: 30,
    with: { ingredient: true, performedBy: true },
  });

  return (
    <InventoryClient
      ingredients={allIngredients.map((i) => ({
        id: i.id,
        name: i.name,
        unit: i.unit,
        stock: String(i.stock),
        minStock: String(i.minStock),
        costPerUnit: String(i.costPerUnit),
        supplier: i.supplier || "",
        isActive: i.isActive,
        isLow: parseFloat(String(i.stock)) <= parseFloat(String(i.minStock)) * 1.2,
      }))}
      transactions={recentTx.map((t) => ({
        id: t.id,
        ingredientName: t.ingredient.name,
        unit: t.ingredient.unit,
        type: t.type,
        quantity: String(t.quantity),
        stockBefore: String(t.stockBefore),
        stockAfter: String(t.stockAfter),
        note: t.note,
        performedBy: t.performedBy?.name || null,
        createdAt: t.createdAt.toISOString(),
      }))}
    />
  );
}
