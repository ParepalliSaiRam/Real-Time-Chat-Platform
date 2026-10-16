import { z } from "zod";

export const createConversationSchema = z.object({
    userId: z.string().cuid()
});

export const muteConversationSchema = z.object({
    duration: z.enum(["off", "1h", "8h", "1w", "forever"])
});
