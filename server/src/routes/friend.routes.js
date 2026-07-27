import { Router } from "express";
import authMiddleware from "../middleware/auth.middleware.js";
import {
    sendRequest,
    getRequests,
    acceptRequest,
    rejectRequest,
    getFriendsList
} from "../controllers/friend.controller.js";
import validate from "../middleware/validate.middleware.js";
import {
    sendFriendRequestSchema,
    acceptFriendRequestSchema,
    rejectFriendRequestSchema
} from "../validations/friend.validation.js";

const router = Router();

router.post(
    "/request",
    authMiddleware,
    validate(sendFriendRequestSchema),
    sendRequest
);

router.get(
    "/requests",
    authMiddleware,
    getRequests
);

router.post(
    "/accept",
    authMiddleware,
    validate(acceptFriendRequestSchema),
    acceptRequest
);

router.post(
    "/reject",
    authMiddleware,
    validate(rejectFriendRequestSchema),
    rejectRequest
);

router.get(
    "/",
    authMiddleware,
    getFriendsList
);

export default router;