import prisma from "../config/prisma.js";
import AppError from "../utils/AppError.js";
import { requireParticipant, requireActiveParticipant, assertGroupMessagingAllowed } from "../utils/participant.js";
import { assertConversationNotBlocked } from "./block.service.js";

const excludingDeletedFor = (userId) => ({
  deletions: {
    none: { userId }
  }
});

const messageInclude = {
  sender: {
    select: {
      id: true,
      username: true,
      avatarUrl: true
    }
  },

  reads: {
    select: {
      userId: true
    }
  },

  attachment: true,

  replyTo: {
    select: {
      id: true,
      content: true,
      type: true,
      isDeleted: true,
      sender: {
        select: {
          id: true,
          username: true,
          avatarUrl: true
        }
      }
    }
  },

  reactions: {
    select: {
      id: true,
      emoji: true,
      userId: true,
      user: {
        select: {
          id: true,
          username: true,
          avatarUrl: true
        }
      }
    }
  }
};

export const getMessages = async (
  conversationId,
  userId,
  cursor = null,
  limit = 30,
) => {
  await requireParticipant(conversationId, userId);

  const messages = await prisma.message.findMany({
    where: {
      conversationId,
      ...excludingDeletedFor(userId),
    },

    include: messageInclude,

    orderBy: {
      createdAt: "desc",
    },

    take: limit,

    ...(cursor && {
      cursor: {
        id: cursor,
      },
      skip: 1,
    }),
  });

  const hasMore = messages.length === limit;

  const nextCursor = hasMore
    ? messages[messages.length - 1].id
    : null;

  return {
    messages: messages.reverse(),

    nextCursor,

    hasMore,
  };
};

export const getMessagesAround = async (
  conversationId,
  userId,
  messageId,
  contextSize = 15
) => {
  await requireParticipant(conversationId, userId);

  const target = await prisma.message.findFirst({
    where: {
      id: messageId,
      conversationId
    }
  });

  if (!target) {
    throw new AppError("Message not found.", 404);
  }

  const [before, after] = await Promise.all([
    prisma.message.findMany({
      where: {
        conversationId,
        createdAt: { lt: target.createdAt },
        ...excludingDeletedFor(userId)
      },
      orderBy: { createdAt: "desc" },
      take: contextSize,
      include: messageInclude
    }),

    prisma.message.findMany({
      where: {
        conversationId,
        createdAt: { gte: target.createdAt },
        ...excludingDeletedFor(userId)
      },
      orderBy: { createdAt: "asc" },
      take: contextSize,
      include: messageInclude
    })
  ]);

  const messages = [...before.reverse(), ...after];

  return {
    messages,
    hasMore: before.length === contextSize,
    nextCursor: messages[0]?.id ?? null
  };
};

export const searchMessages = async (conversationId, userId, query) => {

  await requireParticipant(conversationId, userId);

  const trimmed = query.trim();

  if (!trimmed) {
    return { results: [] };
  }

  const results = await prisma.message.findMany({
    where: {
      conversationId,
      isDeleted: false,
      type: "TEXT",
      content: {
        contains: trimmed,
        mode: "insensitive"
      },
      ...excludingDeletedFor(userId)
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
    },
    take: 20
  });

  return { results };

};

export const searchMessagesAcrossConversations = async (userId, query) => {
  const trimmed = query.trim();
  if (!trimmed) return { results: [] };

  const results = await prisma.message.findMany({
    where: {
      isDeleted: false,
      type: "TEXT",
      content: {
        contains: trimmed,
        mode: "insensitive"
      },
      conversation: {
        participants: {
          some: { userId }
        }
      },
      ...excludingDeletedFor(userId)
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
    orderBy: { createdAt: "desc" },
    take: 50
  });

  return { results };
};

export const sendMessage = async (conversationId, senderId, content, replyToId = null) => {
  await requireActiveParticipant(conversationId, senderId);
  await assertConversationNotBlocked(conversationId, senderId);
  await assertGroupMessagingAllowed(conversationId, senderId);

  let validReplyToId = null;

  if (replyToId) {
    const replyTarget = await prisma.message.findFirst({
      where: {
        id: replyToId,
        conversationId
      }
    });

    if (!replyTarget) {
      throw new AppError("The message being replied to was not found.", 404);
    }

    validReplyToId = replyTarget.id;
  }

  return prisma.$transaction(async (tx) => {
    const message = await tx.message.create({
      data: {
        conversationId,
        senderId,
        content,
        replyToId: validReplyToId
      },

      include: messageInclude,
    });

    await tx.conversation.update({
      where: {
        id: conversationId,
      },

      data: {
        lastMessageAt: new Date(),
      },
    });

    return message;
  });
};

export const editMessage = async (messageId, userId, content) => {
  const message = await prisma.message.findUnique({
    where: {
      id: messageId,
    },
  });

  if (!message) {
    throw new AppError("Message not found.", 404);
  }

  if (message.senderId !== userId) {
    throw new AppError("You can only edit your own messages.", 403);
  }

  if (message.isDeleted) {
    throw new AppError("Deleted messages cannot be edited.", 400);
  }

  if (message.type !== "TEXT") {
    throw new AppError("Only text messages can be edited.", 400);
  }

  return prisma.message.update({
    where: {
      id: messageId,
    },

    data: {
      content,

      isEdited: true,
    },

    include: messageInclude,
  });
};

export const deleteMessage = async (messageId, userId) => {
  const message = await prisma.message.findUnique({
    where: {
      id: messageId,
    },
  });

  if (!message) {
    throw new AppError("Message not found.", 404);
  }

  if (message.senderId !== userId) {
    throw new AppError("You can only delete your own messages.", 403);
  }

  if (message.isDeleted) {
    throw new AppError("Message is already deleted.", 400);
  }

  if (message.type === "SYSTEM") {
    throw new AppError("System messages cannot be deleted.", 400);
  }

  return prisma.$transaction(async (tx) => {
    await tx.messageReaction.deleteMany({
      where: { messageId },
    });

    return tx.message.update({
      where: { id: messageId },
      data: { isDeleted: true },
      include: messageInclude,
    });
  });
};

export const deleteForMe = async (messageId, userId) => {

  const message = await prisma.message.findUnique({
    where: { id: messageId },
  });

  if (!message) {
    throw new AppError("Message not found.", 404);
  }

  await requireParticipant(message.conversationId, userId);

  await prisma.messageDeletion.upsert({
    where: {
      messageId_userId: {
        messageId,
        userId,
      },
    },
    create: {
      messageId,
      userId,
    },
    update: {},
  });

  return { conversationId: message.conversationId };

};

export const forwardMessages = async (userId, messageIds, targetConversationIds) => {

  const uniqueMessageIds = [...new Set(messageIds)];
  const uniqueTargetIds = [...new Set(targetConversationIds)];

  if (!uniqueMessageIds.length) {
    throw new AppError("Select at least one message to forward.", 400);
  }

  if (!uniqueTargetIds.length) {
    throw new AppError("Select at least one conversation to forward to.", 400);
  }

  const sourceMessages = await prisma.message.findMany({
    where: {
      id: { in: uniqueMessageIds },
      isDeleted: false,
      type: { in: ["TEXT", "IMAGE", "FILE"] }
    },
    include: {
      attachment: true
    }
  });

  if (sourceMessages.length !== uniqueMessageIds.length) {
    throw new AppError("One or more messages can no longer be forwarded.", 400);
  }

  const sourceConversationIds = [...new Set(sourceMessages.map(m => m.conversationId))];

  await Promise.all(
    sourceConversationIds.map(id => requireParticipant(id, userId))
  );

  await Promise.all(
    uniqueTargetIds.map(async (conversationId) => {
      await requireActiveParticipant(conversationId, userId);
      await assertConversationNotBlocked(conversationId, userId);
      await assertGroupMessagingAllowed(conversationId, userId);
    })
  );

  const created = [];

  await prisma.$transaction(async (tx) => {

    for (const conversationId of uniqueTargetIds) {

      for (const source of sourceMessages) {

        const message = await tx.message.create({
          data: {
            conversationId,
            senderId: userId,
            content: source.content,
            type: source.type
          },
          include: messageInclude
        });

        if (source.attachment) {

          await tx.attachment.create({
            data: {
              messageId: message.id,
              fileName: source.attachment.fileName,
              mimeType: source.attachment.mimeType,
              size: source.attachment.size,
              url: source.attachment.url
            }
          });

        }

        created.push({
          conversationId,
          messageId: message.id
        });

      }

      await tx.conversation.update({
        where: { id: conversationId },
        data: { lastMessageAt: new Date() }
      });

    }

  });

  const messages = await prisma.message.findMany({
    where: { id: { in: created.map(c => c.messageId) } },
    include: messageInclude
  });

  const messageById = new Map(messages.map(m => [m.id, m]));

  return created.map(({ conversationId, messageId }) => ({
    conversationId,
    message: messageById.get(messageId)
  }));

};

export const toggleReaction = async (messageId, userId, emoji) => {

  const message = await prisma.message.findUnique({
    where: {
      id: messageId
    },
    select: {
      id: true,
      conversationId: true,
      isDeleted: true
    }
  });

  if (!message || message.isDeleted) {
    throw new AppError("Message not found.", 404);
  }

  await requireActiveParticipant(message.conversationId, userId);

  const existing = await prisma.messageReaction.findUnique({
    where: {
      messageId_userId: {
        messageId,
        userId
      }
    }
  });

  if (existing && existing.emoji === emoji) {

    await prisma.messageReaction.delete({
      where: {
        id: existing.id
      }
    });

  } else if (existing) {

    await prisma.messageReaction.update({
      where: {
        id: existing.id
      },
      data: {
        emoji
      }
    });

  } else {

    await prisma.messageReaction.create({
      data: {
        messageId,
        userId,
        emoji
      }
    });

  }

  const reactions = await prisma.messageReaction.findMany({
    where: {
      messageId
    },
    select: {
      id: true,
      emoji: true,
      userId: true,
      user: {
        select: {
          id: true,
          username: true,
          avatarUrl: true
        }
      }
    }
  });

  return {
    messageId,
    conversationId: message.conversationId,
    reactions
  };

};
