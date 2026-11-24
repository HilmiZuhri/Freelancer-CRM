"use server";

import { revalidatePath } from "next/cache";
import { ProjectStatus } from "@prisma/client";
import { requireAuth } from "@/lib/auth-utils";
import { prisma } from "@/lib/prisma";
import {
  ProjectInput,
  projectSchema,
  projectStatusSchema,
} from "@/validations/project";

function parseDateInput(dateString?: string): Date | null {
  if (!dateString) return null;
  return new Date(`${dateString}T00:00:00.000Z`);
}

export async function createProject(values: ProjectInput) {
  const { userId } = await requireAuth();

  const parsed = projectSchema.safeParse(values);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid project data." };
  }

  const { title, clientId, description, status, budget, startDate, deadline } =
    parsed.data;

  try {
    // Verify the selected client belongs to the authenticated user
    const client = await prisma.client.findFirst({
      where: { id: clientId, userId },
      select: { id: true, name: true },
    });

    if (!client) {
      return { error: "Selected client was not found or is unauthorized." };
    }

    const created = await prisma.$transaction(async (tx) => {
      const project = await tx.project.create({
        data: {
          userId,
          clientId: client.id,
          title,
          description: description || null,
          status,
          budget,
          startDate: parseDateInput(startDate),
          deadline: parseDateInput(deadline),
        },
      });

      await tx.activityLog.create({
        data: {
          userId,
          action: "Project created",
          entityType: "PROJECT",
          entityId: project.id,
          description: `${title} (${client.name})`,
        },
      });

      return project;
    });

    revalidatePath("/projects");
    revalidatePath(`/clients/${clientId}`);
    revalidatePath("/dashboard");
    revalidatePath("/activity");

    return { success: true, data: { id: created.id } };
  } catch (error) {
    console.error("Create project error:", error);
    return { error: "Failed to create project. Please try again." };
  }
}

export async function updateProject(projectId: string, values: ProjectInput) {
  const { userId } = await requireAuth();

  const parsed = projectSchema.safeParse(values);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid project data." };
  }

  const { title, clientId, description, status, budget, startDate, deadline } =
    parsed.data;

  try {
    const [existingProject, ownedClient] = await Promise.all([
      prisma.project.findFirst({
        where: { id: projectId, userId },
        select: { id: true, clientId: true },
      }),
      prisma.client.findFirst({
        where: { id: clientId, userId },
        select: { id: true, name: true },
      }),
    ]);

    if (!existingProject) {
      return { error: "Project not found or unauthorized." };
    }

    if (!ownedClient) {
      return { error: "Selected client was not found or is unauthorized." };
    }

    await prisma.$transaction(async (tx) => {
      await tx.project.update({
        where: { id: projectId },
        data: {
          clientId: ownedClient.id,
          title,
          description: description || null,
          status,
          budget,
          startDate: parseDateInput(startDate),
          deadline: parseDateInput(deadline),
        },
      });

      await tx.activityLog.create({
        data: {
          userId,
          action: "Project updated",
          entityType: "PROJECT",
          entityId: projectId,
          description: title,
        },
      });
    });

    revalidatePath("/projects");
    revalidatePath(`/projects/${projectId}`);
    revalidatePath(`/clients/${existingProject.clientId}`);
    revalidatePath(`/clients/${clientId}`);
    revalidatePath("/dashboard");

    return { success: true };
  } catch (error) {
    console.error("Update project error:", error);
    return { error: "Failed to update project. Please try again." };
  }
}

export async function updateProjectStatus(
  projectId: string,
  status: ProjectStatus
) {
  const { userId } = await requireAuth();

  const parsed = projectStatusSchema.safeParse({ status });
  if (!parsed.success) {
    return { error: "Invalid project status." };
  }

  try {
    const existing = await prisma.project.findFirst({
      where: { id: projectId, userId },
      select: { id: true, title: true, clientId: true },
    });

    if (!existing) {
      return { error: "Project not found or unauthorized." };
    }

    await prisma.$transaction(async (tx) => {
      await tx.project.update({
        where: { id: projectId },
        data: { status: parsed.data.status },
      });

      await tx.activityLog.create({
        data: {
          userId,
          action: "Project status updated",
          entityType: "PROJECT",
          entityId: projectId,
          description: `${existing.title} → ${parsed.data.status.replace("_", " ")}`,
        },
      });
    });

    revalidatePath("/projects");
    revalidatePath(`/projects/${projectId}`);
    revalidatePath(`/clients/${existing.clientId}`);
    revalidatePath("/dashboard");

    return { success: true };
  } catch (error) {
    console.error("Update project status error:", error);
    return { error: "Failed to update project status." };
  }
}

export async function deleteProject(projectId: string) {
  const { userId } = await requireAuth();

  try {
    const existing = await prisma.project.findFirst({
      where: { id: projectId, userId },
      select: { id: true, title: true, clientId: true },
    });

    if (!existing) {
      return { error: "Project not found or unauthorized." };
    }

    await prisma.$transaction(async (tx) => {
      await tx.project.delete({
        where: { id: projectId },
      });

      await tx.activityLog.create({
        data: {
          userId,
          action: "Project deleted",
          entityType: "PROJECT",
          entityId: projectId,
          description: existing.title,
        },
      });
    });

    revalidatePath("/projects");
    revalidatePath(`/clients/${existing.clientId}`);
    revalidatePath("/dashboard");
    revalidatePath("/invoices");

    return { success: true };
  } catch (error) {
    console.error("Delete project error:", error);
    return { error: "Failed to delete project. Please try again." };
  }
}