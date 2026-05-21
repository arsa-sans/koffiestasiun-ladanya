// src/server/actions/payments.ts
"use server";

import { db } from "@/db";
import { orders, payments } from "@/db/schema";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { deductInventoryForOrder } from "@/server/services/inventory";
import { logActivity } from "@/server/services/activity-log";

export interface PaymentEntry {
  method: "cash" | "qris" | "card" | "ewallet" | "transfer";
  amount: number;
  reference?: string;
  note?: string;
}

export async function processPayment(
  orderId: string,
  paymentEntries: PaymentEntry[]
) {
  // Insert all payment records
  await db.insert(payments).values(
    paymentEntries.map((p) => ({
      orderId,
      method: p.method,
      amount: p.amount.toFixed(2),
      reference: p.reference || null,
      note: p.note || null,
    }))
  );

  // Mark order as paid
  await db
    .update(orders)
    .set({
      status: "paid",
      paidAt: new Date(),
      updatedAt: new Date(),
    })
    .where(eq(orders.id, orderId));

  // Deduct inventory
  await deductInventoryForOrder(orderId);

  revalidatePath("/cashier");
  revalidatePath("/admin/inventory");
  revalidatePath("/admin/reports");

  const totalPaid = paymentEntries.reduce((s, p) => s + p.amount, 0);
  logActivity({
    activity: "payment",
    entityType: "order",
    entityId: orderId,
    description: `Pembayaran Rp ${totalPaid.toLocaleString("id-ID")} (${paymentEntries.map((p) => p.method).join(", ")})`,
    page: "/cashier",
  });

  return { success: true };
}

