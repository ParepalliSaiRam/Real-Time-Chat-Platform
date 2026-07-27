import prisma from "../config/prisma.js";
import AppError from "../utils/AppError.js";

export const sendFriendRequest = async (senderId, receiverId) => {
    if (senderId === receiverId) {
        throw new AppError("You cannot send a friend request to yourself.", 400);
    }
    
    const receiver = await prisma.user.findUnique({
        where: {
            id: receiverId
        }
    });

    if (!receiver) {
        throw new AppError("User not found.", 404);
    }

    const blocked = await prisma.block.findFirst({
        where: {
            OR: [
                { blockerId: senderId, blockedId: receiverId },
                { blockerId: receiverId, blockedId: senderId }
            ]
        }
    });

    if (blocked) {
        throw new AppError("You cannot send a friend request to this user.", 403);
    }

    const friendship = await prisma.friendship.findFirst({
        where: {
            OR: [
                {
                    user1Id: senderId,
                    user2Id: receiverId
                },
                {
                    user1Id: receiverId,
                    user2Id: senderId
                }
            ]
        }
    });

    if (friendship) {
        throw new AppError("You are already friends.", 409);
    }

    const existingRequest = await prisma.friendRequest.findFirst({
        where: {
            OR: [
                {
                    senderId,
                    receiverId
                },
                {
                    senderId: receiverId,
                    receiverId: senderId
                }
            ]
        }
    });

    if (existingRequest) {
        throw new AppError("A friend request already exists.", 409);
    }

    return prisma.friendRequest.create({
        data: {
            senderId,
            receiverId
        }
    });
};

export const getPendingRequests = async (userId) => {
    return prisma.friendRequest.findMany({
        where: {
            receiverId: userId,
            status: "PENDING"
        },
        include: {
            sender: {
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
};

export const acceptFriendRequest = async (requestId, userId) => {
    const request = await prisma.friendRequest.findUnique({
        where: {
            id: requestId
        }
    });

    if (!request) {
        throw new AppError("Friend request not found.", 404);
    }

    if (request.receiverId !== userId) {
        throw new AppError("Unauthorized.", 403);
    }

    if (request.status !== "PENDING") {
        throw new AppError("Request is no longer pending.", 400);
    }

    await prisma.$transaction(async (tx) => {

        const [user1Id, user2Id] =
            request.senderId < request.receiverId
                ? [request.senderId, request.receiverId]
                : [request.receiverId, request.senderId];

        await tx.friendship.create({
            data: {
                user1Id,
                user2Id
            }
        });

        await tx.friendRequest.delete({
            where: {
                id: request.id
            }
        });

    });
};

export const rejectFriendRequest = async (requestId, userId) => {

    const request = await prisma.friendRequest.findUnique({
        where: {
            id: requestId
        }
    });

    if (!request) {
        throw new AppError("Friend request not found.", 404);
    }

    if (request.receiverId !== userId) {
        throw new AppError("Unauthorized.", 403);
    }

    await prisma.friendRequest.delete({
        where: {
            id: requestId
        }
    });

};

export const getFriends = async (userId) => {
    const friendships = await prisma.friendship.findMany({
        where: {
            OR: [
                { user1Id: userId },
                { user2Id: userId }
            ]
        },
        include: {
            user1: {
                select: {
                    id: true,
                    username: true,

                    avatarUrl: true,
                    lastSeenAt: true
                }
            },
            user2: {
                select: {
                    id: true,
                    username: true,

                    avatarUrl: true,
                    lastSeenAt: true
                }
            }
        }
    });

    return friendships.map((friendship) => {
        return friendship.user1.id === userId
            ? friendship.user2
            : friendship.user1;
    });
};

export const getFriendIds = async (userId) => {

    const friendships = await prisma.friendship.findMany({
        where: {
            OR: [
                { user1Id: userId },
                { user2Id: userId }
            ]
        },
        select: {
            user1Id: true,
            user2Id: true
        }
    });

    return friendships.map(f => f.user1Id === userId ? f.user2Id : f.user1Id);

};

export const areFriends = async (userAId, userBId) => {

    const friendship = await prisma.friendship.findFirst({
        where: {
            OR: [
                { user1Id: userAId, user2Id: userBId },
                { user1Id: userBId, user2Id: userAId }
            ]
        }
    });

    return Boolean(friendship);

};