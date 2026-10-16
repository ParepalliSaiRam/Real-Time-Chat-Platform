import { z } from "zod";

export const createStatusSchema = z.object({

    type: z.enum(["TEXT", "IMAGE"]),

    audience: z.enum(["FRIENDS", "ONLY_ME"]).default("FRIENDS"),

    content: z
        .string()
        .trim()
        .max(700, "Status text cannot exceed 700 characters.")
        .optional(),

    backgroundColor: z
        .string()
        .trim()
        .max(20)
        .optional()

});
