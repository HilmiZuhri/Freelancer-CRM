import { ProjectStatus } from "@prisma/client";
import { z } from "zod";

export const projectSchema = z
  .object({
    title: z
      .string()
      .trim()
      .min(2, "Project title must be at least 2 characters.")
      .max(150, "Project title is too long."),
    clientId: z.string().min(1, "Please select a client."),
    description: z
      .string()
      .trim()
      .max(2000, "Description is too long.")
      .optional()
      .or(z.literal("")),
    status: z.nativeEnum(ProjectStatus),
    budget: z
      .number({ message: "Budget must be a valid number." })
      .min(0, "Budget cannot be negative.")
      .max(999999999, "Budget value is too large."),
    startDate: z.string().optional().or(z.literal("")),
    deadline: z.string().optional().or(z.literal("")),
  })
  .refine(
    (data) => {
      if (data.startDate && data.deadline) {
        return new Date(data.deadline) >= new Date(data.startDate);
      }
      return true;
    },
    {
      message: "Deadline cannot be earlier than start date.",
      path: ["deadline"],
    }
  );

export const projectStatusSchema = z.object({
  status: z.nativeEnum(ProjectStatus),
});

export type ProjectInput = z.infer<typeof projectSchema>;