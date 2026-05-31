// src/server/actions/orders.ts
"use server";

import { db } from "@/db";
import { orders, orderItems, orderItemModifiers, voidLogs } from "@/db/schema";
import { generateOrderNumber } from "@/lib/utils/format";
import { revalidatePath } from "next/cache";
import { logActivity } from "@/server/services/activity-log";
import { calculateFees } from "@/server/services/fees";
import { eq, inArray } from "drizzle-orm";
import { restoreInventoryForItem } from "@/server/services/inventory-deduction";

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

  // Dynamic fees from DB (replaces hardcoded TAX_RATE/SERVICE_RATE)
  const { breakdown, totalFees } = await calculateFees(subtotal);

  // Extract tax and service from breakdown for backward compatibility
  const taxItem = breakdown.find((f) => f.name.toLowerCase().includes("ppn") || f.name.toLowerCase().includes("tax") || f.name.toLowerCase().includes("pajak"));
  const serviceItem = breakdown.find((f) => f.name.toLowerCase().includes("service") || f.name.toLowerCase().includes("layanan"));

  const taxAmount = taxItem?.amount || 0;
  const serviceAmount = serviceItem?.amount || 0;
  const totalAmount = subtotal + totalFees;

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

  // Log activity
  logActivity({
    userId: cashierId || undefined,
    activity: "create",
    entityType: "order",
    entityId: order.id,
    description: `Order ${orderNumber} dibuat (${items.length} item)`,
    page: "/cashier",
  });

  return { success: true, orderId: order.id, orderNumber, totalAmount };
}

export async function voidOrder(orderId: string, reason: string, userId?: string) {
  // 1. Get all items for the order
  const items = await db.query.orderItems.findMany({
    where: eq(orderItems.orderId, orderId),
  });

  // 2. Restore inventory for any items that were deducted
  for (const item of items) {
    if (item.inventoryDeducted) {
      await restoreInventoryForItem(item.id, userId);
    }
  }

  // 3. Mark order as void
  await db
    .update(orders)
    .set({ status: "void", updatedAt: new Date() })
    .where(eq(orders.id, orderId));

  // 4. Mark all items as void
  await db
    .update(orderItems)
    .set({ status: "void", updatedAt: new Date() })
    .where(eq(orderItems.orderId, orderId));

  // 5. Create voidLog
  await db.insert(voidLogs).values({
    orderId,
    reason,
    voidedById: userId || null,
  });

  revalidatePath("/cashier");
  revalidatePath("/kitchen");

  logActivity({
    userId: userId || undefined,
    activity: "update",
    entityType: "order",
    entityId: orderId,
    description: `Order di-void: ${reason}`,
    page: "/cashier",
  });

  return { success: true };
}

export async function getOrderReceipt(orderId: string) {
  const order = await db.query.orders.findFirst({
    where: eq(orders.id, orderId),
    with: {
      table: true,
      cashier: true,
      items: {
        with: {
          product: true,
          modifiers: true,
        },
      },
      payments: true,
    },
  });

  return order;
}

export async function cancelOrderItem(orderItemId: string, reason: string, userId?: string) {
  const [item] = await db
    .select()
    .from(orderItems)
    .where(eq(orderItems.id, orderItemId))
    .limit(1);

  if (!item) {
    return { success: false, message: "Item not found" };
  }

  if (item.status === "ready" || item.status === "delivered") {
    return { success: false, message: "Cannot cancel item that is already ready or delivered" };
  }

  // Restore inventory if it was deducted
  if (item.inventoryDeducted) {
    await restoreInventoryForItem(orderItemId, userId);
  }

  // Mark item as canceled
  await db
    .update(orderItems)
    .set({ status: "canceled", updatedAt: new Date() })
    .where(eq(orderItems.id, orderItemId));

  // Log void
  await db.insert(voidLogs).values({
    orderId: item.orderId,
    orderItemId,
    reason,
    voidedById: userId || null,
  });

  revalidatePath("/cashier");
  revalidatePath("/kitchen");

  logActivity({
    userId: userId || undefined,
    activity: "update",
    entityType: "order_item",
    entityId: orderItemId,
    description: `Item di-cancel: ${reason}`,
    page: "/cashier",
  });

  return { success: true };
}
