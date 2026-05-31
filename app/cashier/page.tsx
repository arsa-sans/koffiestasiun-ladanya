export const dynamic = "force-dynamic";
export const revalidate = 0;

// app/cashier/page.tsx
import { getCategories, getProducts } from "@/server/queries/products";
import { db } from "@/db";
import { diningTables, ingredients } from "@/db/schema";
import { eq, asc } from "drizzle-orm";
import CashierClient from "@/components/cashier/CashierClient";

export default async function CashierPage() {
  const [categories, productsData, tables, ingredientsData] = await Promise.all([
    getCategories(),
    db.query.products.findMany({
      where: (p, { eq }) => eq(p.isAvailable, true),
      orderBy: (p, { asc }) => [asc(p.sortOrder)],
      with: { 
        station: true,
        recipes: {
          with: { ingredient: true },
        },
      },
    }),
    db.select({ id: diningTables.id, code: diningTables.code, name: diningTables.name })
      .from(diningTables)
      .where(eq(diningTables.isActive, true))
      .orderBy(asc(diningTables.code)),
    db.select({ id: ingredients.id, stock: ingredients.stock })
      .from(ingredients)
      .where(eq(ingredients.isActive, true)),
  ]);

  const initialIngredients = ingredientsData.reduce((acc, ing) => {
    acc[ing.id] = parseFloat(ing.stock) || 0;
    return acc;
  }, {} as Record<string, number>);

  return (
    <CashierClient
      categories={categories}
      initialIngredients={initialIngredients}
      products={productsData.map((p) => {
        return {
          id: p.id,
          name: p.name,
          price: String(p.price),
          description: p.description ?? null,
          imageUrl: p.imageUrl ?? null,
          isAvailable: p.isAvailable,
          categoryId: p.categoryId,
          stationId: p.stationId,
          stationName: p.station?.name ?? null,
          stationType: p.station?.type ?? null,
          recipes: p.recipes?.map((r) => ({
            ingredientId: r.ingredientId,
            quantity: parseFloat(r.quantity) || 1,
          })) || [],
        };
      })}
      tables={tables}
    />
  );
}
