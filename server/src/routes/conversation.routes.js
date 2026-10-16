import { Router } from "express";
import authMiddleware from "../middleware/auth.middleware.js";
import { create,getAll,setMuteController } from "../controllers/conversation.controller.js";
import validate from "../middleware/validate.middleware.js";
import {
    createConversationSchema
} from "../validations/conversation.validation.js";
import { muteConversationSchema } from "../validations/conversation.validation.js";

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
    validate(muteConversationSchema),
    setMuteController
);

export default router;
