"use client";

import { useState } from "react";
import { ProjectStatus } from "@prisma/client";
import { Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { updateProjectStatus } from "@/actions/projects";
import type { ClientOption } from "@/lib/data/projects";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  ProjectFormDialog,
  type EditableProject,
} from "@/components/projects/project-form-dialog";
import { DeleteProjectDialog } from "@/components/projects/delete-project-dialog";

export function ProjectDetailActions({
  project,
  clients,
}: {
  project: EditableProject;
  clients: ClientOption[];
}) {
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);

  async function handleStatusChange(newStatus: ProjectStatus) {
    setIsUpdatingStatus(true);
    try {
      const result = await updateProjectStatus(project.id, newStatus);
      if (result.error) {
        toast.error(result.error);
        return;
      }
      toast.success("Project status updated.");
    } finally {
      setIsUpdatingStatus(false);
    }
  }

  return (
    <>
      <div className="flex flex-wrap items-center gap-2">
        <Select
          value={project.status}
          onValueChange={(value) => handleStatusChange(value as ProjectStatus)}
          disabled={isUpdatingStatus}
        >
          <SelectTrigger className="w-[155px] bg-card h-9">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="PLANNING">Planning</SelectItem>
            <SelectItem value="IN_PROGRESS">In Progress</SelectItem>
            <SelectItem value="ON_HOLD">On Hold</SelectItem>
            <SelectItem value="COMPLETED">Completed</SelectItem>
          </SelectContent>
        </Select>

        <Button
          variant="outline"
          size="sm"
          onClick={() => setEditOpen(true)}
          className="gap-1.5"
        >
          <Pencil className="h-4 w-4" />
          Edit
        </Button>

        <Button
          variant="destructive"
          size="sm"
          onClick={() => setDeleteOpen(true)}
          className="gap-1.5"
        >
          <Trash2 className="h-4 w-4" />
          Delete
        </Button>
      </div>

      <ProjectFormDialog
        mode="edit"
        clients={clients}
        project={project}
        open={editOpen}
        onOpenChange={setEditOpen}
      />

      <DeleteProjectDialog
        projectId={project.id}
        projectTitle={project.title}
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        redirectAfterDelete
      />
    </>
  );
}