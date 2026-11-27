import { requireAuth } from "@/lib/auth-utils";
import { getActivityLogs } from "@/lib/data/activity";
import { ActivityList } from "@/components/activity/activity-list";

interface ActivityPageProps {
  searchParams: Promise<{
    type?: string;
    page?: string;
  }>;
}

export default async function ActivityPage({
  searchParams,
}: ActivityPageProps) {
  const { userId } = await requireAuth();
  const params = await searchParams;

  const type = params.type ?? "ALL";
  const page = Number(params.page) || 1;

  const { logs, totalCount, totalPages, currentPage } = await getActivityLogs({
    userId,
    entityType: type,
    page,
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Activity Log</h1>
        <p className="text-sm text-muted-foreground">
          Complete audit trail of your clients, projects, tasks, and invoices.
        </p>
      </div>

      <ActivityList
        logs={logs}
        initialType={type}
        totalCount={totalCount}
        currentPage={currentPage}
        totalPages={totalPages}
      />
    </div>
  );
}