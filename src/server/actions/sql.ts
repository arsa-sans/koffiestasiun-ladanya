// src/server/actions/sql.ts
"use server";

import { db } from "@/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";
import { sql } from "drizzle-orm";
import { createClient } from "@/lib/supabase/server";
import { logActivity } from "@/server/services/activity-log";
import { revalidatePath } from "next/cache";

export interface SqlQueryResult {
  success: boolean;
  command?: string;
  rows?: Record<string, unknown>[];
  columns?: string[];
  affectedRows?: number;
  executionTime?: number;
  error?: string;
}

export async function executeSqlQuery(query: string): Promise<SqlQueryResult> {
  const startTime = performance.now();

  try {
    // 1. Verify user authentication
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { success: false, error: "Unauthorized: Harap masuk terlebih dahulu." };
    }

    // 2. Verify user is an Admin
    const [dbUser] = await db
      .select({ role: users.role, name: users.name })
      .from(users)
      .where(eq(users.authId, user.id))
      .limit(1);

    if (!dbUser || dbUser.role !== "admin") {
      return { success: false, error: "Forbidden: Hanya Administrator yang dapat mengakses SQL Editor." };
    }

    // Sanitize query slightly (prevent empty commands)
    const trimmedQuery = query.trim();
    if (!trimmedQuery) {
      return { success: false, error: "Query SQL tidak boleh kosong." };
    }

    // 3. Execute the SQL query
    // Drizzle execute returns raw driver results (postgres-js Row array with properties)
    const result = (await db.execute(sql.raw(trimmedQuery))) as any;

    const endTime = performance.now();
    const executionTime = Math.round(endTime - startTime);

    // Determine query command (SELECT, TRUNCATE, UPDATE, DELETE, etc.)
    // Postgres-js provides .command on the result object
    const command = result.command || getSqlCommandType(trimmedQuery);

    let rows: Record<string, unknown>[] = [];
    let columns: string[] = [];
    let affectedRows = typeof result.count === "number" ? result.count : undefined;

    // For SELECT queries or commands returning rows, extract data
    if (Array.isArray(result) && result.length > 0) {
      // Convert postgres-js rows to clean objects if needed, and extract columns
      rows = result.map((row) => ({ ...row }));
      columns = Object.keys(rows[0]);
    } else if (Array.isArray(result)) {
      // Empty result but still an array (e.g., SELECT with 0 rows)
      rows = [];
      // We don't have columns in this case, but that's fine
    }

    // If it's a truncate or similar operation, affectedRows is usually from count or manual analysis
    if (command === "TRUNCATE") {
      affectedRows = 0; // Truncate doesn't report affected rows in Postgres standard
    }

    // 4. Log this SQL execution for auditing
    logActivity({
      userId: dbUser.role === "admin" ? user.id : undefined,
      role: dbUser.role,
      activity: "sql_execute",
      description: `Eksekusi SQL [${command}]: ${trimmedQuery.substring(0, 100)}${trimmedQuery.length > 100 ? "..." : ""}`,
      metadata: {
        command,
        executionTimeMs: executionTime,
        affectedRows,
        success: true,
      },
      page: "/admin/sql",
    });

    // Revalidate all caches if data modification occurred
    if (["TRUNCATE", "INSERT", "UPDATE", "DELETE", "DROP", "ALTER", "CREATE"].includes(command)) {
      revalidatePath("/", "layout");
    }

    return {
      success: true,
      command,
      rows: rows.length > 0 ? rows : undefined,
      columns: columns.length > 0 ? columns : undefined,
      affectedRows,
      executionTime,
    };
  } catch (error: any) {
    const endTime = performance.now();
    const executionTime = Math.round(endTime - startTime);
    console.error("SQL Editor Error:", error);

    // Log failed attempts
    logActivity({
      activity: "sql_execute_failed",
      description: `Gagal eksekusi SQL: ${error.message || "Unknown error"}`,
      metadata: {
        query: query.substring(0, 200),
        executionTimeMs: executionTime,
        success: false,
      },
      page: "/admin/sql",
    });

    return {
      success: false,
      error: error.message || "Terjadi kesalahan saat mengeksekusi query SQL.",
      executionTime,
    };
  }
}

function getSqlCommandType(query: string): string {
  const match = query.trim().match(/^([A-Za-z]+)/);
  return match ? match[1].toUpperCase() : "SQL";
}
