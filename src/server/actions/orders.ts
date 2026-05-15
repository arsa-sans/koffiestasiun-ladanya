// src/server/actions/orders.ts
"use server";

import { db } from "@/db";
import { orders, orderItems, orderItemModifiers } from "@/db/schema";
import { generateOrderNumber } from "@/lib/utils/format";
import { calculateOrderAmounts } from "@/lib/utils/format";
import { revalidatePath } from "next/cache";

export interface CartItem {
  productId: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  notes?: string;
  modifiers: {
    modifierOptionId: string;
    name: string;
    price: number;
  }[];
}

export async function createOrder(data: {
  tableId?: string;
  cashierId?: string;
  customerName?: string;
  orderType: "dine_in" | "takeaway";
  items: CartItem[];
  notes?: string;
}) {
  const { tableId, cashierId, customerName, orderType, items, notes } = data;

  // Calculate subtotal
  const subtotal = items.reduce((sum, item) => {
    const modifiersTotal = item.modifiers.reduce((ms, m) => ms + m.price, 0);
    return sum + (item.unitPrice + modifiersTotal) * item.quantity;
  }, 0);

  const { taxAmount, serviceAmount, totalAmount } = calculateOrderAmounts(subtotal);

  const orderNumber = generateOrderNumber();

  const [order] = await db
    .insert(orders)
    .values({
      orderNumber,
      tableId: tableId || null,
      cashierId: cashierId || null,
      customerName: customerName || null,
      orderType,
      status: "open",
      subtotal: subtotal.toFixed(2),
      taxAmount: taxAmount.toFixed(2),
      serviceAmount: serviceAmount.toFixed(2),
      totalAmount: totalAmount.toFixed(2),
      notes: notes || null,
    })
    .returning();

  // Insert items
  for (const item of items) {
    const modifiersTotal = item.modifiers.reduce((ms, m) => ms + m.price, 0);
    const itemTotal = (item.unitPrice + modifiersTotal) * item.quantity;

    const [orderItem] = await db
      .insert(orderItems)
      .values({
        orderId: order.id,
        productId: item.productId,
        quantity: item.quantity,
        unitPrice: item.unitPrice.toFixed(2),
        totalPrice: itemTotal.toFixed(2),
        status: "pending",
        notes: item.notes || null,
      })
      .returning();

    // Insert modifiers
    if (item.modifiers.length > 0) {
      await db.insert(orderItemModifiers).values(
        item.modifiers.map((m) => ({
          orderItemId: orderItem.id,
          modifierOptionId: m.modifierOptionId,
          name: m.name,
          price: m.price.toFixed(2),
        }))
      );
    }
  }

  revalidatePath("/cashier");
  revalidatePath("/kitchen");

  return { success: true, orderId: order.id, orderNumber };
}

export async function voidOrder(orderId: string, reason: string, userId?: string) {
  await db
    .update(orders)
    .set({ status: "void", updatedAt: new Date() })
    .where(eq(orders.id, orderId));

  revalidatePath("/cashier");
  revalidatePath("/kitchen");

  return { success: true };
}

// Import missing
import { eq } from "drizzle-orm";
