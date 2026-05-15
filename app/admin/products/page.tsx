export const dynamic = "force-dynamic";
export const revalidate = 0;

// app/admin/products/page.tsx
import { db } from "@/db";
import { products, categories, kitchenStations } from "@/db/schema";
import { asc } from "drizzle-orm";
import ProductsClient from "@/components/admin/ProductsClient";

export default async function ProductsPage() {
  const [allProducts, allCategories, allStations] = await Promise.all([
    db.query.products.findMany({ orderBy: (p, { asc }) => [asc(p.sortOrder)], with: { category: true, station: true } }),
    db.select().from(categories).orderBy(asc(categories.sortOrder)),
    db.select().from(kitchenStations),
  ]);

  return (
    <ProductsClient
      products={allProducts.map((p) => ({
        id: p.id, name: p.name, description: p.description, price: String(p.price),
        imageUrl: p.imageUrl, isAvailable: p.isAvailable, categoryId: p.categoryId,
        stationId: p.stationId, categoryName: p.category.name, stationName: p.station.name,
      }))}
      categories={allCategories.map((c) => ({ id: c.id, name: c.name }))}
      stations={allStations.map((s) => ({ id: s.id, name: s.name, type: s.type }))}
    />
  );
}
