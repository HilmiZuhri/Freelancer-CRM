"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { TaskStatus } from "@prisma/client";
import {
  CheckSquare,
  ChevronLeft,
  ChevronRight,
  MoreHorizontal,
  Pencil,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";
import type { ProjectOption, TaskListItem } from "@/lib/data/tasks";
import { updateTaskStatus } from "@/actions/tasks";
import { formatDate } from "@/lib/formatters";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { PriorityBadge } from "@/components/shared/status-badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
  TaskFormDialog,
  type EditableTask,
} from "@/components/tasks/task-form-dialog";
import { DeleteTaskDialog } from "@/components/tasks/delete-task-dialog";

interface TasksTableProps {
  tasks: TaskListItem[];
  projects: ProjectOption[];
  totalCount: number;
  currentPage: number;
  totalPages: number;
  hasActiveSearchOrFilter: boolean;
}

function isTaskOverdue(dueDate: Date | null, status: TaskStatus): boolean {
  if (!dueDate || status === "DONE") return false;
  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);
  return new Date(dueDate) < startOfToday;
}

export function TasksTable({
  tasks,
  projects,
  totalCount,
  currentPage,
  totalPages,
  hasActiveSearchOrFilter,
}: TasksTableProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [editingTask, setEditingTask] = useState<EditableTask | null>(null);
  const [deletingTask, setDeletingTask] = useState<{
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

  async function handleStatusChange(taskId: string, newStatus: TaskStatus) {
    setUpdatingId(taskId);
    try {
      const result = await updateTaskStatus(taskId, newStatus);
      if (result.error) {
        toast.error(result.error);
        return;
      }
      toast.success(
        newStatus === "DONE" ? "Task marked as done!" : "Task status updated."
      );
    } finally {
      setUpdatingId(null);
    }
  }

  if (tasks.length === 0) {
    return (
      <div className="rounded-lg border border-border bg-card p-12 text-center">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary mb-4">
          <CheckSquare className="h-6 w-6" />
        </div>
        <h3 className="text-base font-semibold">
          {hasActiveSearchOrFilter ? "No matching tasks found" : "No tasks yet"}
        </h3>
        <p className="text-sm text-muted-foreground max-w-sm mx-auto mt-1 mb-5">
          {hasActiveSearchOrFilter
            ? "Try adjusting your search or filter criteria."
            : "Create your first task to start tracking project deliverables."}
        </p>
        {!hasActiveSearchOrFilter && (
          <TaskFormDialog mode="create" projects={projects} />
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
              <TableHead>Task</TableHead>
              <TableHead>Project</TableHead>
              <TableHead>Priority</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Due Date</TableHead>
              <TableHead className="w-12" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {tasks.map((task) => {
              const overdue = isTaskOverdue(task.dueDate, task.status);
              return (
                <TableRow key={task.id}>
                  <TableCell>
                    <div className="space-y-0.5 max-w-xs">
                      <p
                        className={cn(
                          "font-medium",
                          task.status === "DONE" &&
                            "line-through text-muted-foreground"
                        )}
                      >
                        {task.title}
                      </p>
                      {task.description && (
                        <p className="text-xs text-muted-foreground truncate">
                          {task.description}
                        </p>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Link
                      href={`/projects/${task.projectId}`}
                      className="text-sm text-muted-foreground hover:text-foreground hover:underline"
                    >
                      {task.projectTitle}
                    </Link>
                  </TableCell>
                  <TableCell>
                    <PriorityBadge priority={task.priority} />
                  </TableCell>
                  <TableCell>
                    <Select
                      value={task.status}
                      onValueChange={(value) =>
                        handleStatusChange(task.id, value as TaskStatus)
                      }
                      disabled={updatingId === task.id}
                    >
                      <SelectTrigger className="w-[135px] h-8 text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="TODO">To Do</SelectItem>
                        <SelectItem value="IN_PROGRESS">In Progress</SelectItem>
                        <SelectItem value="DONE">Done</SelectItem>
                      </SelectContent>
                    </Select>
                  </TableCell>
                  <TableCell
                    className={cn(
                      "text-sm",
                      overdue
                        ? "text-destructive font-medium"
                        : "text-muted-foreground"
                    )}
                  >
                    {task.dueDate
                      ? formatDate(task.dueDate.toISOString())
                      : "—"}
                    {overdue && (
                      <span className="ml-1.5 text-[10px] uppercase font-semibold">
                        Overdue
                      </span>
                    )}
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem
                          onClick={() => setEditingTask(task)}
                          className="cursor-pointer"
                        >
                          <Pencil className="mr-2 h-4 w-4" />
                          Edit Task
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          onClick={() =>
                            setDeletingTask({ id: task.id, title: task.title })
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
              );
            })}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-1">
        <p className="text-xs text-muted-foreground">
          Showing page <span className="font-medium">{currentPage}</span> of{" "}
          <span className="font-medium">{totalPages}</span> ({totalCount}{" "}
          {totalCount === 1 ? "task" : "tasks"} total)
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

      {editingTask && (
        <TaskFormDialog
          mode="edit"
          projects={projects}
          task={editingTask}
          open={Boolean(editingTask)}
          onOpenChange={(open) => {
            if (!open) setEditingTask(null);
          }}
        />
      )}

      {deletingTask && (
        <DeleteTaskDialog
          taskId={deletingTask.id}
          taskTitle={deletingTask.title}
          open={Boolean(deletingTask)}
          onOpenChange={(open) => {
            if (!open) setDeletingTask(null);
          }}
        />
      )}
    </>
  );
}