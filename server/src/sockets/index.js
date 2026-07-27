import { Server } from "socket.io";
import jwt from "jsonwebtoken";
import prisma from "../config/prisma.js";

import { registerChatHandlers } from "./chat.socket.js";
import { registerPresenceHandlers } from "./presence.socket.js";
import { registerTypingHandlers } from "./typing.socket.js";
import { registerReadHandlers } from "./read.socket.js";

let io;

export const initializeSocket = (server) => {

    io = new Server(server, {
        cors: {
            origin: process.env.CLIENT_URL,
            credentials: true
        }
    });

    io.use(async (socket, next) => {

        try {

            const token = socket.handshake.auth.token;

            if (!token) {
                return next(new Error("Unauthorized"));
            }

            const payload = jwt.verify(
                token,
                process.env.JWT_SECRET
            );

            const user = await prisma.user.findUnique({
                where: {
                    id: payload.userId
                },
                select: {
                    id: true,
                    username: true,

                    avatarUrl: true
                }

            });

            if (!user) {
                return next(new Error("Unauthorized"));
            }

            socket.user = user;

            next();

        } catch (error) {

            next(new Error("Unauthorized"));

        }

    });

    io.on("connection", (socket) => {

        console.log(`Connected: ${socket.user.username}`);

        socket.join(`user:${socket.user.id}`);

        registerPresenceHandlers(io, socket);

        registerChatHandlers(io, socket);

        registerTypingHandlers(io, socket);

        registerReadHandlers(io, socket);

    });

};

export const getIO = () => io;