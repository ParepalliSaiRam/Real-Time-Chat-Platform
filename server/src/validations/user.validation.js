import { z } from "zod";

export const updateProfileSchema = z.object({
    username: z.string().trim().min(3).max(30).regex(/^[a-zA-Z0-9_.-]+$/, "Username may contain letters, numbers, dots, dashes, and underscores.").optional(),
    email: z.string().trim().email().max(254).transform((value) => value.toLowerCase()).optional(),
    phone: z.string().trim().min(7).max(25).regex(/^\+?[0-9][0-9\s().-]*$/, "Enter a valid phone number.").optional(),
    bio: z
        .string()
        .trim()
        .max(150, "Bio cannot exceed 150 characters.")
        .optional()
}).refine((data) => data.phone === undefined || data.phone.length > 0, {
    message: "Phone number is required.",
    path: ["phone"]
});
