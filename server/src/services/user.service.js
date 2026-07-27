import prisma from "../config/prisma.js";
import storage from "../storage/index.js";

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
            avatarUrl: true,
            bio: true
        }

    });

};

export const updateProfile = async (userId, { bio }) => {

    return prisma.user.update({
        where: {
            id: userId
        },
        data: {
            bio
        },
        select: {
            id: true,
            username: true,
            email: true,
            avatarUrl: true,
            bio: true
        }
    });

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
            avatarUrl: true,
            bio: true
        }
    });

};