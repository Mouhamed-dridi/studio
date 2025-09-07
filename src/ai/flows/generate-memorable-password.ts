'use server';
/**
 * @fileOverview A flow for generating memorable passwords.
 *
 * - generateMemorablePassword - A function that generates a memorable password.
 * - GenerateMemorablePasswordInput - The input type for the generateMemorablePassword function.
 * - GenerateMemorablePasswordOutput - The return type for the generateMemorablePassword function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'zod';

const GenerateMemorablePasswordInputSchema = z.object({
  topic: z.string().describe('A topic or name to base the password on, like an application name or a username.'),
});
export type GenerateMemorablePasswordInput = z.infer<typeof GenerateMemorablePasswordInputSchema>;

const GenerateMemorablePasswordOutputSchema = z.object({
    password: z.string().describe('The generated memorable password.'),
});
export type GenerateMemorablePasswordOutput = z.infer<typeof GenerateMemorablePasswordOutputSchema>;


export async function generateMemorablePassword(input: GenerateMemorablePasswordInput): Promise<GenerateMemorablePasswordOutput> {
    return generateMemorablePasswordFlow(input);
}


const prompt = ai.definePrompt({
  name: 'generateMemorablePasswordPrompt',
  input: {schema: GenerateMemorablePasswordInputSchema},
  output: {schema: GenerateMemorablePasswordOutputSchema},
  prompt: `You are an expert in creating memorable, yet secure passwords.
Create a password based on the topic: {{{topic}}}.

The password should be a short phrase of 2-3 unrelated words.
It must include at least one uppercase letter, one number, and one special character.
The total length should be between 12 and 16 characters.

Example for topic "Google":
HappyDolphin!8

Example for topic "My Bank":
RainyCat$23

Do not use the topic directly in the password.
Generate a password for the topic: {{{topic}}}.
`,
});

const generateMemorablePasswordFlow = ai.defineFlow(
  {
    name: 'generateMemorablePasswordFlow',
    inputSchema: GenerateMemorablePasswordInputSchema,
    outputSchema: GenerateMemorablePasswordOutputSchema,
  },
  async (input) => {
    const {output} = await prompt(input);
    return output!;
  }
);
