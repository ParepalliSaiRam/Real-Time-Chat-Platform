import { z } from "zod";

export const sendFriendRequestSchema = z.object({
    receiverId: z.string().cuid()
});

export const acceptFriendRequestSchema = z.object({
    requestId: z.string().cuid()
});

export const rejectFriendRequestSchema = z.object({
    requestId: z.string().cuid()
});
