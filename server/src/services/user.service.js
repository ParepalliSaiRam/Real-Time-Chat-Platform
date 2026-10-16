import prisma from "../config/prisma.js";
import storage from "../storage/index.js";
import AppError from "../utils/AppError.js";

export const searchUsers = async (query, currentUserId) => {

    const blocks = await prisma.block.findMany({
        where: {
            OR: [
                { blockerId: currentUserId },
                { blockedId: currentUserId }
            ]
        },
        select: {
            blockerId: true,
            blockedId: true
        }
    });

    const excludedIds = new Set([currentUserId]);

    blocks.forEach(block => {
        excludedIds.add(block.blockerId);
        excludedIds.add(block.blockedId);
    });

    return prisma.user.findMany({
        where: {
            username: {
                contains: query,
                mode: "insensitive"
            },
            id: {
                notIn: [...excludedIds]
            }
        },
        select: {
            id: true,
            username: true,
            email: true,
            avatarUrl: true
        },
        take: 10
    });
};

export const getCurrentUser = async (userId) => {

    return await prisma.user.findUnique({

        where: {
            id: userId
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

};

export const updateProfile = async (userId, profile) => {
    const { username, email, phone, bio } = profile;
    const data = Object.fromEntries(
        Object.entries({ username, email, phone, bio }).filter(([, value]) => value !== undefined)
    );

    if (Object.keys(data).length === 0) return getCurrentUser(userId);

    try {
        return await prisma.user.update({
            where: { id: userId },
            data,
            select: {
                id: true,
                username: true,
                email: true,
                phone: true,
                avatarUrl: true,
                bio: true
            }
        });
    } catch (error) {
        if (error.code === "P2002") {
            const target = Array.isArray(error.meta?.target)
                ? error.meta.target.join(" ")
                : String(error.meta?.target ?? "");
            const field = target.includes("phone")
                ? "Phone number"
                : target.includes("email")
                    ? "Email"
                    : "Username";
            throw new AppError(`${field} is already in use.`, 409);
        }
        throw error;
    }
};

export const updateAvatar = async (userId, file) => {

    const uploaded = await storage.upload(file);

    return prisma.user.update({
        where: {
            id: userId
        },
        data: {
            avatarUrl: uploaded.url
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

};
