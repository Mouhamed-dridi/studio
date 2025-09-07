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

const formSchema = z.object({
  username: z.string().min(1, 'Username or application name is required.'),
});

type FormSchema = z.infer<typeof formSchema>;

const generatePassword = () => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*()';
  let password = '';
  for (let i = 0; i < 12; i++) {
    password += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return password;
};


export function PasswordGenerator() {
  const { addPassword } = usePasswordStore();
  const { toast } = useToast();
  const [generatedPassword, setGeneratedPassword] = useState<string | null>(null);

  const form = useForm<FormSchema>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      username: '',
    },
  });

  const onSubmit = (data: FormSchema) => {
    const newPassword = generatePassword();
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
      description: 'A new password has been generated and saved.',
    });
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
             <Button type="submit" aria-label="Generate Password">
              <Wand2 className="mr-2 h-4 w-4" />
              Generate Password
            </Button>
          </CardFooter>
        </form>
      </Form>
    </Card>
  );
}
