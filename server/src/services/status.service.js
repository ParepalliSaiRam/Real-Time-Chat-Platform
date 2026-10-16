import prisma from "../config/prisma.js";
import AppError from "../utils/AppError.js";
import storage from "../storage/index.js";
import { getFriendIds, areFriends } from "./friend.service.js";

const STATUS_LIFETIME_MS = 24 * 60 * 60 * 1000;

const userSelect = {
    id: true,
    username: true,
    avatarUrl: true
};

const statusInclude = {
    user: {
        select: userSelect
    },
    views: {
        select: {
            viewerId: true
        }
    }
};

const notExpired = {
    expiresAt: {
        gt: new Date()
    }
};

export const createStatus = async (userId, { type, content, backgroundColor, audience = "FRIENDS", file }) => {

    const trimmedContent = content?.trim() || null;

    if (type === "IMAGE") {

        if (!file) {
            throw new AppError("An image is required for a photo status.", 400);
        }

        const uploaded = await storage.upload(file);

        return prisma.status.create({
            data: {
                userId,
                audience,
                type: "IMAGE",
                content: trimmedContent,
                mediaUrl: uploaded.url,
                expiresAt: new Date(Date.now() + STATUS_LIFETIME_MS)
            },
            include: statusInclude
        });

    }

    if (!trimmedContent) {
        throw new AppError("Status text cannot be empty.", 400);
    }

    return prisma.status.create({
        data: {
            userId,
            audience,
            type: "TEXT",
            content: trimmedContent,
            backgroundColor: backgroundColor || "#1e88e5",
            expiresAt: new Date(Date.now() + STATUS_LIFETIME_MS)
        },
        include: statusInclude
    });

};

export const getFeed = async (userId) => {

    const friendIds = await getFriendIds(userId);

    const statuses = await prisma.status.findMany({
        where: {
            OR: [
                { userId, ...notExpired },
                { userId: { in: friendIds }, audience: "FRIENDS", ...notExpired }
            ]
        },
        include: statusInclude,
        orderBy: {
            createdAt: "asc"
        }
    });

    const groups = new Map();

    for (const status of statuses) {

        if (!groups.has(status.userId)) {
            groups.set(status.userId, {
                user: status.user,
                statuses: [],
                hasUnviewed: false
            });
        }

        const group = groups.get(status.userId);

        group.statuses.push(status);

        const viewedByMe = status.userId === userId ||
            status.views.some(v => v.viewerId === userId);

        if (!viewedByMe) group.hasUnviewed = true;

    }

    const mine = groups.get(userId) ?? null;
    groups.delete(userId);

    const friends = [...groups.values()].sort((a, b) => {
        if (a.hasUnviewed !== b.hasUnviewed) return a.hasUnviewed ? -1 : 1;

        const aLatest = a.statuses[a.statuses.length - 1].createdAt;
        const bLatest = b.statuses[b.statuses.length - 1].createdAt;

        return new Date(bLatest) - new Date(aLatest);
    });

    return { mine, friends };

};

export const getUserStatuses = async (viewerId, targetUserId) => {

    if (viewerId !== targetUserId) {

        const friends = await areFriends(viewerId, targetUserId);

        if (!friends) {
            throw new AppError("You can only view friends' statuses.", 403);
        }

    }

    return prisma.status.findMany({
        where: {
            userId: targetUserId,
            ...(viewerId !== targetUserId ? { audience: "FRIENDS" } : {}),
            ...notExpired
        },
        include: statusInclude,
        orderBy: {
            createdAt: "asc"
        }
    });

};

export const markViewed = async (statusId, viewerId) => {

    const status = await prisma.status.findUnique({
        where: { id: statusId }
    });

    if (!status || status.expiresAt <= new Date()) {
        throw new AppError("Status not found.", 404);
    }

    if (status.userId === viewerId) return;

    if (status.audience !== "FRIENDS") {
        throw new AppError("This status is private.", 403);
    }

    const friends = await areFriends(viewerId, status.userId);

    if (!friends) {
        throw new AppError("You can only view friends' statuses.", 403);
    }

    await prisma.statusView.upsert({
        where: {
            statusId_viewerId: {
                statusId,
                viewerId
            }
        },
        create: {
            statusId,
            viewerId
        },
        update: {}
    });

};

export const getViewers = async (statusId, userId) => {

    const status = await prisma.status.findUnique({
        where: { id: statusId }
    });

    if (!status) {
        throw new AppError("Status not found.", 404);
    }

    if (status.userId !== userId) {
        throw new AppError("Only the author can see who's viewed this status.", 403);
    }

    const views = await prisma.statusView.findMany({
        where: { statusId },
        include: {
            viewer: {
                select: userSelect
            }
        },
        orderBy: {
            viewedAt: "desc"
        }
    });

    return views.map(v => ({ ...v.viewer, viewedAt: v.viewedAt }));

};

export const deleteStatus = async (statusId, userId) => {

    const status = await prisma.status.findUnique({
        where: { id: statusId }
    });

    if (!status) {
        throw new AppError("Status not found.", 404);
    }

    if (status.userId !== userId) {
        throw new AppError("You can only delete your own status.", 403);
    }

    await prisma.status.delete({
        where: { id: statusId }
    });

    return status;

};
