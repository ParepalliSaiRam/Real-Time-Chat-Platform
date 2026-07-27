import prisma from "../config/prisma.js";
import AppError from "./AppError.js";

export const requireParticipant = async (
    conversationId,
    userId
) => {

    const participant =
        await prisma.conversationParticipant.findUnique({

            where: {

                conversationId_userId: {

                    conversationId,

                    userId

                }

            }

        });

    if (!participant) {

        throw new AppError(
            "Conversation not found.",
            404
        );

    }

    return participant;

};

export const requireActiveParticipant = async (
    conversationId,
    userId
) => {

    const participant = await requireParticipant(
        conversationId,
        userId
    );

    if (participant.removedAt) {

        throw new AppError(
            "You are no longer a member of this conversation.",
            403
        );

    }

    return participant;

};

export const assertGroupMessagingAllowed = async (
    conversationId,
    userId
) => {

    const conversation = await prisma.conversation.findUnique({
        where: {
            id: conversationId
        },
        select: {
            isGroup: true,
            onlyAdminsCanMessage: true
        }
    });

    if (!conversation?.isGroup || !conversation.onlyAdminsCanMessage) return;

    const participant = await prisma.conversationParticipant.findUnique({
        where: {
            conversationId_userId: {
                conversationId,
                userId
            }
        },
        select: {
            isAdmin: true
        }
    });

    if (!participant?.isAdmin) {

        throw new AppError(
            "Only group admins can send messages in this group.",
            403
        );

    }

};