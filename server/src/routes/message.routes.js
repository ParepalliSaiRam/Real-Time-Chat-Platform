import { Router } from "express";
import authMiddleware from "../middleware/auth.middleware.js";
import validate from "../middleware/validate.middleware.js";
import {
    getMessagesController,
    getMessagesAroundController,
    searchMessagesController,
    sendMessageController,
    editMessageController,
    deleteMessageController,
    deleteForMeController,
    forwardMessagesController,
    toggleReactionController
} from "../controllers/message.controller.js";

import {
    sendMessageSchema,
    editMessageSchema,
    forwardMessagesSchema,
    reactionSchema
} from "../validations/message.validation.js";

const router = Router();

router.post(
    "/messages/forward",
    authMiddleware,
    validate(forwardMessagesSchema),
    forwardMessagesController
);

router.get(
    "/:conversationId/messages",
    authMiddleware,
    getMessagesController
);

router.get(
    "/:conversationId/messages/search",
    authMiddleware,
    searchMessagesController
);

router.get(
    "/:conversationId/messages/around/:messageId",
    authMiddleware,
    getMessagesAroundController
);

router.post(
    "/:conversationId/messages",
    authMiddleware,
    validate(sendMessageSchema),
    sendMessageController
);

router.patch(
    "/:messageId",
    authMiddleware,
    validate(editMessageSchema),
    editMessageController
);

router.delete(
    "/:messageId",
    authMiddleware,
    deleteMessageController
);

router.delete(
    "/:messageId/me",
    authMiddleware,
    deleteForMeController
);

router.post(
    "/:messageId/reactions",
    authMiddleware,
    validate(reactionSchema),
    toggleReactionController
);

export default router;