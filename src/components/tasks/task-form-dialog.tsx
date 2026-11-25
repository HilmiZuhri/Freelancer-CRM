"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { TaskPriority, TaskStatus } from "@prisma/client";
import { Loader2, Plus } from "lucide-react";
import { toast } from "sonner";
import { taskSchema, type TaskInput } from "@/validations/task";
import { createTask, updateTask } from "@/actions/tasks";
import type { ProjectOption } from "@/lib/data/tasks";
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

export interface EditableTask {
  id: string;
  title: string;
  projectId: string;
  description: string | null;
  priority: TaskPriority;
  status: TaskStatus;
  dueDate: Date | null;
}

interface TaskFormDialogProps {
  mode: "create" | "edit";
  projects: ProjectOption[];
  defaultProjectId?: string;
  task?: EditableTask;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  trigger?: React.ReactNode;
}

function toDateInputValue(date?: Date | null): string {
  if (!date) return "";
  return new Date(date).toISOString().split("T")[0];
}

export function TaskFormDialog({
  mode,
  projects,
  defaultProjectId,
  task,
  open: controlledOpen,
  onOpenChange: setControlledOpen,
  trigger,
}: TaskFormDialogProps) {
  const [internalOpen, setInternalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isControlled = controlledOpen !== undefined;
  const open = isControlled ? controlledOpen : internalOpen;
  const setOpen = isControlled ? setControlledOpen! : setInternalOpen;

  const initialProjectId =
    task?.projectId ?? defaultProjectId ?? projects[0]?.id ?? "";

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors },
  } = useForm<TaskInput>({
    resolver: zodResolver(taskSchema),
    defaultValues: {
      title: task?.title ?? "",
      projectId: initialProjectId,
      description: task?.description ?? "",
      priority: task?.priority ?? "MEDIUM",
      status: task?.status ?? "TODO",
      dueDate: toDateInputValue(task?.dueDate),
    },
  });

  const selectedProjectId = watch("projectId");
  const selectedPriority = watch("priority");
  const selectedStatus = watch("status");

  useEffect(() => {
    if (open) {
      reset({
        title: task?.title ?? "",
        projectId: task?.projectId ?? defaultProjectId ?? projects[0]?.id ?? "",
        description: task?.description ?? "",
        priority: task?.priority ?? "MEDIUM",
        status: task?.status ?? "TODO",
        dueDate: toDateInputValue(task?.dueDate),
      });
    }
  }, [open, task, defaultProjectId, projects, reset]);

  async function onSubmit(data: TaskInput) {
    setIsSubmitting(true);
    try {
      const result =
        mode === "create"
          ? await createTask(data)
          : await updateTask(task!.id, data);

      if (result.error) {
        toast.error(result.error);
        return;
      }

      toast.success(
        mode === "create"
          ? "Task created successfully."
          : "Task updated successfully."
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
              New Task
            </Button>
          )}
        </DialogTrigger>
      )}

      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {mode === "create" ? "Add New Task" : "Edit Task"}
          </DialogTitle>
          <DialogDescription>
            {mode === "create"
              ? "Break down project deliverables into actionable tasks."
              : "Update task priority, status, or due date."}
          </DialogDescription>
        </DialogHeader>

        {projects.length === 0 ? (
          <div className="py-6 text-center space-y-3">
            <p className="text-sm text-muted-foreground">
              You need to create at least one project before adding tasks.
            </p>
            <Button asChild onClick={() => setOpen(false)}>
              <Link href="/projects">Go to Projects</Link>
            </Button>
          </div>
        ) : (
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="task-title">
                Task Title <span className="text-destructive">*</span>
              </Label>
              <Input
                id="task-title"
                placeholder="Design responsive pricing page"
                disabled={isSubmitting}
                {...register("title")}
              />
              {errors.title && (
                <p className="text-xs text-destructive">
                  {errors.title.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label>
                Project <span className="text-destructive">*</span>
              </Label>
              <Select
                value={selectedProjectId}
                onValueChange={(value) =>
                  setValue("projectId", value, { shouldValidate: true })
                }
                disabled={isSubmitting || Boolean(defaultProjectId)}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select project" />
                </SelectTrigger>
                <SelectContent>
                  {projects.map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.title} ({p.clientName})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.projectId && (
                <p className="text-xs text-destructive">
                  {errors.projectId.message}
                </p>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>Priority</Label>
                <Select
                  value={selectedPriority}
                  onValueChange={(value) =>
                    setValue("priority", value as TaskPriority, {
                      shouldValidate: true,
                    })
                  }
                  disabled={isSubmitting}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="LOW">Low</SelectItem>
                    <SelectItem value="MEDIUM">Medium</SelectItem>
                    <SelectItem value="HIGH">High</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Status</Label>
                <Select
                  value={selectedStatus}
                  onValueChange={(value) =>
                    setValue("status", value as TaskStatus, {
                      shouldValidate: true,
                    })
                  }
                  disabled={isSubmitting}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="TODO">To Do</SelectItem>
                    <SelectItem value="IN_PROGRESS">In Progress</SelectItem>
                    <SelectItem value="DONE">Done</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="task-due-date">Due Date</Label>
                <Input
                  id="task-due-date"
                  type="date"
                  disabled={isSubmitting}
                  {...register("dueDate")}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="task-description">Description</Label>
              <Textarea
                id="task-description"
                placeholder="Task requirements, acceptance criteria, or links..."
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
                {mode === "create" ? "Save Task" : "Save Changes"}
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}