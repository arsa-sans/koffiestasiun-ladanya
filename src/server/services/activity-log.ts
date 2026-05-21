// src/server/services/activity-log.ts
"use server";

import { db } from "@/db";
import { activityLogs } from "@/db/schema";
import { desc, eq, and, gte, lte } from "drizzle-orm";

interface LogActivityParams {
  userId?: string;
  role?: string;
  activity: string;
  entityType?: string;
  entityId?: string;
  description?: string;
  metadata?: Record<string, unknown>;
  page?: string;
  ipAddress?: string;
  userAgent?: string;
}

export async function logActivity(params: LogActivityParams) {
  try {
    await db.insert(activityLogs).values({
      userId: params.userId || null,
      role: params.role || null,
      activity: params.activity,
      entityType: params.entityType || null,
      entityId: params.entityId || null,
      description: params.description || null,
      metadata: params.metadata || null,
      page: params.page || null,
      ipAddress: params.ipAddress || null,
      userAgent: params.userAgent || null,
    });
  } catch (error) {
    // Logging should never break the main flow
    console.error("Failed to log activity:", error);
  }
}

export async function getActivityLogs(options?: {
  userId?: string;
  activity?: string;
  entityType?: string;
  limit?: number;
  startDate?: Date;
  endDate?: Date;
}) {
  const limit = options?.limit || 100;

  return db.query.activityLogs.findMany({
    orderBy: desc(activityLogs.createdAt),
    limit,
    with: {
      user: {
        columns: { id: true, name: true, email: true, role: true },
      },
    },
  });
}
