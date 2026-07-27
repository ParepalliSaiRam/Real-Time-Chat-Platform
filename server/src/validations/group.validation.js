import { z } from "zod";

export const createGroupSchema = z.object({

    name: z
        .string()
        .trim()
        .min(3, "Group name must be at least 3 characters.")
        .max(100, "Group name cannot exceed 100 characters."),

    members: z
        .array(z.string().cuid())
        .min(1, "Select at least one member.")

});

export const renameGroupSchema = z.object({

    name: z
        .string()
        .trim()
        .min(3)
        .max(100)

});

export const updateDescriptionSchema = z.object({

    description: z
        .string()
        .trim()
        .max(500, "Description cannot exceed 500 characters.")
        .optional()

});

export const addMembersSchema = z.object({

    members: z
        .array(z.string().cuid())
        .min(1, "Select at least one member.")

});

export const adminActionSchema = z.object({

    userId: z
        .string()
        .min(1, "userId is required.")

});

export const updateGroupSettingsSchema = z.object({

    onlyAdminsCanEditInfo: z.boolean().optional(),

    onlyAdminsCanMessage: z.boolean().optional()

});