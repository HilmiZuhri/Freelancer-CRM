import { requireAuth } from "@/lib/auth-utils";
import { getClientOptions, getProjects } from "@/lib/data/projects";
import { ProjectFormDialog } from "@/components/projects/project-form-dialog";
import { ProjectsToolbar } from "@/components/projects/projects-toolbar";
import { ProjectsTable } from "@/components/projects/projects-table";

interface ProjectsPageProps {
  searchParams: Promise<{
    search?: string;
    status?: string;
    page?: string;
  }>;
}

export default async function ProjectsPage({
  searchParams,
}: ProjectsPageProps) {
  const { userId } = await requireAuth();
  const params = await searchParams;

  const search = params.search ?? "";
  const status = params.status ?? "ALL";
  const page = Number(params.page) || 1;

  const [{ projects, totalCount, totalPages, currentPage }, clients] =
    await Promise.all([
      getProjects({ userId, search, status, page }),
      getClientOptions(userId),
    ]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Projects</h1>
          <p className="text-sm text-muted-foreground">
            Track deliverables, budgets, timelines, and progress across all client work.
          </p>
        </div>
        <ProjectFormDialog mode="create" clients={clients} />
      </div>

      <ProjectsToolbar initialSearch={search} initialStatus={status} />

      <ProjectsTable
        projects={projects}
        clients={clients}
        totalCount={totalCount}
        currentPage={currentPage}
        totalPages={totalPages}
        hasActiveSearchOrFilter={Boolean(search || status !== "ALL")}
      />
    </div>
  );
}