import { Router } from "express";
import authMiddleware from "../middleware/auth.middleware.js";
import {
  deleteSubscriptionController,
  getPublicKeyController,
  saveSubscriptionController,
} from "../controllers/push.controller.js";

const router = Router();

router.get("/public-key", getPublicKeyController);
router.post("/subscriptions", authMiddleware, saveSubscriptionController);
router.delete("/subscriptions", authMiddleware, deleteSubscriptionController);

export default router;
