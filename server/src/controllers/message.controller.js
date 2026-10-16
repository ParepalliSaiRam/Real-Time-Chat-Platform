import asyncHandler from "../utils/asyncHandler.js";
import {
    getMessages,
    getMessagesAround,
    searchMessages,
    searchMessagesAcrossConversations,
    sendMessage,
    editMessage,
    deleteMessage,
    deleteForMe,
    forwardMessages,
    toggleReaction
} from "../services/message.service.js";
import { getParticipantIds } from "../services/conversation.service.js";
import { getIO } from "../sockets/index.js";
import { emitToUsers, getMessagePreview } from "../utils/broadcast.js";
import { notifyConversationPush } from "../services/push.service.js";

export const getMessagesController =
asyncHandler(async (req, res) => {

    const cursor =
        req.query.cursor || null;

    const limit =
        Number(req.query.limit) || 30;

    const result =
        await getMessages(
            req.params.conversationId,
            req.user.id,
            cursor,
            limit
        );

    res.json({

        success: true,

        ...result

    });

});

export const getMessagesAroundController =
asyncHandler(async (req, res) => {

    const result =
        await getMessagesAround(
            req.params.conversationId,
            req.user.id,
            req.params.messageId
        );

    res.json({

        success: true,

        ...result

    });

});

export const searchMessagesController =
asyncHandler(async (req, res) => {

    const result =
        await searchMessages(
            req.params.conversationId,
            req.user.id,
            req.query.query || ""
        );

    res.json({

        success: true,

        ...result

    });

});

export const searchAllMessagesController = asyncHandler(async (req, res) => {
    const result = await searchMessagesAcrossConversations(
        req.user.id,
        req.query.query || ""
    );

    res.json({
        success: true,
        ...result
    });
});

export const sendMessageController =
asyncHandler(async (req, res) => {

    const message =
        await sendMessage(

            req.params.conversationId,

            req.user.id,

            req.body.content,

            req.body.replyToId

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

export const editMessageController =
asyncHandler(async (req, res) => {

    const message =
        await editMessage(

            req.params.messageId,

            req.user.id,

            req.body.content

        );

    getIO()
        .to(`conversation:${message.conversationId}`)
        .emit("message-edited", message);

    res.json({

        success: true,

        message

    });

});

export const deleteMessageController =
asyncHandler(async (req, res) => {

    const message =
        await deleteMessage(

            req.params.messageId,

            req.user.id

        );

    getIO()
        .to(`conversation:${message.conversationId}`)
        .emit("message-deleted", {

            conversationId: message.conversationId,

            messageId: message.id

        });

    res.json({

        success: true,

        message: "Message deleted successfully."

    });

});

export const deleteForMeController =
asyncHandler(async (req, res) => {

    await deleteForMe(

        req.params.messageId,

        req.user.id

    );

    emitToUsers(getIO(), [req.user.id], "message-deleted-for-me", {

        messageId: req.params.messageId

    });

    res.json({

        success: true,

        message: "Message deleted for you."

    });

});

export const forwardMessagesController =
asyncHandler(async (req, res) => {

    const results =
        await forwardMessages(

            req.user.id,

            req.body.messageIds,

            req.body.targetConversationIds

        );

    const io = getIO();

    const byConversation = new Map();

    for (const { conversationId, message } of results) {
        if (!byConversation.has(conversationId)) {
            byConversation.set(conversationId, []);
        }
        byConversation.get(conversationId).push(message);
    }

    for (const [conversationId, messages] of byConversation) {

        for (const message of messages) {
            io.to(`conversation:${conversationId}`).emit("new-message", message);
        }

        const lastMessage = messages[messages.length - 1];

        void notifyConversationPush(conversationId, req.user.id, lastMessage);

        const participantIds = await getParticipantIds(conversationId);

        emitToUsers(io, participantIds, "conversation-updated", {
            conversationId,
            lastMessage: getMessagePreview(lastMessage),
            lastMessageAt: lastMessage.createdAt,
            senderId: lastMessage.senderId
        });

    }

    res.status(201).json({

        success: true,

        forwarded: results.length

    });

});

export const toggleReactionController =
asyncHandler(async (req, res) => {

    const result =
        await toggleReaction(

            req.params.messageId,

            req.user.id,

            req.body.emoji

        );

    getIO()
        .to(`conversation:${result.conversationId}`)
        .emit("message-reaction-updated", {

            messageId: result.messageId,

            reactions: result.reactions

        });

    res.json({

        success: true,

        reactions: result.reactions

    });

});
