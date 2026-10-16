import asyncHandler from "../utils/asyncHandler.js";
import { uploadAttachment } from "../services/attachment.service.js";
import { getParticipantIds } from "../services/conversation.service.js";
import { getIO } from "../sockets/index.js";
import { emitToUsers, getMessagePreview } from "../utils/broadcast.js";
import AppError from "../utils/AppError.js";
import { notifyConversationPush } from "../services/push.service.js";

export const uploadAttachmentController =
asyncHandler(async (req, res) => {

    if (!req.file) {

        throw new AppError(
    "No file uploaded.",
    400
);

    }

    const message =
        await uploadAttachment(

            req.params.conversationId,

            req.user.id,

            req.file,

            req.body.caption

        );

    getIO()
        .to(`conversation:${req.params.conversationId}`)
        .emit("new-message", message);

    const participantIds =
        await getParticipantIds(req.params.conversationId);

    void notifyConversationPush(req.params.conversationId, req.user.id, message);

    emitToUsers(
        getIO(),
        participantIds,
        "conversation-updated",
        {
            conversationId: req.params.conversationId,
            lastMessage: getMessagePreview(message),
            lastMessageAt: message.createdAt,
            senderId: message.senderId
        }
    );

    res.status(201).json({

        success: true,

        message

    });

});
