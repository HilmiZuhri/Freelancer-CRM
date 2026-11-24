"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ProjectStatus } from "@prisma/client";
import { Loader2, Plus } from "lucide-react";
import { toast } from "sonner";
import { projectSchema, type ProjectInput } from "@/validations/project";
import { createProject, updateProject } from "@/actions/projects";
import type { ClientOption } from "@/lib/data/projects";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

export interface EditableProject {
  id: string;
  title: string;
  clientId: string;
  description: string | null;
  status: ProjectStatus;
  budget: number;
  startDate: Date | null;
  deadline: Date | null;
}

interface ProjectFormDialogProps {
  mode: "create" | "edit";
  clients: ClientOption[];
  project?: EditableProject;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  trigger?: React.ReactNode;
}

function toDateInputValue(date?: Date | null): string {
  if (!date) return "";
  return new Date(date).toISOString().split("T")[0];
}

export function ProjectFormDialog({
  mode,
  clients,
  project,
  open: controlledOpen,
  onOpenChange: setControlledOpen,
  trigger,
}: ProjectFormDialogProps) {
  const [internalOpen, setInternalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isControlled = controlledOpen !== undefined;
  const open = isControlled ? controlledOpen : internalOpen;
  const setOpen = isControlled ? setControlledOpen! : setInternalOpen;

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors },
  } = useForm<ProjectInput>({
    resolver: zodResolver(projectSchema),
    defaultValues: {
      title: project?.title ?? "",
      clientId: project?.clientId ?? clients[0]?.id ?? "",
      description: project?.description ?? "",
      status: project?.status ?? "PLANNING",
      budget: project?.budget ?? 0,
      startDate: toDateInputValue(project?.startDate),
      deadline: toDateInputValue(project?.deadline),
    },
  });

  const selectedClientId = watch("clientId");
  const selectedStatus = watch("status");

  useEffect(() => {
    if (open) {
      reset({
        title: project?.title ?? "",
        clientId: project?.clientId ?? clients[0]?.id ?? "",
        description: project?.description ?? "",
        status: project?.status ?? "PLANNING",
        budget: project?.budget ?? 0,
        startDate: toDateInputValue(project?.startDate),
        deadline: toDateInputValue(project?.deadline),
      });
    }
  }, [open, project, clients, reset]);

  async function onSubmit(data: ProjectInput) {
    setIsSubmitting(true);
    try {
      const result =
        mode === "create"
          ? await createProject(data)
          : await updateProject(project!.id, data);

      if (result.error) {
        toast.error(result.error);
        return;
      }

      toast.success(
        mode === "create"
          ? "Project created successfully."
          : "Project updated successfully."
      );
      setOpen(false);
      if (mode === "create") reset();
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {mode === "create" && !isControlled && (
        <DialogTrigger asChild>
          {trigger ?? (
            <Button className="gap-1.5">
              <Plus className="h-4 w-4" />
              New Project
            </Button>
          )}
        </DialogTrigger>
      )}

      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {mode === "create" ? "Create New Project" : "Edit Project"}
          </DialogTitle>
          <DialogDescription>
            {mode === "create"
              ? "Define scope, budget, timeline, and link it to a client."
              : "Update project details, status, or deadlines."}
          </DialogDescription>
        </DialogHeader>

        {clients.length === 0 ? (
          <div className="py-6 text-center space-y-3">
            <p className="text-sm text-muted-foreground">
              You need to add at least one client before creating a project.
            </p>
            <Button asChild onClick={() => setOpen(false)}>
              <Link href="/clients">Go to Clients</Link>
            </Button>
          </div>
        ) : (
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="project-title">
                Project Title <span className="text-destructive">*</span>
              </Label>
              <Input
                id="project-title"
                placeholder="SaaS Marketing Website Redesign"
                disabled={isSubmitting}
                {...register("title")}
              />
              {errors.title && (
                <p className="text-xs text-destructive">
                  {errors.title.message}
                </p>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>
                  Client <span className="text-destructive">*</span>
                </Label>
                <Select
                  value={selectedClientId}
                  onValueChange={(value) =>
                    setValue("clientId", value, { shouldValidate: true })
                  }
                  disabled={isSubmitting}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select client" />
                  </SelectTrigger>
                  <SelectContent>
                    {clients.map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.name}
                        {c.company ? ` (${c.company})` : ""}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.clientId && (
                  <p className="text-xs text-destructive">
                    {errors.clientId.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label>Status</Label>
                <Select
                  value={selectedStatus}
                  onValueChange={(value) =>
                    setValue("status", value as ProjectStatus, {
                      shouldValidate: true,
                    })
                  }
                  disabled={isSubmitting}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="PLANNING">Planning</SelectItem>
                    <SelectItem value="IN_PROGRESS">In Progress</SelectItem>
                    <SelectItem value="ON_HOLD">On Hold</SelectItem>
                    <SelectItem value="COMPLETED">Completed</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="project-budget">Budget (USD)</Label>
                <Input
                  id="project-budget"
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="5000"
                  disabled={isSubmitting}
                  {...register("budget", {
                    setValueAs: (v) => (v === "" ? 0 : Number(v)),
                  })}
                />
                {errors.budget && (
                  <p className="text-xs text-destructive">
                    {errors.budget.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="project-start">Start Date</Label>
                <Input
                  id="project-start"
                  type="date"
                  disabled={isSubmitting}
                  {...register("startDate")}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="project-deadline">Deadline</Label>
                <Input
                  id="project-deadline"
                  type="date"
                  disabled={isSubmitting}
                  {...register("deadline")}
                />
                {errors.deadline && (
                  <p className="text-xs text-destructive">
                    {errors.deadline.message}
                  </p>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="project-description">Description</Label>
              <Textarea
                id="project-description"
                placeholder="Project deliverables, milestones, and technical notes..."
                rows={3}
                disabled={isSubmitting}
                {...register("description")}
              />
              {errors.description && (
                <p className="text-xs text-destructive">
                  {errors.description.message}
                </p>
              )}
            </div>

            <DialogFooter className="pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setOpen(false)}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                {mode === "create" ? "Create Project" : "Save Changes"}
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}