import { and, desc, eq } from "drizzle-orm";
import { db } from "@/config/db";
import { activityLogs } from "@/db/schema/activity-logs";

export type ActivityLogRow = typeof activityLogs.$inferSelect;

export async function appendActivity(input: {
  entityType: string;
  entityId: string;
  userId: string;
  action: string;
  summary?: string | null;
  meta?: Record<string, unknown> | null;
}) {
  await db.insert(activityLogs).values({
    entityType: input.entityType,
    entityId: input.entityId,
    userId: input.userId,
    action: input.action,
    summary: input.summary ?? null,
    meta: input.meta ?? null,
  });
}

export async function listActivitiesForEntity(entityType: string, entityId: string) {
  return db.query.activityLogs.findMany({
    where: and(eq(activityLogs.entityType, entityType), eq(activityLogs.entityId, entityId)),
    orderBy: [desc(activityLogs.createdAt)],
    limit: 80,
    with: {
      user: { columns: { id: true, name: true, email: true, role: true } },
    },
  });
}
