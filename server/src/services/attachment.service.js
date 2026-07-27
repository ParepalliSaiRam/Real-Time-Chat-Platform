import prisma from "../config/prisma.js";
import AppError from "../utils/AppError.js";
import storage from "../storage/index.js";
import { requireActiveParticipant, assertGroupMessagingAllowed } from "../utils/participant.js";
import { assertConversationNotBlocked } from "./block.service.js";

export const uploadAttachment = async (
    conversationId,
    senderId,
    file,
    caption
) => {

    await requireActiveParticipant(
    conversationId,
    senderId
);

    await assertConversationNotBlocked(conversationId, senderId);
    await assertGroupMessagingAllowed(conversationId, senderId);

    const trimmedCaption = caption?.trim().slice(0, 2000) || null;

    return prisma.$transaction(async (tx) => {

        const message = await tx.message.create({
    data: {
        conversationId,
        senderId,
        content: trimmedCaption,
        type: file.mimetype.startsWith("image/")
            ? "IMAGE"
            : "FILE"
    },

    include: {
        sender: {
            select: {
                id: true,
                username: true,

                avatarUrl: true
            }
        },

        reads: {
            select: {
                userId: true
            }
        }
    }
});

        const uploaded = await storage.upload(file);
        const attachment =
            await tx.attachment.create({

                data: {

                    messageId: message.id,

                    fileName: uploaded.fileName,

                    mimeType: uploaded.mimeType,

                    size: uploaded.size,

                    url: uploaded.url

                }

            });

        await tx.conversation.update({

            where: {
                id: conversationId
            },

            data: {
                lastMessageAt: new Date()
            }

        });

        return {
    ...message,
    attachment
};

    });

};