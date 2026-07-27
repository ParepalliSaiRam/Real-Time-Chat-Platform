import asyncHandler from "../utils/asyncHandler.js";
import {
    blockUser,
    unblockUser,
    getBlockedUsers
} from "../services/block.service.js";

export const block = asyncHandler(async (req, res) => {

    await blockUser(req.user.id, req.params.userId);

    res.status(200).json({
        success: true,
        message: "User blocked."
    });

});

export const unblock = asyncHandler(async (req, res) => {

    await unblockUser(req.user.id, req.params.userId);

    res.status(200).json({
        success: true,
        message: "User unblocked."
    });

});

export const listBlocked = asyncHandler(async (req, res) => {

    const users = await getBlockedUsers(req.user.id);

    res.status(200).json({
        success: true,
        users
    });

});
