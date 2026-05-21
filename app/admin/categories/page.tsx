export const dynamic = "force-dynamic";
export const revalidate = 0;

import { db } from "@/db";
import { categories, products } from "@/db/schema";
import { asc, eq, sql } from "drizzle-orm";
import CategoriesClient from "@/components/admin/CategoriesClient";

export default async function CategoriesPage() {
  const allCategories = await db.select().from(categories).orderBy(asc(categories.sortOrder));

  // Count products per category
  const productCounts = await db
    .select({ categoryId: products.categoryId, count: sql<number>`COUNT(*)` })
    .from(products)
    .groupBy(products.categoryId);

  const countMap = Object.fromEntries(productCounts.map((pc) => [pc.categoryId, Number(pc.count)]));

  return (
    <CategoriesClient
      categories={allCategories.map((c) => ({
        id: c.id,
        name: c.name,
        slug: c.slug,
        description: c.description,
        sortOrder: c.sortOrder,
        isActive: c.isActive,
        productCount: countMap[c.id] || 0,
      }))}
    />
  );
}
