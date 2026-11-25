import { Prisma, TaskPriority, TaskStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";

export const TASKS_PAGE_SIZE = 6;

export interface TaskListItem {
  id: string;
  title: string;
  description: string | null;
  priority: TaskPriority;
  status: TaskStatus;
  dueDate: Date | null;
  projectId: string;
  projectTitle: string;
  clientId: string;
  clientName: string;
  createdAt: Date;
}

export interface ProjectOption {
  id: string;
  title: string;
  clientName: string;
}

interface GetTasksParams {
  userId: string;
  search?: string;
  status?: string;
  priority?: string;
  projectId?: string;
  page?: number;
}

export async function getProjectOptions(
  userId: string
): Promise<ProjectOption[]> {
  const projects = await prisma.project.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      title: true,
      client: {
        select: { name: true },
      },
    },
  });

  return projects.map((p) => ({
    id: p.id,
    title: p.title,
    clientName: p.client.name,
  }));
}

export async function getTasks({
  userId,
  search = "",
  status = "ALL",
  priority = "ALL",
  projectId = "ALL",
  page = 1,
}: GetTasksParams) {
  const safePage = Number.isFinite(page) && page > 0 ? Math.floor(page) : 1;
  const trimmedSearch = search.trim();

  const where: Prisma.TaskWhereInput = {
    userId,
  };

  if (trimmedSearch) {
    where.OR = [
      { title: { contains: trimmedSearch, mode: "insensitive" } },
      { description: { contains: trimmedSearch, mode: "insensitive" } },
      { project: { title: { contains: trimmedSearch, mode: "insensitive" } } },
    ];
  }

  if (
    status !== "ALL" &&
    Object.values(TaskStatus).includes(status as TaskStatus)
  ) {
    where.status = status as TaskStatus;
  }

  if (
    priority !== "ALL" &&
    Object.values(TaskPriority).includes(priority as TaskPriority)
  ) {
    where.priority = priority as TaskPriority;
  }

  if (projectId !== "ALL") {
    where.projectId = projectId;
  }

  const [totalCount, rawTasks] = await Promise.all([
    prisma.task.count({ where }),
    prisma.task.findMany({
      where,
      orderBy: [{ status: "asc" }, { dueDate: "asc" }, { createdAt: "desc" }],
      skip: (safePage - 1) * TASKS_PAGE_SIZE,
      take: TASKS_PAGE_SIZE,
      include: {
        project: {
          select: {
            id: true,
            title: true,
            client: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
      },
    }),
  ]);

  const tasks: TaskListItem[] = rawTasks.map((task) => ({
    id: task.id,
    title: task.title,
    description: task.description,
    priority: task.priority,
    status: task.status,
    dueDate: task.dueDate,
    projectId: task.project.id,
    projectTitle: task.project.title,
    clientId: task.project.client.id,
    clientName: task.project.client.name,
    createdAt: task.createdAt,
  }));

  const totalPages = Math.max(1, Math.ceil(totalCount / TASKS_PAGE_SIZE));

  return {
    tasks,
    totalCount,
    totalPages,
    currentPage: safePage,
  };
}