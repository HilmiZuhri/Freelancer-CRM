import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ProjectsTable } from "@/components/projects/projects-table";
import { mockProjects } from "@/lib/mock-data";

export default function ProjectsPage() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Projects</h1>
          <p className="text-sm text-muted-foreground">
            Track deliverables, budgets, and timelines across all client work.
          </p>
        </div>
        <Button className="gap-1.5 self-start sm:self-auto">
          <Plus className="h-4 w-4" />
          New Project
        </Button>
      </div>

      <ProjectsTable projects={mockProjects} />
    </div>
  );
}