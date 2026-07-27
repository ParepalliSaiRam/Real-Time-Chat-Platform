import prisma from "../config/prisma.js";
import { requireParticipant } from "../utils/participant.js";

export const markConversationAsRead = async (
  conversationId,
  userId
) => {
  await requireParticipant(
    conversationId,
    userId
  );

  const unreadMessages =
    await prisma.message.findMany({
      where: {
        conversationId,

        senderId: {
          not: userId,
        },

        reads: {
          none: {
            userId,
          },
        },
      },

      select: {
        id: true,
      },
    });

  if (unreadMessages.length === 0) {
    return [];
  }

  await prisma.messageRead.createMany({
    data: unreadMessages.map((message) => ({
      messageId: message.id,
      userId,
    })),

    skipDuplicates: true,
  });

  return unreadMessages.map(
    (message) => message.id
  );
};