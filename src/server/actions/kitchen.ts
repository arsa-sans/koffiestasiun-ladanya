// src/server/actions/kitchen.ts
"use server";

import { db } from "@/db";
import { orderItems } from "@/db/schema";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

const ITEM_STATUS_FLOW = [
  "pending",
  "queued",
  "cooking",
  "ready",
  "delivered",
] as const;

type ItemStatus = (typeof ITEM_STATUS_FLOW)[number] | "canceled" | "void";

export async function updateItemStatus(itemId: string, status: ItemStatus) {
  await db
    .update(orderItems)
    .set({ status, updatedAt: new Date() })
    .where(eq(orderItems.id, itemId));

  revalidatePath("/kitchen");
  revalidatePath("/cashier");

  return { success: true };
}

export async function advanceItemStatus(itemId: string, currentStatus: string) {
  const currentIndex = ITEM_STATUS_FLOW.indexOf(
    currentStatus as (typeof ITEM_STATUS_FLOW)[number]
  );
  if (currentIndex === -1 || currentIndex >= ITEM_STATUS_FLOW.length - 1) {
    return { success: false, message: "Cannot advance status" };
  }

  const nextStatus = ITEM_STATUS_FLOW[currentIndex + 1];
  return updateItemStatus(itemId, nextStatus);
}
