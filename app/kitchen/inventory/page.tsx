export const dynamic = "force-dynamic";
export const revalidate = 0;

// app/kitchen/inventory/page.tsx
import { db } from "@/db";
import { ingredients } from "@/db/schema";
import { eq, asc } from "drizzle-orm";
import KitchenInventoryClient from "@/components/kitchen/KitchenInventoryClient";

export default async function KitchenInventoryPage() {
  const allIngredients = await db
    .select()
    .from(ingredients)
    .where(eq(ingredients.isActive, true))
    .orderBy(asc(ingredients.name));

  return (
    <KitchenInventoryClient
      ingredients={allIngredients.map((i) => ({
        id: i.id,
        name: i.name,
        unit: i.unit,
        stock: String(i.stock),
        minStock: String(i.minStock),
        costPerUnit: String(i.costPerUnit),
        supplier: i.supplier || "",
        isActive: i.isActive,
        isLow:
          parseFloat(String(i.stock)) <=
          parseFloat(String(i.minStock)) * 1.2,
      }))}
    />
  );
}
