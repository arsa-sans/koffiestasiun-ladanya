export const dynamic = "force-dynamic";
export const revalidate = 0;

// app/cashier/page.tsx
import { getCategories, getProducts } from "@/server/queries/products";
import { db } from "@/db";
import { diningTables } from "@/db/schema";
import { eq, asc } from "drizzle-orm";
import CashierClient from "@/components/cashier/CashierClient";

export default async function CashierPage() {
  const [categories, products, tables] = await Promise.all([
    getCategories(),
    getProducts(),
    db.select({ id: diningTables.id, code: diningTables.code, name: diningTables.name })
      .from(diningTables)
      .where(eq(diningTables.isActive, true))
      .orderBy(asc(diningTables.code)),
  ]);

  return (
    <CashierClient
      categories={categories}
      products={products.map((p) => ({
        ...p,
        price: String(p.price),
        description: p.description ?? null,
        imageUrl: p.imageUrl ?? null,
      }))}
      tables={tables}
    />
  );
}
