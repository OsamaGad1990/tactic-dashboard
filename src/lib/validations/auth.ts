import { z } from 'zod';

// Login form validation schema - supports email or username
export const loginSchema = z.object({
    identifier: z
        .string()
        .min(1, 'identifier_required')
        .refine(
            (val) => {
                // Check if it's an email or username (min 3 chars)
                const isEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val);
                const isUsername = val.length >= 3;
                return isEmail || isUsername;
            },
            { message: 'identifier_invalid' }
        ),
    password: z
        .string()
        .min(1, 'password_required')
        .min(6, 'password_min'),
    rememberMe: z.boolean().default(false),
});

export type LoginFormData = z.infer<typeof loginSchema>;

// Code login form validation schema - for activation code login
export const codeLoginSchema = z.object({
    identifier: z
        .string()
        .min(1, 'identifier_required')
        .refine(
            (val) => {
                const isEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val);
                const isUsername = val.length >= 3;
                return isEmail || isUsername;
            },
            { message: 'identifier_invalid' }
        ),
    code: z
        .string()
        .min(1, 'code_required')
        .length(6, 'code_invalid'),
    rememberMe: z.boolean().default(false),
});

export type CodeLoginFormData = z.infer<typeof codeLoginSchema>;

// Helper to check if identifier is email
export function isEmail(identifier: string): boolean {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(identifier);
}

// Forgot password schema
export const forgotPasswordSchema = z.object({
    email: z
        .string()
        .min(1, 'email_required')
        .email('email_invalid'),
});

export type ForgotPasswordFormData = z.infer<typeof forgotPasswordSchema>;

// Change password schema (for first login)
export const changePasswordSchema = z.object({
    newPassword: z
        .string()
        .min(1, 'password_required')
        .min(6, 'password_min'),
    confirmPassword: z
        .string()
        .min(1, 'password_required'),
}).refine((data) => data.newPassword === data.confirmPassword, {
    message: 'passwords_not_match',
    path: ['confirmPassword'],
});

export type ChangePasswordFormData = z.infer<typeof changePasswordSchema>;
