import http from "http";
import app from "./app.js";
import { initializeSocket } from "./sockets/index.js";
import prisma from "./config/prisma.js";

const server = http.createServer(app);

initializeSocket(server);

const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {

    console.log(
        `Server running on port ${PORT}`
    );

});

process.on("SIGINT", async () => {

    await prisma.$disconnect();

    process.exit(0);

});

process.on("SIGTERM", async () => {

    await prisma.$disconnect();

    process.exit(0);

});