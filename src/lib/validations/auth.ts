import { z } from 'zod';

// Login form validation schema
export const loginSchema = z.object({
    email: z
        .string()
        .min(1, 'email_required')
        .email('email_invalid'),
    password: z
        .string()
        .min(1, 'password_required')
        .min(6, 'password_min'),
    rememberMe: z.boolean().default(false),
});

export type LoginFormData = z.infer<typeof loginSchema>;

// Forgot password schema
export const forgotPasswordSchema = z.object({
    email: z
        .string()
        .min(1, 'email_required')
        .email('email_invalid'),
});

export type ForgotPasswordFormData = z.infer<typeof forgotPasswordSchema>;
