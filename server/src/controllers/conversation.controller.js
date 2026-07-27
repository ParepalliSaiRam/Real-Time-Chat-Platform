import asyncHandler from "../utils/asyncHandler.js";
import {
    createConversation,
    getConversations,
    toggleMute
 } from "../services/conversation.service.js";

export const create = asyncHandler(async (req, res) => {

    const { userId } = req.body;

    const conversation = await createConversation(
        req.user.id,
        userId
    );

    res.status(201).json({
        success: true,
        conversation
    });

});

export const getAll = asyncHandler(async (req, res) => {

    const conversations = await getConversations(req.user.id);

    res.json({

        success: true,

        conversations

    });

});

export const toggleMuteController = asyncHandler(async (req, res) => {

    const participant = await toggleMute(req.params.id, req.user.id);

    res.json({

        success: true,

        mutedAt: participant.mutedAt

    });

});