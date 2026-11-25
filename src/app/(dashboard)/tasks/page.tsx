import { requireAuth } from "@/lib/auth-utils";
import { getProjectOptions, getTasks } from "@/lib/data/tasks";
import { TaskFormDialog } from "@/components/tasks/task-form-dialog";
import { TasksToolbar } from "@/components/tasks/tasks-toolbar";
import { TasksTable } from "@/components/tasks/tasks-table";

interface TasksPageProps {
  searchParams: Promise<{
    search?: string;
    status?: string;
    priority?: string;
    projectId?: string;
    page?: string;
  }>;
}

export default async function TasksPage({ searchParams }: TasksPageProps) {
  const { userId } = await requireAuth();
  const params = await searchParams;

  const search = params.search ?? "";
  const status = params.status ?? "ALL";
  const priority = params.priority ?? "ALL";
  const projectId = params.projectId ?? "ALL";
  const page = Number(params.page) || 1;

  const [{ tasks, totalCount, totalPages, currentPage }, projects] =
    await Promise.all([
      getTasks({ userId, search, status, priority, projectId, page }),
      getProjectOptions(userId),
    ]);

  const hasActiveSearchOrFilter = Boolean(
    search || status !== "ALL" || priority !== "ALL" || projectId !== "ALL"
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Tasks</h1>
          <p className="text-sm text-muted-foreground">
            Organize project deliverables, set priorities, and track completion.
          </p>
        </div>
        <TaskFormDialog mode="create" projects={projects} />
      </div>

      <TasksToolbar
        projects={projects}
        initialSearch={search}
        initialStatus={status}
        initialPriority={priority}
        initialProjectId={projectId}
      />

      <TasksTable
        tasks={tasks}
        projects={projects}
        totalCount={totalCount}
        currentPage={currentPage}
        totalPages={totalPages}
        hasActiveSearchOrFilter={hasActiveSearchOrFilter}
      />
    </div>
  );
}