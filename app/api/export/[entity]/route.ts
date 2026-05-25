// app/api/export/[entity]/route.ts
import { db } from "@/db";
import {
  orders,
  orderItems,
  products,
  ingredients,
  diningTables,
  users,
  activityLogs,
} from "@/db/schema";
import { desc, eq } from "drizzle-orm";
import { createExcelBuffer, createMultiSheetExcel } from "@/lib/utils/export";

export const dynamic = "force-dynamic";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ entity: string }> }
) {
  const { entity } = await params;

  try {
    let buffer: Buffer;
    let filename: string;

    switch (entity) {
      case "orders": {
        const data = await db.query.orders.findMany({
          orderBy: desc(orders.createdAt),
          limit: 500,
          with: {
            table: true,
            cashier: { columns: { name: true } },
            items: {
              with: {
                product: { columns: { name: true } },
              },
            },
          },
        });

        const rows = data.map((o) => ({
          "No Order": o.orderNumber,
          "Tanggal": new Date(o.createdAt).toLocaleString("id-ID"),
          "Tipe": o.orderType === "dine_in" ? "Dine In" : "Takeaway",
          "Meja": o.table?.code || "-",
          "Pelanggan": o.customerName || "-",
          "Kasir": o.cashier?.name || "-",
          "Subtotal": parseFloat(String(o.subtotal)),
          "Pajak": parseFloat(String(o.taxAmount)),
          "Service": parseFloat(String(o.serviceAmount)),
          "Total": parseFloat(String(o.totalAmount)),
          "Status": o.status,
          "Pembayaran": o.paidAt
            ? new Date(o.paidAt).toLocaleString("id-ID")
            : "-",
          "Item": o.items
            .map((i) => `${i.quantity}x ${i.product.name}`)
            .join(", "),
        }));

        buffer = createExcelBuffer(rows, "Laporan Order");
        filename = `orders_${new Date().toISOString().slice(0, 10)}.xlsx`;
        break;
      }

      case "products": {
        const data = await db.query.products.findMany({
          with: { category: { columns: { name: true } } },
        });

        const rows = data.map((p) => ({
          "Nama": p.name,
          "Kategori": p.category?.name || "-",
          "Harga": parseFloat(String(p.price)),
          "Deskripsi": p.description || "-",
          "Status": p.isAvailable ? "Tersedia" : "Habis",
        }));

        buffer = createExcelBuffer(rows, "Daftar Produk");
        filename = `products_${new Date().toISOString().slice(0, 10)}.xlsx`;
        break;
      }

      case "inventory": {
        const data = await db
          .select()
          .from(ingredients)
          .orderBy(ingredients.name);

        const rows = data.map((i) => ({
          "Nama Bahan": i.name,
          "Satuan": i.unit,
          "Stok": parseFloat(String(i.stock)),
          "Stok Minimum": parseFloat(String(i.minStock)),
          "Status":
            parseFloat(String(i.stock)) <= parseFloat(String(i.minStock)) * 0.5
              ? "KRITIS"
              : parseFloat(String(i.stock)) <= parseFloat(String(i.minStock))
                ? "RENDAH"
                : "AMAN",
        }));

        buffer = createExcelBuffer(rows, "Inventaris");
        filename = `inventory_${new Date().toISOString().slice(0, 10)}.xlsx`;
        break;
      }

      case "activity": {
        const data = await db.query.activityLogs.findMany({
          orderBy: desc(activityLogs.createdAt),
          limit: 1000,
          with: {
            user: { columns: { name: true, role: true } },
          },
        });

        const rows = data.map((l) => ({
          "Waktu": new Date(l.createdAt).toLocaleString("id-ID"),
          "User": l.user?.name || "-",
          "Role": l.user?.role || l.role || "-",
          "Aktivitas": l.activity,
          "Entitas": l.entityType || "-",
          "Deskripsi": l.description || "-",
        }));

        buffer = createExcelBuffer(rows, "Log Aktivitas");
        filename = `activity_${new Date().toISOString().slice(0, 10)}.xlsx`;
        break;
      }

      case "full-report": {
        // Multi-sheet export: Orders + Products + Inventory
        const [ordersData, productsData, inventoryData] = await Promise.all([
          db.query.orders.findMany({
            orderBy: desc(orders.createdAt),
            limit: 500,
            with: {
              table: true,
              cashier: { columns: { name: true } },
            },
          }),
          db.query.products.findMany({
            with: { category: { columns: { name: true } } },
          }),
          db.select().from(ingredients).orderBy(ingredients.name),
        ]);

        buffer = createMultiSheetExcel([
          {
            name: "Orders",
            data: ordersData.map((o) => ({
              "No Order": o.orderNumber,
              "Tanggal": new Date(o.createdAt).toLocaleString("id-ID"),
              "Tipe": o.orderType === "dine_in" ? "Dine In" : "Takeaway",
              "Meja": o.table?.code || "-",
              "Total": parseFloat(String(o.totalAmount)),
              "Status": o.status,
              "Kasir": o.cashier?.name || "-",
            })),
          },
          {
            name: "Produk",
            data: productsData.map((p) => ({
              "Nama": p.name,
              "Kategori": p.category?.name || "-",
              "Harga": parseFloat(String(p.price)),
              "Status": p.isAvailable ? "Tersedia" : "Habis",
            })),
          },
          {
            name: "Inventaris",
            data: inventoryData.map((i) => ({
              "Nama Bahan": i.name,
              "Satuan": i.unit,
              "Stok": parseFloat(String(i.stock)),
              "Minimum": parseFloat(String(i.minStock)),
            })),
          },
        ]);
        filename = `full_report_${new Date().toISOString().slice(0, 10)}.xlsx`;
        break;
      }

      default:
        return Response.json(
          { error: `Unknown entity: ${entity}` },
          { status: 400 }
        );
    }

    return new Response(new Uint8Array(buffer), {
      headers: {
        "Content-Type":
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    });
  } catch (error) {
    console.error("Export error:", error);
    return Response.json(
      { error: "Failed to generate export" },
      { status: 500 }
    );
  }
}
