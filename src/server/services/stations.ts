// src/server/services/stations.ts
"use server";

import { db } from "@/db";
import { kitchenStations } from "@/db/schema";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

export async function createStation(data: {
  name: string;
  type: "bar" | "kitchen" | "sushi";
  description?: string;
}) {
  const [created] = await db
    .insert(kitchenStations)
    .values({
      name: data.name,
      type: data.type,
      description: data.description || null,
    })
    .returning();

  revalidatePath("/admin/stations");
  return { success: true, data: created };
}

export async function updateStation(
  id: string,
  data: {
    name?: string;
    type?: "bar" | "kitchen" | "sushi";
    description?: string;
    isActive?: boolean;
  }
) {
  const [updated] = await db
    .update(kitchenStations)
    .set({
      ...data,
      updatedAt: new Date(),
    })
    .where(eq(kitchenStations.id, id))
    .returning();

  revalidatePath("/admin/stations");
  return { success: true, data: updated };
}

export async function deleteStation(id: string) {
  await db.delete(kitchenStations).where(eq(kitchenStations.id, id));
  revalidatePath("/admin/stations");
  return { success: true };
}
