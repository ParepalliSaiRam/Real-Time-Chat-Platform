import asyncHandler from "../utils/asyncHandler.js";
import AppError from "../utils/AppError.js";
import { getIO } from "../sockets/index.js";
import { emitToUsers, getMessagePreview } from "../utils/broadcast.js";
import { getParticipantIds } from "../services/conversation.service.js";
import {
    createGroup,
    renameGroup,
    updateDescription,
    updateGroupAvatar,
    addMembers,
    removeMember,
    leaveGroup,
    promoteAdmin,
    demoteAdmin,
    updateGroupSettings,
    generateInviteCode,
    revokeInviteCode,
    getInviteCode,
    joinByInviteCode
} from "../services/group.service.js";

const broadcastSystemMessage = async (conversationId, systemMessage) => {

    if (!systemMessage) return;

    const io = getIO();

    io.to(`conversation:${conversationId}`)
        .emit("new-message", systemMessage);

    const participantIds = await getParticipantIds(conversationId);

    emitToUsers(io, participantIds, "conversation-updated", {

        conversationId,

        lastMessage: getMessagePreview(systemMessage),

        lastMessageAt: systemMessage.createdAt,

        senderId: systemMessage.senderId

    });

};

export const createGroupController =
asyncHandler(async (req, res) => {

    const data = req.body;

    const group = await createGroup(

        req.user.id,

        data.name,

        data.members

    );

    res.status(201).json({

        success: true,

        message: "Group created successfully.",

        group

    });

});

export const renameGroupController =
asyncHandler(async (req, res) => {

    const data = req.body;

    const { group, systemMessage } =
        await renameGroup(

            req.params.id,

            req.user.id,

            data.name

        );

    const participantIds = await getParticipantIds(req.params.id);

    emitToUsers(getIO(), participantIds, "group-renamed", {

        conversationId: req.params.id,

        name: group.name

    });

    await broadcastSystemMessage(req.params.id, systemMessage);

    res.json({

        success: true,

        group

    });

});

export const updateDescriptionController =
asyncHandler(async (req, res) => {

    const data = req.body;

    const { group, systemMessage } =
        await updateDescription(

            req.params.id,

            req.user.id,

            data.description

        );

    const participantIds = await getParticipantIds(req.params.id);

    emitToUsers(getIO(), participantIds, "group-description-updated", {

        conversationId: req.params.id,

        description: group.description

    });

    await broadcastSystemMessage(req.params.id, systemMessage);

    res.json({

        success: true,

        group

    });

});

export const updateGroupAvatarController =
asyncHandler(async (req, res) => {

    if (!req.file) {
        throw new AppError("No file uploaded.", 400);
    }

    const { group, systemMessage } =
        await updateGroupAvatar(

            req.params.id,

            req.user.id,

            req.file

        );

    const participantIds = await getParticipantIds(req.params.id);

    emitToUsers(getIO(), participantIds, "group-avatar-updated", {

        conversationId: req.params.id,

        avatarUrl: group.avatarUrl

    });

    await broadcastSystemMessage(req.params.id, systemMessage);

    res.json({

        success: true,

        group

    });

});

export const addMembersController =
asyncHandler(async (req, res) => {

    const { members, systemMessage } =
        await addMembers(

            req.params.id,

            req.user.id,

            req.body.members

        );

    const participantIds = await getParticipantIds(req.params.id);

    emitToUsers(getIO(), participantIds, "member-added", {

        conversationId: req.params.id,

        members

    });

    await broadcastSystemMessage(req.params.id, systemMessage);

    res.json({

        success: true,

        members

    });

});

export const removeMemberController =
asyncHandler(async (req, res) => {

    const { userId: removedUserId, systemMessage } =
        await removeMember(

            req.params.id,

            req.user.id,

            req.params.userId

        );

    const participantIds = await getParticipantIds(req.params.id);

    emitToUsers(getIO(), participantIds, "member-removed", {

        conversationId: req.params.id,

        userId: removedUserId

    });

    await broadcastSystemMessage(req.params.id, systemMessage);

    res.json({

        success: true,

        message: "Member removed successfully.",

        userId: removedUserId

    });

});

export const leaveGroupController =
asyncHandler(async (req, res) => {

    const result =
        await leaveGroup(
            req.params.id,
            req.user.id
        );

    if (!result.deleted) {

        const participantIds = await getParticipantIds(req.params.id);

        emitToUsers(
            getIO(),
            participantIds,
            "member-left",
            {
                conversationId: req.params.id,
                userId: req.user.id,
                deleted: result.deleted
            }
        );

        await broadcastSystemMessage(req.params.id, result.systemMessage);

    }

    res.json({

        success: true,

        deleted: result.deleted

    });

});

export const promoteAdminController =
asyncHandler(async (req, res) => {

    const result =
        await promoteAdmin(

            req.params.id,

            req.user.id,

            req.body.userId

        );

    const participantIds = await getParticipantIds(req.params.id);

    emitToUsers(getIO(), participantIds, "admin-promoted", {

        conversationId: req.params.id,

        userId: result.userId

    });

    await broadcastSystemMessage(req.params.id, result.systemMessage);

    res.json({

        success: true,

        message: "Member promoted to admin.",

        userId: result.userId

    });

});

export const demoteAdminController =
asyncHandler(async (req, res) => {

    const result =
        await demoteAdmin(

            req.params.id,

            req.user.id,

            req.body.userId

        );

    const participantIds = await getParticipantIds(req.params.id);

    emitToUsers(getIO(), participantIds, "admin-demoted", {

        conversationId: req.params.id,

        userId: result.userId

    });

    await broadcastSystemMessage(req.params.id, result.systemMessage);

    res.json({

        success: true,

        message: "Admin removed.",

        userId: result.userId

    });

});

export const updateGroupSettingsController =
asyncHandler(async (req, res) => {

    const { group, systemMessage } =
        await updateGroupSettings(

            req.params.id,

            req.user.id,

            req.body

        );

    const participantIds = await getParticipantIds(req.params.id);

    emitToUsers(getIO(), participantIds, "group-settings-updated", {

        conversationId: req.params.id,

        onlyAdminsCanEditInfo: group.onlyAdminsCanEditInfo,

        onlyAdminsCanMessage: group.onlyAdminsCanMessage

    });

    await broadcastSystemMessage(req.params.id, systemMessage);

    res.json({

        success: true,

        group

    });

});

export const generateInviteController =
asyncHandler(async (req, res) => {

    const inviteCode = await generateInviteCode(req.params.id, req.user.id);

    res.json({

        success: true,

        inviteCode

    });

});

export const revokeInviteController =
asyncHandler(async (req, res) => {

    await revokeInviteCode(req.params.id, req.user.id);

    res.json({

        success: true,

        message: "Invite link revoked."

    });

});

export const getInviteController =
asyncHandler(async (req, res) => {

    const inviteCode = await getInviteCode(req.params.id, req.user.id);

    res.json({

        success: true,

        inviteCode

    });

});

export const joinGroupController =
asyncHandler(async (req, res) => {

    const result = await joinByInviteCode(req.user.id, req.params.code);

    const participantIds = await getParticipantIds(result.conversationId);

    emitToUsers(getIO(), participantIds, "member-added", {

        conversationId: result.conversationId,

        members: [{ id: req.user.id, username: req.user.username, avatarUrl: req.user.avatarUrl }]

    });

    await broadcastSystemMessage(result.conversationId, result.systemMessage);

    res.json({

        success: true,

        conversationId: result.conversationId

    });

});