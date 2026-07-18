import { z } from 'zod';

export const loginSchema = z.object({
  email: z.string().min(1, 'Email is required').email('Enter a valid email'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});
export type LoginInput = z.infer<typeof loginSchema>;

export const registerSchema = z
  .object({
    firstName: z.string().min(1, 'First name is required'),
    lastName: z.string().min(1, 'Last name is required'),
    email: z.string().min(1, 'Email is required').email('Enter a valid email'),
    password: z.string().min(8, 'Password must be at least 8 characters'),
    confirmPassword: z.string(),
  })
  .refine((d) => d.password === d.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });
export type RegisterInput = z.infer<typeof registerSchema>;

export const forgotPasswordSchema = z.object({
  email: z.string().min(1, 'Email is required').email('Enter a valid email'),
});
export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>;

export const bodyStatsSchema = z.object({
  heightCm: z.coerce.number().min(100, 'Enter a valid height').max(250, 'Enter a valid height'),
  weightKg: z.coerce.number().min(30, 'Enter a valid weight').max(300, 'Enter a valid weight'),
});
export type BodyStatsInput = z.infer<typeof bodyStatsSchema>;
