"use client";

import { useState } from "react";
import { TaskPriority, TaskStatus } from "@prisma/client";
import {
  CheckSquare,
  MoreHorizontal,
  Pencil,
  Plus,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";
import { updateTaskStatus } from "@/actions/tasks";
import type { ProjectOption } from "@/lib/data/tasks";
import { formatDate } from "@/lib/formatters";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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
import { PriorityBadge } from "@/components/shared/status-badge";
import {
  TaskFormDialog,
  type EditableTask,
} from "@/components/tasks/task-form-dialog";
import { DeleteTaskDialog } from "@/components/tasks/delete-task-dialog";

interface ProjectTaskItem {
  id: string;
  title: string;
  description: string | null;
  priority: TaskPriority;
  status: TaskStatus;
  dueDate: Date | null;
  projectId: string;
}

export function ProjectTasksCard({
  projectId,
  projectTitle,
  clientName,
  tasks,
}: {
  projectId: string;
  projectTitle: string;
  clientName: string;
  tasks: ProjectTaskItem[];
}) {
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [editingTask, setEditingTask] = useState<EditableTask | null>(null);
  const [deletingTask, setDeletingTask] = useState<{
    id: string;
    title: string;
  } | null>(null);

  const singleProjectOption: ProjectOption[] = [
    { id: projectId, title: projectTitle, clientName },
  ];

  async function handleStatusChange(taskId: string, newStatus: TaskStatus) {
    setUpdatingId(taskId);
    try {
      const result = await updateTaskStatus(taskId, newStatus);
      if (result.error) {
        toast.error(result.error);
        return;
      }
      toast.success(
        newStatus === "DONE" ? "Task completed! Progress updated." : "Task status updated."
      );
    } finally {
      setUpdatingId(null);
    }
  }

  return (
    <>
      <Card className="lg:col-span-8 shadow-xs">
        <CardHeader className="flex flex-row items-center justify-between gap-4">
          <div>
            <CardTitle className="text-base flex items-center gap-2">
              <CheckSquare className="h-4 w-4 text-primary" />
              Project Tasks
            </CardTitle>
            <CardDescription>
              Deliverables driving this project&apos;s completion progress
            </CardDescription>
          </div>
          <TaskFormDialog
            mode="create"
            projects={singleProjectOption}
            defaultProjectId={projectId}
            trigger={
              <Button size="sm" className="gap-1.5">
                <Plus className="h-4 w-4" />
                Add Task
              </Button>
            }
          />
        </CardHeader>

        <CardContent>
          {tasks.length === 0 ? (
            <div className="py-8 text-center text-sm text-muted-foreground border border-dashed border-border rounded-lg">
              No tasks in this project yet. Click &ldquo;Add Task&rdquo; to
              start tracking deliverables.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Task</TableHead>
                  <TableHead>Priority</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Due Date</TableHead>
                  <TableHead className="w-10" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {tasks.map((task) => (
                  <TableRow key={task.id}>
                    <TableCell>
                      <span
                        className={cn(
                          "font-medium",
                          task.status === "DONE" &&
                            "line-through text-muted-foreground"
                        )}
                      >
                        {task.title}
                      </span>
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
                        <SelectTrigger className="w-[130px] h-8 text-xs">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="TODO">To Do</SelectItem>
                          <SelectItem value="IN_PROGRESS">In Progress</SelectItem>
                          <SelectItem value="DONE">Done</SelectItem>
                        </SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {task.dueDate
                        ? formatDate(task.dueDate.toISOString())
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
                          <DropdownMenuItem
                            onClick={() => setEditingTask(task)}
                            className="cursor-pointer"
                          >
                            <Pencil className="mr-2 h-4 w-4" />
                            Edit
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
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {editingTask && (
        <TaskFormDialog
          mode="edit"
          projects={singleProjectOption}
          defaultProjectId={projectId}
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