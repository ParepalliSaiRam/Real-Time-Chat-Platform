import { Router } from "express";
import authMiddleware from "../middleware/auth.middleware.js";
import { create,getAll,toggleMuteController } from "../controllers/conversation.controller.js";
import validate from "../middleware/validate.middleware.js";
import {
    createConversationSchema
} from "../validations/conversation.validation.js";

const router = Router();

router.post(
    "/",
    authMiddleware,
    validate(createConversationSchema),
    create
);

router.get(
    "/",
    authMiddleware,
    getAll
);

router.patch(
    "/:id/mute",
    authMiddleware,
    toggleMuteController
);

export default router;