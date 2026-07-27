import crypto from "crypto";
import prisma from "../config/prisma.js";
import AppError from "../utils/AppError.js";
import storage from "../storage/index.js";
import { requireActiveParticipant } from "../utils/participant.js";

const getGroup = async (conversationId) => {
  const group = await prisma.conversation.findUnique({
    where: {
      id: conversationId,
    },
  });

  if (!group || !group.isGroup) {
    throw new AppError("Group not found.", 404);
  }

  return group;
};

const getGroupAdmin = async (conversationId, userId) => {
  await getGroup(conversationId);

  const participant = await prisma.conversationParticipant.findUnique({
    where: {
      conversationId_userId: {
        conversationId,

        userId,
      },
    },
  });

  if (!participant || participant.removedAt) {
    throw new AppError("Group not found.", 404);
  }

  if (!participant.isAdmin) {
    throw new AppError("Only group admins can perform this action.", 403);
  }

  return participant;
};

const getGroupEditor = async (conversationId, userId) => {
  const group = await getGroup(conversationId);

  const participant = await prisma.conversationParticipant.findUnique({
    where: {
      conversationId_userId: {
        conversationId,
        userId,
      },
    },
  });

  if (!participant || participant.removedAt) {
    throw new AppError("Group not found.", 404);
  }

  if (group.onlyAdminsCanEditInfo && !participant.isAdmin) {
    throw new AppError("Only group admins can edit this group's info.", 403);
  }

  return participant;
};

const createSystemMessage = async (conversationId, actorId, content) => {
  const message = await prisma.message.create({
    data: {
      conversationId,
      senderId: actorId,
      type: "SYSTEM",
      content,
    },

    include: {
      sender: {
        select: {
          id: true,
          username: true,

          avatarUrl: true,
        },
      },
      reads: {
        select: {
          userId: true,
        },
      },
      attachment: true,
    },
  });

  await prisma.conversation.update({
    where: {
      id: conversationId,
    },
    data: {
      lastMessageAt: new Date(),
    },
  });

  return message;
};

const getUsername = async (userId) => {
  const user = await prisma.user.findUnique({
    where: {
      id: userId,
    },
    select: {
      username: true,

      avatarUrl: true,
    },
  });

  return user?.username ?? "Someone";
};

export const createGroup = async (creatorId, name, memberIds) => {
  const uniqueMembers = [
    ...new Set(memberIds.filter((id) => id !== creatorId)),
  ];

  const users = await prisma.user.findMany({
    where: {
      id: {
        in: uniqueMembers,
      },
    },

    select: {
      id: true,
    },
  });

  if (users.length !== uniqueMembers.length) {
    throw new AppError("One or more users do not exist.", 400);
  }

  return prisma.$transaction(async (tx) => {
    const conversation = await tx.conversation.create({
      data: {
        isGroup: true,

        name,

        createdById: creatorId,
      },
    });

    await tx.conversationParticipant.create({
      data: {
        conversationId: conversation.id,

        userId: creatorId,

        isAdmin: true,
      },
    });

    if (uniqueMembers.length > 0) {
      await tx.conversationParticipant.createMany({
        data: uniqueMembers.map((userId) => ({
          conversationId: conversation.id,

          userId,

          isAdmin: false,
        })),
      });
    }

    return tx.conversation.findUnique({
      where: {
        id: conversation.id,
      },

      include: {
        participants: {
          include: {
            user: {
              select: {
                id: true,

                username: true,

                avatarUrl: true,
              },
            },
          },
        },
      },
    });
  });
};

export const renameGroup = async (conversationId, userId, name) => {
  await getGroupEditor(conversationId, userId);

  const group = await prisma.conversation.update({
    where: {
      id: conversationId,
    },

    data: {
      name,
    },
  });

  const actorUsername = await getUsername(userId);

  const systemMessage = await createSystemMessage(
    conversationId,
    userId,
    `${actorUsername} renamed the group to "${name}"`,
  );

  return { group, systemMessage };
};

export const updateDescription = async (
  conversationId,
  userId,
  description,
) => {
  await getGroupEditor(conversationId, userId);

  const group = await prisma.conversation.update({
    where: {
      id: conversationId,
    },

    data: {
      description: description || null,
    },
  });

  const actorUsername = await getUsername(userId);

  const systemMessage = await createSystemMessage(
    conversationId,
    userId,
    `${actorUsername} updated the group description`,
  );

  return { group, systemMessage };
};

export const updateGroupAvatar = async (conversationId, userId, file) => {
  await getGroupEditor(conversationId, userId);

  const uploaded = await storage.upload(file);

  const group = await prisma.conversation.update({
    where: {
      id: conversationId,
    },

    data: {
      avatarUrl: uploaded.url,
    },
  });

  const actorUsername = await getUsername(userId);

  const systemMessage = await createSystemMessage(
    conversationId,
    userId,
    `${actorUsername} changed the group photo`,
  );

  return { group, systemMessage };
};

export const addMembers = async (conversationId, adminId, memberIds) => {
  await getGroupAdmin(conversationId, adminId);

  const uniqueMembers = [...new Set(memberIds.filter((id) => id !== adminId))];

  if (!uniqueMembers.length) {
    return { members: [], systemMessage: null };
  }

  const users = await prisma.user.findMany({
    where: {
      id: {
        in: uniqueMembers,
      },
    },

    select: {
      id: true,

      username: true,

      avatarUrl: true,
    },
  });

  if (users.length !== uniqueMembers.length) {
    throw new AppError("One or more users do not exist.", 400);
  }

  const existingRows = await prisma.conversationParticipant.findMany({
    where: {
      conversationId,

      userId: {
        in: uniqueMembers,
      },
    },

    select: {
      userId: true,

      removedAt: true,
    },
  });

  const activeIds = new Set(
    existingRows.filter((row) => !row.removedAt).map((row) => row.userId),
  );

  const membersToAdd = users.filter((user) => !activeIds.has(user.id));

  if (!membersToAdd.length) {
    return { members: [], systemMessage: null };
  }

  const existingRowIds = new Set(existingRows.map((row) => row.userId));

  const brandNew = membersToAdd.filter((user) => !existingRowIds.has(user.id));

  const toReactivate = membersToAdd.filter((user) =>
    existingRowIds.has(user.id),
  );

  await prisma.$transaction([
    ...(brandNew.length
      ? [
          prisma.conversationParticipant.createMany({
            data: brandNew.map((user) => ({
              conversationId,
              userId: user.id,
              isAdmin: false,
            })),
          }),
        ]
      : []),

    ...toReactivate.map((user) =>
      prisma.conversationParticipant.update({
        where: {
          conversationId_userId: {
            conversationId,
            userId: user.id,
          },
        },
        data: {
          removedAt: null,
          isAdmin: false,
          joinedAt: new Date(),
        },
      }),
    ),
  ]);

  const actorUsername = await getUsername(adminId);

  const addedNames = membersToAdd.map((u) => u.username).join(", ");

  const systemMessage = await createSystemMessage(
    conversationId,
    adminId,
    `${actorUsername} added ${addedNames}`,
  );

  return { members: membersToAdd, systemMessage };
};

export const removeMember = async (conversationId, adminId, memberId) => {
  await getGroupAdmin(conversationId, adminId);

  if (adminId === memberId) {
    throw new AppError("Use the leave group endpoint to leave the group.", 400);
  }

  const participant = await prisma.conversationParticipant.findUnique({
    where: {
      conversationId_userId: {
        conversationId,

        userId: memberId,
      },
    },

    include: {
      user: {
        select: {
          username: true,

          avatarUrl: true,
        },
      },
    },
  });

  if (!participant || participant.removedAt) {
    throw new AppError("Member not found in this group.", 404);
  }

  if (participant.isAdmin) {
    throw new AppError("Cannot remove another group admin.", 403);
  }

  await prisma.conversationParticipant.update({
    where: {
      conversationId_userId: {
        conversationId,

        userId: memberId,
      },
    },

    data: {
      removedAt: new Date(),
    },
  });

  const actorUsername = await getUsername(adminId);

  const systemMessage = await createSystemMessage(
    conversationId,
    adminId,
    `${actorUsername} removed ${participant.user.username}`,
  );

  return { userId: memberId, systemMessage };
};

export const leaveGroup = async (conversationId, userId) => {
  await getGroup(conversationId);

  const participant = await requireActiveParticipant(conversationId, userId);

  const activeMemberCount = await prisma.conversationParticipant.count({
    where: {
      conversationId,
      removedAt: null,
    },
  });

  if (activeMemberCount === 1) {
    await prisma.conversation.delete({
      where: {
        id: conversationId,
      },
    });

    return {
      deleted: true,
      systemMessage: null,
    };
  }

  if (participant.isAdmin) {
    const otherAdminCount = await prisma.conversationParticipant.count({
      where: {
        conversationId,
        isAdmin: true,
        removedAt: null,
        userId: {
          not: userId,
        },
      },
    });

    if (otherAdminCount === 0) {
      throw new AppError(
        "Promote another member to admin before leaving.",
        400,
      );
    }
  }

  await prisma.conversationParticipant.update({
    where: {
      conversationId_userId: {
        conversationId,
        userId,
      },
    },
    data: {
      removedAt: new Date(),
    },
  });

  const actorUsername = await getUsername(userId);

  const systemMessage = await createSystemMessage(
    conversationId,
    userId,
    `${actorUsername} left the group`,
  );

  return {
    deleted: false,
    systemMessage,
  };
};

export const promoteAdmin = async (conversationId, adminId, memberId) => {
  await getGroupAdmin(conversationId, adminId);

  const member = await prisma.conversationParticipant.findUnique({
    where: {
      conversationId_userId: {
        conversationId,
        userId: memberId,
      },
    },
    include: {
      user: {
        select: {
          username: true,
        },
      },
    },
  });

  if (!member || member.removedAt) {
    throw new AppError("Selected user is not a group member.", 404);
  }

  if (member.isAdmin) {
    throw new AppError("User is already an admin.", 400);
  }

  await prisma.conversationParticipant.update({
    where: {
      conversationId_userId: {
        conversationId,
        userId: memberId,
      },
    },
    data: {
      isAdmin: true,
    },
  });

  const actorUsername = await getUsername(adminId);

  const systemMessage = await createSystemMessage(
    conversationId,
    adminId,
    `${actorUsername} made ${member.user.username} a group admin`,
  );

  return { userId: memberId, systemMessage };
};

export const demoteAdmin = async (conversationId, adminId, memberId) => {
  await getGroupAdmin(conversationId, adminId);

  const member = await prisma.conversationParticipant.findUnique({
    where: {
      conversationId_userId: {
        conversationId,
        userId: memberId,
      },
    },
    include: {
      user: {
        select: {
          username: true,
        },
      },
    },
  });

  if (!member || member.removedAt) {
    throw new AppError("Selected user is not a group member.", 404);
  }

  if (!member.isAdmin) {
    throw new AppError("User is not an admin.", 400);
  }

  const adminCount = await prisma.conversationParticipant.count({
    where: {
      conversationId,
      isAdmin: true,
      removedAt: null,
    },
  });

  if (adminCount <= 1) {
    throw new AppError("A group must have at least one admin.", 400);
  }

  await prisma.conversationParticipant.update({
    where: {
      conversationId_userId: {
        conversationId,
        userId: memberId,
      },
    },
    data: {
      isAdmin: false,
    },
  });

  const actorUsername = await getUsername(adminId);

  const systemMessage = await createSystemMessage(
    conversationId,
    adminId,
    `${actorUsername} removed ${member.user.username} as group admin`,
  );

  return { userId: memberId, systemMessage };
};

export const updateGroupSettings = async (
  conversationId,
  adminId,
  settings,
) => {
  await getGroupAdmin(conversationId, adminId);

  const data = {};

  if (typeof settings.onlyAdminsCanEditInfo === "boolean") {
    data.onlyAdminsCanEditInfo = settings.onlyAdminsCanEditInfo;
  }

  if (typeof settings.onlyAdminsCanMessage === "boolean") {
    data.onlyAdminsCanMessage = settings.onlyAdminsCanMessage;
  }

  const group = await prisma.conversation.update({
    where: {
      id: conversationId,
    },
    data,
  });

  const actorUsername = await getUsername(adminId);

  const systemMessage = await createSystemMessage(
    conversationId,
    adminId,
    `${actorUsername} changed the group settings`,
  );

  return { group, systemMessage };
};

export const generateInviteCode = async (conversationId, adminId) => {
  await getGroupAdmin(conversationId, adminId);

  const inviteCode = crypto.randomBytes(8).toString("hex");

  const group = await prisma.conversation.update({
    where: {
      id: conversationId,
    },
    data: {
      inviteCode,
    },
  });

  return group.inviteCode;
};

export const revokeInviteCode = async (conversationId, adminId) => {
  await getGroupAdmin(conversationId, adminId);

  await prisma.conversation.update({
    where: {
      id: conversationId,
    },
    data: {
      inviteCode: null,
    },
  });
};

export const getInviteCode = async (conversationId, adminId) => {
  await getGroupAdmin(conversationId, adminId);

  const group = await prisma.conversation.findUnique({
    where: {
      id: conversationId,
    },
    select: {
      inviteCode: true,
    },
  });

  return group.inviteCode;
};

export const joinByInviteCode = async (userId, inviteCode) => {
  const group = await prisma.conversation.findFirst({
    where: {
      inviteCode,
      isGroup: true,
    },
  });

  if (!group) {
    throw new AppError("Invalid or expired invite link.", 404);
  }

  const existing = await prisma.conversationParticipant.findUnique({
    where: {
      conversationId_userId: {
        conversationId: group.id,
        userId,
      },
    },
  });

  if (existing && !existing.removedAt) {
    throw new AppError("You're already a member of this group.", 409);
  }

  if (existing) {
    await prisma.conversationParticipant.update({
      where: {
        conversationId_userId: {
          conversationId: group.id,
          userId,
        },
      },
      data: {
        removedAt: null,
        isAdmin: false,
        joinedAt: new Date(),
      },
    });
  } else {
    await prisma.conversationParticipant.create({
      data: {
        conversationId: group.id,
        userId,
        isAdmin: false,
      },
    });
  }

  const actorUsername = await getUsername(userId);

  const systemMessage = await createSystemMessage(
    group.id,
    userId,
    `${actorUsername} joined via invite link`,
  );

  return { conversationId: group.id, systemMessage };
};
