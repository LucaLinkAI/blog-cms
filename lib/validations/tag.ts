import { z } from "zod";

export const CreateTagSchema = z.object({
  name: z.string().min(1).max(60),
  slug: z
    .string()
    .min(1)
    .max(60)
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Slug must be lowercase alphanumeric with hyphens"),
});

export type CreateTagInput = z.infer<typeof CreateTagSchema>;
