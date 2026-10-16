import jwt from "jsonwebtoken";
import AppError from "../utils/AppError.js";
import prisma from "../config/prisma.js";
import asyncHandler from "../utils/asyncHandler.js";

const authMiddleware = asyncHandler(async (req, res, next) => {
    const authHeader = req.headers.authorization;

    const bearerToken =
        authHeader && authHeader.startsWith("Bearer ")
            ? authHeader.split(" ")[1]
            : null;

    const token = req.cookies?.accessToken || bearerToken;

    if (!token) {
        throw new AppError("Unauthorized", 401);
    }

    let decoded;

try {
    decoded = jwt.verify(
        token,
        process.env.JWT_SECRET
    );
} catch {
    throw new AppError("Invalid or expired token.", 401);
}

    const user = await prisma.user.findUnique({
        where: {
            id: decoded.userId
        },
        select: {
            id: true,
            username: true,
            email: true,
            phone: true,
            avatarUrl: true,
            bio: true
        }
    });

    if (!user) {
        throw new AppError("Unauthorized", 401);
    }

    req.user = user;

    next();
});

export default authMiddleware;
