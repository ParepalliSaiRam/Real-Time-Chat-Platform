import { requireActiveParticipant } from "../utils/participant.js";

export const registerTypingHandlers = (io, socket) => {

    socket.on("typing-start", async ({ conversationId }) => {

        try {
            await requireActiveParticipant(
                conversationId,
                socket.user.id
            );

            socket.to(`conversation:${conversationId}`).emit(
                "typing-start",
                {
                    conversationId,
                    userId: socket.user.id,
                    username: socket.user.username
                }
            );
        } catch (error) {
            socket.emit("error-message", {
                message: error.message
            });
        }

    });

    socket.on("typing-stop", async ({ conversationId }) => {

        try {
            await requireActiveParticipant(
                conversationId,
                socket.user.id
            );

            socket.to(`conversation:${conversationId}`).emit(
                "typing-stop",
                {
                    conversationId,
                    userId: socket.user.id
                }
            );
        } catch (error) {
            socket.emit("error-message", {
                message: error.message
            });
        }

    });

};