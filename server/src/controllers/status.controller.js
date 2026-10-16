import asyncHandler from "../utils/asyncHandler.js";
import AppError from "../utils/AppError.js";
import {
    createStatus,
    getFeed,
    getUserStatuses,
    markViewed,
    getViewers,
    deleteStatus
} from "../services/status.service.js";
import { getFriendIds } from "../services/friend.service.js";
import { getIO } from "../sockets/index.js";
import { emitToUsers } from "../utils/broadcast.js";

export const createStatusController = asyncHandler(async (req, res) => {

    if (req.body.type === "IMAGE" && !req.file) {
        throw new AppError("An image is required for a photo status.", 400);
    }

    const status = await createStatus(req.user.id, {
        type: req.body.type,
        audience: req.body.audience,
        content: req.body.content,
        backgroundColor: req.body.backgroundColor,
        file: req.file
    });

    if (status.audience === "FRIENDS") {
        const friendIds = await getFriendIds(req.user.id);
        emitToUsers(getIO(), friendIds, "status-created", { status });
    }

    res.status(201).json({

        success: true,

        status

    });

});

export const getFeedController = asyncHandler(async (req, res) => {

    const feed = await getFeed(req.user.id);

    res.json({

        success: true,

        ...feed

    });

});

export const getUserStatusesController = asyncHandler(async (req, res) => {

    const statuses = await getUserStatuses(req.user.id, req.params.userId);

    res.json({

        success: true,

        statuses

    });

});

export const markViewedController = asyncHandler(async (req, res) => {

    await markViewed(req.params.id, req.user.id);

    res.json({

        success: true

    });

});

export const getViewersController = asyncHandler(async (req, res) => {

    const viewers = await getViewers(req.params.id, req.user.id);

    res.json({

        success: true,

        viewers

    });

});

export const deleteStatusController = asyncHandler(async (req, res) => {

    const status = await deleteStatus(req.params.id, req.user.id);

    if (status.audience === "FRIENDS") {
        const friendIds = await getFriendIds(req.user.id);

        emitToUsers(getIO(), friendIds, "status-deleted", {
            statusId: req.params.id,
            userId: req.user.id
        });
    }

    res.json({

        success: true

    });

});
