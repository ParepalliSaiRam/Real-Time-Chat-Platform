import prisma from "../config/prisma.js";
import onlineUsers from "./presence.store.js";

export const registerPresenceHandlers = (io, socket) => {

    const userId = socket.user.id;

    if (!onlineUsers.has(userId)) {
        onlineUsers.set(userId, new Set());
    }

    const sockets = onlineUsers.get(userId);

    const wasOffline = sockets.size === 0;

    sockets.add(socket.id);

    if (wasOffline) {
        io.emit("user-online", {
    userId,
    username: socket.user.username
});
    }

    socket.on("get-online-users", () => {
        socket.emit(
            "online-users",
            [...onlineUsers.keys()]
        );
    });

    socket.on("disconnect", async () => {

        console.log(`Disconnected: ${socket.user.username}`);

        const sockets = onlineUsers.get(userId);

        if (!sockets) return;

        sockets.delete(socket.id);

        if (sockets.size === 0) {

            onlineUsers.delete(userId);

            const lastSeenAt = new Date();

            try {
                await prisma.user.update({
                    where: { id: userId },
                    data: { lastSeenAt }
                });
            } catch (error) {
                console.error("Failed to record lastSeenAt:", error.message);
            }

            io.emit("user-offline", {
    userId,
    username: socket.user.username,
    lastSeenAt
});

        }

    });

};