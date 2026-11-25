import { TaskPriority, TaskStatus } from "@prisma/client";
import { z } from "zod";

export const taskSchema = z.object({
  title: z
    .string()
    .trim()
    .min(2, "Task title must be at least 2 characters.")
    .max(150, "Task title is too long."),
  projectId: z.string().min(1, "Please select a project."),
  description: z
    .string()
    .trim()
    .max(2000, "Description is too long.")
    .optional()
    .or(z.literal("")),
  priority: z.nativeEnum(TaskPriority),
  status: z.nativeEnum(TaskStatus),
  dueDate: z.string().optional().or(z.literal("")),
});

export const taskStatusSchema = z.object({
  status: z.nativeEnum(TaskStatus),
});

export type TaskInput = z.infer<typeof taskSchema>;