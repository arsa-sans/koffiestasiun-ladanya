// app/api/products/[id]/recipe/route.ts
import { db } from "@/db";
import { products, recipes, ingredients } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const product = await db.query.products.findFirst({
    where: eq(products.id, id),
    with: {
      recipes: {
        with: {
          ingredient: true,
        },
      },
    },
  });

  if (!product) {
    return Response.json({ error: "Product not found" }, { status: 404 });
  }

  const recipeData = product.recipes.map((r) => {
    const stock = parseFloat(String(r.ingredient.stock));
    const minStock = parseFloat(String(r.ingredient.minStock));
    const requiredQty = parseFloat(String(r.quantity));

    // Calculate how many servings can be made
    const servingsAvailable = requiredQty > 0 ? Math.floor(stock / requiredQty) : Infinity;

    // Stock status
    let stockStatus: "safe" | "low" | "critical" = "safe";
    if (stock <= minStock * 0.5) {
      stockStatus = "critical";
    } else if (stock <= minStock * 1.2) {
      stockStatus = "low";
    }

    return {
      ingredientId: r.ingredient.id,
      ingredientName: r.ingredient.name,
      unit: r.ingredient.unit,
      requiredQty: String(r.quantity),
      currentStock: String(r.ingredient.stock),
      minStock: String(r.ingredient.minStock),
      stockStatus,
      servingsAvailable,
    };
  });

  return Response.json({
    id: product.id,
    name: product.name,
    description: product.description,
    price: String(product.price),
    recipes: recipeData,
  });
}
