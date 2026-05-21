export const dynamic = "force-dynamic";
export const revalidate = 0;

// app/admin/activity/page.tsx
import { getActivityLogs } from "@/server/services/activity-log";
import ActivityLogClient from "@/components/admin/ActivityLogClient";

export default async function ActivityPage() {
  const logs = await getActivityLogs({ limit: 200 });

  return (
    <ActivityLogClient
      logs={logs.map((log) => ({
        id: log.id,
        activity: log.activity,
        entityType: log.entityType,
        entityId: log.entityId,
        description: log.description,
        page: log.page,
        createdAt: log.createdAt.toISOString(),
        user: log.user
          ? {
              id: log.user.id,
              name: log.user.name,
              email: log.user.email,
              role: log.user.role,
            }
          : null,
      }))}
    />
  );
}
