// app/api/products/[id]/modifiers/route.ts
import { db } from "@/db";
import { products, productModifierGroups, modifierGroups, modifierOptions } from "@/db/schema";
import { eq, asc } from "drizzle-orm";
import { NextResponse } from "next/server";

export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const groups = await db
    .select({
      groupId: modifierGroups.id,
      groupName: modifierGroups.name,
      isRequired: modifierGroups.isRequired,
      isMultiple: modifierGroups.isMultiple,
      minSelect: modifierGroups.minSelect,
      maxSelect: modifierGroups.maxSelect,
      sortOrder: productModifierGroups.sortOrder,
    })
    .from(productModifierGroups)
    .innerJoin(modifierGroups, eq(productModifierGroups.modifierGroupId, modifierGroups.id))
    .where(eq(productModifierGroups.productId, id))
    .orderBy(asc(productModifierGroups.sortOrder));

  const result = await Promise.all(
    groups.map(async (g) => {
      const options = await db
        .select()
        .from(modifierOptions)
        .where(eq(modifierOptions.groupId, g.groupId))
        .orderBy(asc(modifierOptions.sortOrder));
      return {
        id: g.groupId,
        name: g.groupName,
        isRequired: g.isRequired,
        isMultiple: g.isMultiple,
        minSelect: g.minSelect,
        maxSelect: g.maxSelect,
        options: options.map((o) => ({ id: o.id, name: o.name, price: String(o.price) })),
      };
    })
  );

  return NextResponse.json({ modifierGroups: result });
}
