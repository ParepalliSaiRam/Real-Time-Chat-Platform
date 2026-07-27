import { z } from "zod";

export const sendMessageSchema = z.object({

    content: z
        .string()
        .trim()
        .min(1)
        .max(2000),

    replyToId: z
        .string()
        .cuid()
        .optional()
        .nullable()

});

export const editMessageSchema = z.object({

    content: z
        .string()
        .trim()
        .min(1)
        .max(2000)

});

export const forwardMessagesSchema = z.object({

    messageIds: z
        .array(z.string().cuid())
        .min(1, "Select at least one message to forward."),

    targetConversationIds: z
        .array(z.string().cuid())
        .min(1, "Select at least one conversation to forward to.")

});

export const reactionSchema = z.object({

    emoji: z
        .string()
        .trim()
        .min(1, "Emoji is required.")
        .max(8, "Not a valid emoji.")

});