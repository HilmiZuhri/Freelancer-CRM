"use server";

import { revalidatePath } from "next/cache";
import { TaskStatus } from "@prisma/client";
import { requireAuth } from "@/lib/auth-utils";
import { prisma } from "@/lib/prisma";
import { TaskInput, taskSchema, taskStatusSchema } from "@/validations/task";

function parseDateInput(dateString?: string): Date | null {
  if (!dateString) return null;
  return new Date(`${dateString}T00:00:00.000Z`);
}

export async function createTask(values: TaskInput) {
  const { userId } = await requireAuth();

  const parsed = taskSchema.safeParse(values);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid task data." };
  }

  const { title, projectId, description, priority, status, dueDate } =
    parsed.data;

  try {
    // Authorization: ensure the project belongs to the authenticated user
    const project = await prisma.project.findFirst({
      where: { id: projectId, userId },
      select: { id: true, title: true, clientId: true },
    });

    if (!project) {
      return { error: "Selected project was not found or is unauthorized." };
    }

    const created = await prisma.$transaction(async (tx) => {
      const task = await tx.task.create({
        data: {
          userId,
          projectId: project.id,
          title,
          description: description || null,
          priority,
          status,
          dueDate: parseDateInput(dueDate),
        },
      });

      await tx.activityLog.create({
        data: {
          userId,
          action: status === "DONE" ? "Task completed" : "Task created",
          entityType: "TASK",
          entityId: task.id,
          description: `${title} in ${project.title}`,
        },
      });

      return task;
    });

    revalidatePath("/tasks");
    revalidatePath("/projects");
    revalidatePath(`/projects/${project.id}`);
    revalidatePath(`/clients/${project.clientId}`);
    revalidatePath("/dashboard");
    revalidatePath("/activity");

    return { success: true, data: { id: created.id } };
  } catch (error) {
    console.error("Create task error:", error);
    return { error: "Failed to create task. Please try again." };
  }
}

export async function updateTask(taskId: string, values: TaskInput) {
  const { userId } = await requireAuth();

  const parsed = taskSchema.safeParse(values);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid task data." };
  }

  const { title, projectId, description, priority, status, dueDate } =
    parsed.data;

  try {
    const [existingTask, targetProject] = await Promise.all([
      prisma.task.findFirst({
        where: { id: taskId, userId },
        select: {
          id: true,
          status: true,
          projectId: true,
          project: { select: { clientId: true } },
        },
      }),
      prisma.project.findFirst({
        where: { id: projectId, userId },
        select: { id: true, title: true, clientId: true },
      }),
    ]);

    if (!existingTask) {
      return { error: "Task not found or unauthorized." };
    }

    if (!targetProject) {
      return { error: "Selected project was not found or is unauthorized." };
    }

    const becameDone = existingTask.status !== "DONE" && status === "DONE";

    await prisma.$transaction(async (tx) => {
      await tx.task.update({
        where: { id: taskId },
        data: {
          projectId: targetProject.id,
          title,
          description: description || null,
          priority,
          status,
          dueDate: parseDateInput(dueDate),
        },
      });

      await tx.activityLog.create({
        data: {
          userId,
          action: becameDone ? "Task completed" : "Task updated",
          entityType: "TASK",
          entityId: taskId,
          description: `${title} in ${targetProject.title}`,
        },
      });
    });

    revalidatePath("/tasks");
    revalidatePath("/projects");
    revalidatePath(`/projects/${existingTask.projectId}`);
    revalidatePath(`/projects/${targetProject.id}`);
    revalidatePath(`/clients/${existingTask.project.clientId}`);
    revalidatePath(`/clients/${targetProject.clientId}`);
    revalidatePath("/dashboard");
    revalidatePath("/activity");

    return { success: true };
  } catch (error) {
    console.error("Update task error:", error);
    return { error: "Failed to update task. Please try again." };
  }
}

export async function updateTaskStatus(taskId: string, status: TaskStatus) {
  const { userId } = await requireAuth();

  const parsed = taskStatusSchema.safeParse({ status });
  if (!parsed.success) {
    return { error: "Invalid task status." };
  }

  try {
    const existing = await prisma.task.findFirst({
      where: { id: taskId, userId },
      select: {
        id: true,
        title: true,
        status: true,
        projectId: true,
        project: { select: { title: true, clientId: true } },
      },
    });

    if (!existing) {
      return { error: "Task not found or unauthorized." };
    }

    if (existing.status === parsed.data.status) {
      return { success: true };
    }

    const becameDone = parsed.data.status === "DONE";

    await prisma.$transaction(async (tx) => {
      await tx.task.update({
        where: { id: taskId },
        data: { status: parsed.data.status },
      });

      await tx.activityLog.create({
        data: {
          userId,
          action: becameDone ? "Task completed" : "Task status updated",
          entityType: "TASK",
          entityId: taskId,
          description: `${existing.title} in ${existing.project.title}`,
        },
      });
    });

    revalidatePath("/tasks");
    revalidatePath("/projects");
    revalidatePath(`/projects/${existing.projectId}`);
    revalidatePath(`/clients/${existing.project.clientId}`);
    revalidatePath("/dashboard");
    revalidatePath("/activity");

    return { success: true };
  } catch (error) {
    console.error("Update task status error:", error);
    return { error: "Failed to update task status." };
  }
}

export async function deleteTask(taskId: string) {
  const { userId } = await requireAuth();

  try {
    const existing = await prisma.task.findFirst({
      where: { id: taskId, userId },
      select: {
        id: true,
        title: true,
        projectId: true,
        project: { select: { title: true, clientId: true } },
      },
    });

    if (!existing) {
      return { error: "Task not found or unauthorized." };
    }

    await prisma.$transaction(async (tx) => {
      await tx.task.delete({
        where: { id: taskId },
      });

      await tx.activityLog.create({
        data: {
          userId,
          action: "Task deleted",
          entityType: "TASK",
          entityId: taskId,
          description: `${existing.title} (${existing.project.title})`,
        },
      });
    });

    revalidatePath("/tasks");
    revalidatePath("/projects");
    revalidatePath(`/projects/${existing.projectId}`);
    revalidatePath(`/clients/${existing.project.clientId}`);
    revalidatePath("/dashboard");

    return { success: true };
  } catch (error) {
    console.error("Delete task error:", error);
    return { error: "Failed to delete task. Please try again." };
  }
}