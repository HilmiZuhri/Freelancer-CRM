import { ProjectStatus, TaskStatus } from "@prisma/client";

export function calculateProjectProgress(
  status: ProjectStatus,
  tasks: { status: TaskStatus }[]
): number {
  if (tasks.length > 0) {
    const doneCount = tasks.filter((t) => t.status === "DONE").length;
    return Math.round((doneCount / tasks.length) * 100);
  }

  return status === "COMPLETED" ? 100 : 0;
}