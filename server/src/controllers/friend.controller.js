import asyncHandler from "../utils/asyncHandler.js";
import { sendFriendRequest } from "../services/friend.service.js";
import { getPendingRequests } from "../services/friend.service.js";
import { acceptFriendRequest } from "../services/friend.service.js";
import { rejectFriendRequest } from "../services/friend.service.js";
import { getFriends } from "../services/friend.service.js";

export const sendRequest = asyncHandler(async (req, res) => {

    const { receiverId } = req.body;

    await sendFriendRequest(req.user.id, receiverId);

    res.status(201).json({
        success: true,
        message: "Friend request sent successfully."
    });

});

export const getRequests = asyncHandler(async (req, res) => {

    const requests = await getPendingRequests(req.user.id);

    res.status(200).json({
        success: true,
        requests
    });

});

export const acceptRequest = asyncHandler(async (req, res) => {

    const { requestId } = req.body;

    await acceptFriendRequest(requestId, req.user.id);

    res.status(200).json({
        success: true,
        message: "Friend request accepted."
    });

});

export const rejectRequest = asyncHandler(async (req, res) => {

    const { requestId } = req.body;

    await rejectFriendRequest(requestId, req.user.id);

    res.status(200).json({
        success: true,
        message: "Friend request rejected."
    });

});

export const getFriendsList = asyncHandler(async (req, res) => {

    const friends = await getFriends(req.user.id);

    res.status(200).json({
        success: true,
        friends
    });

});