'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { Clipboard, Wand2 } from 'lucide-react';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { usePasswordStore } from '@/hooks/use-password-store';
import { generateMemorablePassword } from '@/ai/flows/generate-memorable-password';

const formSchema = z.object({
  username: z.string().min(1, 'Username or application name is required.'),
});

type FormSchema = z.infer<typeof formSchema>;


export function PasswordGenerator() {
  const { addPassword } = usePasswordStore();
  const { toast } = useToast();
  const [generatedPassword, setGeneratedPassword] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);

  const form = useForm<FormSchema>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      username: '',
    },
  });

  const onSubmit = async (data: FormSchema) => {
    setIsGenerating(true);
    setGeneratedPassword(null);
    try {
      const result = await generateMemorablePassword({ topic: data.username });
      const newPassword = result.password;
      setGeneratedPassword(newPassword);

      const newRecord = {
        id: crypto.randomUUID(),
        username: data.username,
        password: newPassword,
        date: new Date().toISOString(),
      };
      addPassword(newRecord);

      toast({
        title: 'Success!',
        description: 'A new memorable password has been generated and saved.',
      });
    } catch (error) {
       toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to generate password. Please try again.',
      });
      console.error(error);
    } finally {
        setIsGenerating(false);
    }
  };
  
  const handleCopyToClipboard = () => {
    if (generatedPassword) {
      navigator.clipboard.writeText(generatedPassword);
      toast({
        title: 'Copied!',
        description: 'Password copied to clipboard.',
      });
    }
  };


  return (
    <Card className="w-full shadow-lg">
      <CardHeader>
        <CardTitle>Create a Secure Password</CardTitle>
        <CardDescription>Enter a username or application name to generate a strong, unique password.</CardDescription>
      </CardHeader>
      <Form {...form}>
        <form
          onSubmit={form.handleSubmit(onSubmit)}
          className="space-y-6"
        >
          <CardContent className="space-y-4">
            <FormField
              control={form.control}
              name="username"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Username / App Name</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., Google Account" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            {generatedPassword && (
              <div className="space-y-2">
                <Label htmlFor="generated-password">Generated Password</Label>
                <div className="flex gap-2">
                  <Input id="generated-password" value={generatedPassword} readOnly className="font-mono" />
                  <Button variant="outline" size="icon" onClick={handleCopyToClipboard} type="button" aria-label="Copy password">
                    <Clipboard className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
          <CardFooter className="justify-center">
             <Button type="submit" aria-label="Generate Password" disabled={isGenerating}>
              {isGenerating ? (
                <>
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Generating...
                </>
              ) : (
                <>
                  <Wand2 className="mr-2 h-4 w-4" />
                  Generate Password
                </>
              )}
            </Button>
          </CardFooter>
        </form>
      </Form>
    </Card>
  );
}
