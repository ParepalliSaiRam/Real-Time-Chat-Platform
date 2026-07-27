import { z } from "zod";

export const registerSchema = z.object({
    username: z
    .string()
    .trim()
    .min(3)
    .max(30),

email: z
    .email()
    .transform(email => email.toLowerCase()),

password: z
    .string()
    .min(6)
    .max(100)
});

export const loginSchema = z.object({
    email: z
    .email()
    .transform(email => email.toLowerCase()),

password: z
    .string()
    .min(6)
    .max(100)
});