// src/server/services/fees.ts
"use server";

import { db } from "@/db";
import { additionalFees } from "@/db/schema";
import { eq, asc } from "drizzle-orm";
import { revalidatePath } from "next/cache";

export async function getActiveFees() {
  return db
    .select()
    .from(additionalFees)
    .where(eq(additionalFees.isActive, true))
    .orderBy(asc(additionalFees.name));
}

export async function getAllFees() {
  return db.select().from(additionalFees).orderBy(asc(additionalFees.name));
}

export async function createFee(data: {
  name: string;
  type: "percentage" | "fixed";
  value: number;
}) {
  const [created] = await db
    .insert(additionalFees)
    .values({
      name: data.name,
      type: data.type,
      value: data.value.toString(),
    })
    .returning();

  revalidatePath("/admin/fees");
  revalidatePath("/cashier");
  return { success: true, data: created };
}

export async function updateFee(
  id: string,
  data: {
    name?: string;
    type?: "percentage" | "fixed";
    value?: number;
    isActive?: boolean;
  }
) {
  const updateData: Record<string, unknown> = { updatedAt: new Date() };
  if (data.name !== undefined) updateData.name = data.name;
  if (data.type !== undefined) updateData.type = data.type;
  if (data.value !== undefined) updateData.value = data.value.toString();
  if (data.isActive !== undefined) updateData.isActive = data.isActive;

  const [updated] = await db
    .update(additionalFees)
    .set(updateData)
    .where(eq(additionalFees.id, id))
    .returning();

  revalidatePath("/admin/fees");
  revalidatePath("/cashier");
  return { success: true, data: updated };
}

export async function deleteFee(id: string) {
  await db.delete(additionalFees).where(eq(additionalFees.id, id));
  revalidatePath("/admin/fees");
  revalidatePath("/cashier");
  return { success: true };
}

/**
 * Calculate total fees for a given subtotal
 * Returns breakdown of each fee + total fee amount
 */
export async function calculateFees(subtotal: number) {
  const fees = await getActiveFees();

  const breakdown = fees.map((fee) => {
    const value = parseFloat(String(fee.value));
    const amount = fee.type === "percentage" ? subtotal * (value / 100) : value;
    return {
      id: fee.id,
      name: fee.name,
      type: fee.type,
      value,
      amount,
    };
  });

  const totalFees = breakdown.reduce((sum, f) => sum + f.amount, 0);

  return { breakdown, totalFees };
}
