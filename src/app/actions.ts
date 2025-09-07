'use server';

import { generatePassword } from '@/ai/flows/generate-password';
import { z } from 'zod';

const schema = z.object({
  username: z.string().min(1, 'Username is required.'),
});

export async function generatePasswordAction(prevState: any, formData: FormData) {
  try {
    const validatedFields = schema.safeParse({
      username: formData.get('username'),
    });

    if (!validatedFields.success) {
      return {
        message: 'Validation failed',
        errors: validatedFields.error.flatten().fieldErrors,
        password: null,
      };
    }
    
    const { password } = await generatePassword({ username: validatedFields.data.username });
    
    return {
      message: 'Password generated successfully.',
      errors: null,
      password: password,
    };
  } catch (error) {
    console.error(error);
    return {
      message: 'An unexpected error occurred.',
      errors: null,
      password: null,
    };
  }
}
