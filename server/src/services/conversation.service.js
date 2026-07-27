import prisma from "../config/prisma.js";
import AppError from "../utils/AppError.js";
import { getMessagePreview } from "../utils/broadcast.js";
import { requireParticipant } from "../utils/participant.js";

export const createConversation = async (currentUserId, otherUserId) => {

    if (currentUserId === otherUserId) {
        throw new AppError("You cannot chat with yourself.", 400);
    }

    const otherUser = await prisma.user.findUnique({
        where: {
            id: otherUserId
        }
    });

    if (!otherUser) {
        throw new AppError("User not found.", 404);
    }

    const friendship = await prisma.friendship.findFirst({
        where: {
            OR: [
                {
                    user1Id: currentUserId,
                    user2Id: otherUserId
                },
                {
                    user1Id: otherUserId,
                    user2Id: currentUserId
                }
            ]
        }
    });

    if (!friendship) {
        throw new AppError("You can only chat with friends.", 403);
    }

    const existingConversation = await prisma.conversation.findFirst({
        where: {
            isGroup: false,

            AND: [
                {
                    participants: {
                        some: {
                            userId: currentUserId
                        }
                    }
                },
                {
                    participants: {
                        some: {
                            userId: otherUserId
                        }
                    }
                }
            ]
        },
        include: {
            participants: true
        }
    });

    if (existingConversation) {
        return existingConversation;
    }

    return prisma.$transaction(async (tx) => {

        const conversation = await tx.conversation.create({
            data: {
                isGroup: false
            }
        });

        await tx.conversationParticipant.createMany({
            data: [
                {
                    conversationId: conversation.id,
                    userId: currentUserId
                },
                {
                    conversationId: conversation.id,
                    userId: otherUserId
                }
            ]
        });

        return conversation;

    });
};

export const getConversations = async (userId) => {

    const conversations = await prisma.conversation.findMany({

        where: {
            participants: {
                some: {
                    userId
                }
            }
        },

        include: {

            participants: {
                include: {
                    user: {
                        select: {
                            id: true,
                            username: true,

                            avatarUrl: true,
                            bio: true,
                            lastSeenAt: true
                        }
                    }
                }
            },

            messages: {
                orderBy: {
                    createdAt: "desc"
                },
                take: 1,
                include: {
                    sender: {
                        select: {
                            id: true,
                            username: true,

                            avatarUrl: true
                        }
                    },
                    attachment: true
                }
            },

            _count: {
                select: {
                    messages: {
                        where: {
                            senderId: {
                                not: userId
                            },
                            reads: {
                                none: {
                                    userId
                                }
                            }
                        }
                    }
                }
            }

        },

        orderBy: {
            lastMessageAt: "desc"
        }

    });

    const oneToOneOtherIds = conversations
        .filter(conversation => !conversation.isGroup)
        .map(conversation =>
            conversation.participants.find(p => p.user.id !== userId)?.user.id
        )
        .filter(Boolean);

    const blocks = oneToOneOtherIds.length
        ? await prisma.block.findMany({
            where: {
                OR: [
                    { blockerId: userId, blockedId: { in: oneToOneOtherIds } },
                    { blockerId: { in: oneToOneOtherIds }, blockedId: userId }
                ]
            }
        })
        : [];

    const blockedByMeIds = new Set(
        blocks.filter(b => b.blockerId === userId).map(b => b.blockedId)
    );

    const blockedMeIds = new Set(
        blocks.filter(b => b.blockedId === userId).map(b => b.blockerId)
    );

    return conversations.map((conversation) => {

    const otherParticipants = conversation.participants
        .filter(p => p.user.id !== userId && !p.removedAt)
        .map(p => ({
            id: p.user.id,
            username: p.user.username,
            avatarUrl: p.user.avatarUrl,
            bio: p.user.bio,
            isAdmin: p.isAdmin,
            lastSeenAt: p.user.lastSeenAt
        }));

    const otherUser = !conversation.isGroup
        ? otherParticipants[0]
        : undefined;

    const currentParticipant = conversation.participants.find(
        p => p.user.id === userId
    );

    return {

        id: conversation.id,

        isGroup: conversation.isGroup,

        name: conversation.isGroup ? conversation.name : undefined,

        description: conversation.isGroup ? conversation.description : undefined,

        avatarUrl: conversation.isGroup ? conversation.avatarUrl : undefined,

        onlyAdminsCanEditInfo: conversation.isGroup ? conversation.onlyAdminsCanEditInfo : undefined,

        onlyAdminsCanMessage: conversation.isGroup ? conversation.onlyAdminsCanMessage : undefined,

        user: otherUser,

        participants: conversation.isGroup ? otherParticipants : undefined,

        isAdmin: conversation.isGroup ? Boolean(currentParticipant?.isAdmin) : undefined,


        mutedAt: currentParticipant?.mutedAt ?? null,

        blockedByMe: !conversation.isGroup && otherUser
            ? blockedByMeIds.has(otherUser.id)
            : undefined,

        blockedMe: !conversation.isGroup && otherUser
            ? blockedMeIds.has(otherUser.id)
            : undefined,

        lastMessage: getMessagePreview(conversation.messages[0]),

        lastMessageAt:
            conversation.messages[0]?.createdAt ?? conversation.lastMessageAt,

        unreadCount: conversation._count.messages

    };

});

};

export const toggleMute = async (conversationId, userId) => {

    const participant = await requireParticipant(conversationId, userId);

    return prisma.conversationParticipant.update({
        where: {
            conversationId_userId: {
                conversationId,
                userId
            }
        },
        data: {
            mutedAt: participant.mutedAt ? null : new Date()
        }
    });

};

export const getParticipantIds = async (conversationId) => {

    const rows = await prisma.conversationParticipant.findMany({
        where: {
            conversationId
        },
        select: {
            userId: true
        }
    });

    return rows.map(row => row.userId);

};