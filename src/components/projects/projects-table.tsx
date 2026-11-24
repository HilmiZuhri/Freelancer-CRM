"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import {
  ChevronLeft,
  ChevronRight,
  Eye,
  FolderKanban,
  MoreHorizontal,
  Pencil,
  Trash2,
} from "lucide-react";
import type { ClientOption, ProjectListItem } from "@/lib/data/projects";
import { formatCurrency, formatDate } from "@/lib/formatters";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { ProjectStatusBadge } from "@/components/shared/status-badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  ProjectFormDialog,
  type EditableProject,
} from "@/components/projects/project-form-dialog";
import { DeleteProjectDialog } from "@/components/projects/delete-project-dialog";

interface ProjectsTableProps {
  projects: ProjectListItem[];
  clients: ClientOption[];
  totalCount: number;
  currentPage: number;
  totalPages: number;
  hasActiveSearchOrFilter: boolean;
}

export function ProjectsTable({
  projects,
  clients,
  totalCount,
  currentPage,
  totalPages,
  hasActiveSearchOrFilter,
}: ProjectsTableProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [editingProject, setEditingProject] = useState<EditableProject | null>(
    null
  );
  const [deletingProject, setDeletingProject] = useState<{
    id: string;
    title: string;
  } | null>(null);

  function goToPage(page: number) {
    const params = new URLSearchParams(searchParams.toString());
    if (page <= 1) {
      params.delete("page");
    } else {
      params.set("page", page.toString());
    }
    router.push(`${pathname}?${params.toString()}`);
  }

  if (projects.length === 0) {
    return (
      <div className="rounded-lg border border-border bg-card p-12 text-center">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary mb-4">
          <FolderKanban className="h-6 w-6" />
        </div>
        <h3 className="text-base font-semibold">
          {hasActiveSearchOrFilter
            ? "No matching projects found"
            : "No projects yet"}
        </h3>
        <p className="text-sm text-muted-foreground max-w-sm mx-auto mt-1 mb-5">
          {hasActiveSearchOrFilter
            ? "Try adjusting your search query or status filter."
            : "Create your first project to start tracking deliverables, deadlines, and budgets."}
        </p>
        {!hasActiveSearchOrFilter && (
          <ProjectFormDialog mode="create" clients={clients} />
        )}
      </div>
    );
  }

  return (
    <>
      <div className="rounded-lg border border-border bg-card overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Project</TableHead>
              <TableHead>Client</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Progress</TableHead>
              <TableHead>Budget</TableHead>
              <TableHead>Deadline</TableHead>
              <TableHead className="w-12" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {projects.map((project) => (
              <TableRow key={project.id}>
                <TableCell>
                  <Link
                    href={`/projects/${project.id}`}
                    className="font-medium text-foreground hover:underline"
                  >
                    {project.title}
                  </Link>
                </TableCell>
                <TableCell>
                  <Link
                    href={`/clients/${project.clientId}`}
                    className="text-muted-foreground hover:text-foreground hover:underline"
                  >
                    {project.clientName}
                  </Link>
                </TableCell>
                <TableCell>
                  <ProjectStatusBadge status={project.status} />
                </TableCell>
                <TableCell className="w-36">
                  <div className="flex items-center gap-2">
                    <Progress value={project.progress} className="h-2" />
                    <span className="text-xs text-muted-foreground">
                      {project.progress}%
                    </span>
                  </div>
                </TableCell>
                <TableCell className="font-medium">
                  {formatCurrency(project.budget)}
                </TableCell>
                <TableCell className="text-muted-foreground text-sm">
                  {project.deadline
                    ? formatDate(project.deadline.toISOString())
                    : "—"}
                </TableCell>
                <TableCell>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem asChild>
                        <Link
                          href={`/projects/${project.id}`}
                          className="cursor-pointer"
                        >
                          <Eye className="mr-2 h-4 w-4" />
                          View Details
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => setEditingProject(project)}
                        className="cursor-pointer"
                      >
                        <Pencil className="mr-2 h-4 w-4" />
                        Edit Project
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        onClick={() =>
                          setDeletingProject({
                            id: project.id,
                            title: project.title,
                          })
                        }
                        className="text-destructive focus:text-destructive cursor-pointer"
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-1">
        <p className="text-xs text-muted-foreground">
          Showing page <span className="font-medium">{currentPage}</span> of{" "}
          <span className="font-medium">{totalPages}</span> ({totalCount}{" "}
          {totalCount === 1 ? "project" : "projects"} total)
        </p>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => goToPage(currentPage - 1)}
            disabled={currentPage <= 1}
          >
            <ChevronLeft className="h-4 w-4 mr-1" />
            Previous
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => goToPage(currentPage + 1)}
            disabled={currentPage >= totalPages}
          >
            Next
            <ChevronRight className="h-4 w-4 ml-1" />
          </Button>
        </div>
      </div>

      {editingProject && (
        <ProjectFormDialog
          mode="edit"
          clients={clients}
          project={editingProject}
          open={Boolean(editingProject)}
          onOpenChange={(open) => {
            if (!open) setEditingProject(null);
          }}
        />
      )}

      {deletingProject && (
        <DeleteProjectDialog
          projectId={deletingProject.id}
          projectTitle={deletingProject.title}
          open={Boolean(deletingProject)}
          onOpenChange={(open) => {
            if (!open) setDeletingProject(null);
          }}
        />
      )}
    </>
  );
}