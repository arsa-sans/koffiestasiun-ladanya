// src/server/actions/kitchen.ts
"use server";

import { db } from "@/db";
import { orderItems } from "@/db/schema";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { logActivity } from "@/server/services/activity-log";

const ITEM_STATUS_FLOW = [
  "pending",
  "queued",
  "cooking",
  "ready",
  "delivered",
] as const;

import { deductInventoryForItem } from "@/server/services/inventory-deduction";

type ItemStatus = (typeof ITEM_STATUS_FLOW)[number] | "canceled" | "void";

export async function updateItemStatus(itemId: string, status: ItemStatus) {
  const updateData: Record<string, unknown> = {
    status,
    updatedAt: new Date(),
  };

  // Track cooking duration timestamps
  if (status === "cooking") {
    updateData.startedAt = new Date();
  } else if (status === "ready") {
    updateData.completedAt = new Date();
  }

  await db
    .update(orderItems)
    .set(updateData)
    .where(eq(orderItems.id, itemId));

  revalidatePath("/kitchen");
  revalidatePath("/cashier");

  if (status === "cooking") {
    await deductInventoryForItem(itemId);
  }

  logActivity({
    activity: "status_change",
    entityType: "order_item",
    entityId: itemId,
    description: `Item status diubah ke ${status}`,
    page: "/kitchen",
  });

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
