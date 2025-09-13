// api/src/auth/auth.validation.ts
import { z } from 'zod';

export const loginSchema = z.object({
  body: z.object({ // <--- ADD THIS WRAPPER
    email: z.string().email('Invalid email address'),
    password: z.string().min(6, 'Password must be at least 6 characters long'),
  }), // <--- AND CLOSE THE WRAPPER HERE
});

// IMPORTANT: Also update the LoginInput type to match the new schema structure
// It should now infer from the 'body' part of the schema
export type LoginInput = z.infer<typeof loginSchema>['body'];