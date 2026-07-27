import asyncHandler from "../utils/asyncHandler.js";
import AppError from "../utils/AppError.js";
import {
    searchUsers,
    getCurrentUser,
    updateProfile,
    updateAvatar
} from "../services/user.service.js";

export const search = asyncHandler(async (req, res) => {
    const users = await searchUsers(
        req.query.query || "",
        req.user.id
    );

    res.status(200).json({
        success: true,
        users
    });
});

export const me = asyncHandler(async (req, res) => {

    const user = await getCurrentUser(req.user.id);

    res.status(200).json({

        success: true,

        user

    });

});

export const updateProfileController = asyncHandler(async (req, res) => {

    const user = await updateProfile(req.user.id, req.body);

    res.status(200).json({

        success: true,

        user

    });

});

export const updateAvatarController = asyncHandler(async (req, res) => {

    if (!req.file) {
        throw new AppError("No file uploaded.", 400);
    }

    const user = await updateAvatar(req.user.id, req.file);

    res.status(200).json({

        success: true,

        user

    });

});