import { z } from "zod";

export const updateProfileSchema = z.object({

    bio: z
        .string()
        .trim()
        .max(150, "Bio cannot exceed 150 characters.")
        .optional()

});
