import { Router } from "express";

import authMiddleware from "../middleware/auth.middleware.js";
import validate from "../middleware/validate.middleware.js";
import { uploadSingle } from "../middleware/upload.middleware.js";
import { createStatusSchema } from "../validations/status.validation.js";
import {
    createStatusController,
    getFeedController,
    getUserStatusesController,
    markViewedController,
    getViewersController,
    deleteStatusController
} from "../controllers/status.controller.js";

const router = Router();

router.post(
    "/",
    authMiddleware,
    uploadSingle,
    validate(createStatusSchema),
    createStatusController
);

router.get(
    "/feed",
    authMiddleware,
    getFeedController
);

router.get(
    "/user/:userId",
    authMiddleware,
    getUserStatusesController
);

router.post(
    "/:id/view",
    authMiddleware,
    markViewedController
);

router.get(
    "/:id/viewers",
    authMiddleware,
    getViewersController
);

router.delete(
    "/:id",
    authMiddleware,
    deleteStatusController
);

export default router;
