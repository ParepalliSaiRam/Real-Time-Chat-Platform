import prisma from "../config/prisma.js";
import bcrypt from "bcrypt";
import AppError from "../utils/AppError.js";
import { generateToken } from "../utils/jwt.js";

export const registerUser = async ({ username, email, password }) => {
    const existingUser = await prisma.user.findFirst({
        where: { OR: [{ username }, { email }] }
    });

    if (existingUser) {
        if (existingUser.username === username) throw new AppError("Username already exists", 409);
        throw new AppError("Email already exists", 409);
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    return prisma.user.create({
        data: {
            username,
            email,
            password: hashedPassword
        }
    });
};

export const loginUser = async ({ email, password }) => {
    const user = await prisma.user.findUnique({
        where: {
            email
        }
    });

    if (!user || !(await bcrypt.compare(password, user.password))) {
        throw new AppError("Invalid email or password", 401);
    }

    const token = generateToken(user.id);

    return {
        token,
        user: {
            id: user.id,
            username: user.username,
            email: user.email,
            phone: user.phone,
            avatarUrl: user.avatarUrl,
            bio: user.bio
        }
    };
};
