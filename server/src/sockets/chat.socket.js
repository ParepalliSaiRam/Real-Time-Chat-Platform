import { sendMessage } from "../services/message.service.js";
import { getParticipantIds } from "../services/conversation.service.js";
import { requireParticipant } from "../utils/participant.js";
import { emitToUsers, getMessagePreview } from "../utils/broadcast.js";

export const registerChatHandlers = (io, socket) => {
  socket.on("join-conversation", async ({ conversationId }) => {
    try {
      await requireParticipant(
        conversationId,
        socket.user.id
      );

      socket.join(`conversation:${conversationId}`);

      socket.emit("joined-conversation", {
        conversationId,
      });
    } catch (error) {
      socket.emit("error-message", {
        message: error.message,
      });
    }
  });

  socket.on("leave-conversation", ({ conversationId }) => {
    socket.leave(`conversation:${conversationId}`);
  });

  socket.on("send-message", async ({ conversationId, content, replyToId }) => {
    try {
      const message = await sendMessage(
        conversationId,
        socket.user.id,
        content,
        replyToId
      );

      io.to(`conversation:${conversationId}`).emit(
        "new-message",
        message
      );

      const participantIds = await getParticipantIds(conversationId);

      emitToUsers(io, participantIds, "conversation-updated", {
        conversationId,
        lastMessage: getMessagePreview(message),
        lastMessageAt: message.createdAt,
        senderId: message.senderId,
      });
    } catch (error) {
      socket.emit("error-message", {
        message: error.message,
      });
    }
  });
};