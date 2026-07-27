import prisma from "../config/prisma.js";
import AppError from "../utils/AppError.js";

export const blockUser = async (blockerId, blockedId) => {

    if (blockerId === blockedId) {
        throw new AppError("You cannot block yourself.", 400);
    }

    const blockedUser = await prisma.user.findUnique({
        where: {
            id: blockedId
        }
    });

    if (!blockedUser) {
        throw new AppError("User not found.", 404);
    }

    await prisma.block.upsert({
        where: {
            blockerId_blockedId: {
                blockerId,
                blockedId
            }
        },
        create: {
            blockerId,
            blockedId
        },
        update: {}
    });

};

export const unblockUser = async (blockerId, blockedId) => {

    await prisma.block.deleteMany({
        where: {
            blockerId,
            blockedId
        }
    });

};

export const getBlockedUsers = async (blockerId) => {

    const blocks = await prisma.block.findMany({
        where: {
            blockerId
        },
        include: {
            blocked: {
                select: {
                    id: true,
                    username: true,
                    avatarUrl: true
                }
            }
        },
        orderBy: {
            createdAt: "desc"
        }
    });

    return blocks.map(block => block.blocked);

};

export const isBlockedEitherWay = async (userAId, userBId) => {

    const block = await prisma.block.findFirst({
        where: {
            OR: [
                { blockerId: userAId, blockedId: userBId },
                { blockerId: userBId, blockedId: userAId }
            ]
        }
    });

    return Boolean(block);

};

export const assertConversationNotBlocked = async (conversationId, senderId) => {

    const conversation = await prisma.conversation.findUnique({
        where: {
            id: conversationId
        },
        select: {
            isGroup: true,
            participants: {
                where: {
                    userId: {
                        not: senderId
                    }
                },
                select: {
                    userId: true
                }
            }
        }
    });

    if (!conversation || conversation.isGroup) return;

    const otherUserId = conversation.participants[0]?.userId;

    if (!otherUserId) return;

    const blocked = await isBlockedEitherWay(senderId, otherUserId);

    if (blocked) {
        throw new AppError("You cannot send messages to this user.", 403);
    }

};
