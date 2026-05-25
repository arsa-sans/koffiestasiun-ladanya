export const dynamic = "force-dynamic";
export const revalidate = 0;

import { db } from "@/db";
import { modifierGroups, modifierOptions } from "@/db/schema";
import { asc } from "drizzle-orm";
import ModifiersClient from "@/components/admin/ModifiersClient";

export default async function ModifiersPage() {
  const allGroups = await db.query.modifierGroups.findMany({
    orderBy: asc(modifierGroups.sortOrder),
    with: {
      options: {
        orderBy: asc(modifierOptions.sortOrder),
      },
    },
  });

  return (
    <ModifiersClient
      groups={allGroups.map((g) => ({
        id: g.id,
        name: g.name,
        description: g.description,
        isRequired: g.isRequired,
        isMultiple: g.isMultiple,
        minSelect: g.minSelect,
        maxSelect: g.maxSelect,
        sortOrder: g.sortOrder,
        isActive: g.isActive,
        options: g.options.map((o) => ({
          id: o.id,
          groupId: o.groupId,
          name: o.name,
          price: String(o.price),
          sortOrder: o.sortOrder,
          isActive: o.isActive,
        })),
      }))}
    />
  );
}
