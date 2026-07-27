import { registerUser } from "../services/auth.service.js";
import asyncHandler from "../utils/asyncHandler.js";
import { loginUser } from "../services/auth.service.js";

export const register = asyncHandler(async (req, res) => {
    await registerUser(req.body);

    res.status(201).json({
        success: true,
        message: "User registered successfully"
    });
});

export const login = asyncHandler(async (req, res) => {
    const result = await loginUser(req.body);

    res.status(200).json({
        success: true,
        message: "Login successful",
        ...result
    });
});

export const getCurrentUser = asyncHandler(async (req, res) => {
    res.status(200).json({
        success: true,
        user: req.user
    });
});