export const dynamic = "force-dynamic";
export const revalidate = 0;

// app/admin/products/page.tsx
import { db } from "@/db";
import { products, categories, kitchenStations, ingredients, modifierGroups } from "@/db/schema";
import { eq, asc } from "drizzle-orm";
import ProductsClient from "@/components/admin/ProductsClient";

export default async function ProductsPage() {
  const [allProducts, allCategories, allStations, allIngredients, allModifierGroups] = await Promise.all([
    db.query.products.findMany({
      orderBy: (p, { asc }) => [asc(p.sortOrder)],
      with: {
        category: true,
        station: true,
        recipes: true,
        productModifierGroups: true,
      },
    }),
    db.select().from(categories).orderBy(asc(categories.sortOrder)),
    db.select().from(kitchenStations),
    db.select().from(ingredients).where(eq(ingredients.isActive, true)).orderBy(asc(ingredients.name)),
    db.select().from(modifierGroups).where(eq(modifierGroups.isActive, true)).orderBy(asc(modifierGroups.sortOrder)),
  ]);

  return (
    <ProductsClient
      products={allProducts.map((p) => ({
        id: p.id,
        name: p.name,
        description: p.description,
        price: String(p.price),
        imageUrl: p.imageUrl,
        isAvailable: p.isAvailable,
        categoryId: p.categoryId,
        stationId: p.stationId,
        categoryName: p.category.name,
        stationName: p.station.name,
        stationType: p.station.type,
        recipes: p.recipes.map((r) => ({
          ingredientId: r.ingredientId,
          quantity: String(r.quantity),
        })),
        modifierGroupIds: p.productModifierGroups.map((pmg) => pmg.modifierGroupId),
      }))}
      categories={allCategories.map((c) => ({ id: c.id, name: c.name }))}
      stations={allStations.map((s) => ({ id: s.id, name: s.name, type: s.type }))}
      ingredients={allIngredients.map((i) => ({ id: i.id, name: i.name, unit: i.unit }))}
      modifierGroups={allModifierGroups.map((m) => ({ id: m.id, name: m.name }))}
    />
  );
}
