import { Router } from "express";
import {
    register,
    login,
    getCurrentUser
} from "../controllers/auth.controller.js";
import authMiddleware from "../middleware/auth.middleware.js";
import validate from "../middleware/validate.middleware.js";
import {
    registerSchema,
    loginSchema
} from "../validations/auth.validation.js";

const router = Router();

router.post(
    "/register",
    validate(registerSchema),
    register
);

router.post(
    "/login",
    validate(loginSchema),
    login
);
router.get("/me", authMiddleware, getCurrentUser);

export default router;