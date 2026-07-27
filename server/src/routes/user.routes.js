import { Router } from "express";
import authMiddleware from "../middleware/auth.middleware.js";
import validate from "../middleware/validate.middleware.js";
import { uploadSingle } from "../middleware/upload.middleware.js";
import {
    search,
    me,
    updateProfileController,
    updateAvatarController
} from "../controllers/user.controller.js";
import { block, unblock, listBlocked } from "../controllers/block.controller.js";
import { updateProfileSchema } from "../validations/user.validation.js";

const router = Router();

router.get("/me", authMiddleware, me);
router.patch("/me", authMiddleware, validate(updateProfileSchema), updateProfileController);
router.post("/me/avatar", authMiddleware, uploadSingle, updateAvatarController);
router.get("/search", authMiddleware, search);
router.get("/blocked", authMiddleware, listBlocked);
router.post("/:userId/block", authMiddleware, block);
router.delete("/:userId/block", authMiddleware, unblock);

export default router;