import { ActivityEntityType, Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";

export const ACTIVITY_PAGE_SIZE = 12;

interface GetActivityLogsParams {
  userId: string;
  entityType?: string;
  page?: number;
}

export async function getActivityLogs({
  userId,
  entityType = "ALL",
  page = 1,
}: GetActivityLogsParams) {
  const safePage = Number.isFinite(page) && page > 0 ? Math.floor(page) : 1;

  const where: Prisma.ActivityLogWhereInput = {
    userId,
  };

  if (
    entityType !== "ALL" &&
    Object.values(ActivityEntityType).includes(entityType as ActivityEntityType)
  ) {
    where.entityType = entityType as ActivityEntityType;
  }

  const [totalCount, logs] = await Promise.all([
    prisma.activityLog.count({ where }),
    prisma.activityLog.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (safePage - 1) * ACTIVITY_PAGE_SIZE,
      take: ACTIVITY_PAGE_SIZE,
    }),
  ]);

  const totalPages = Math.max(1, Math.ceil(totalCount / ACTIVITY_PAGE_SIZE));

  return {
    logs,
    totalCount,
    totalPages,
    currentPage: safePage,
  };
}