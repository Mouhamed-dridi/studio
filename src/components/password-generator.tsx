'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { Clipboard, Loader2, Wand2 } from 'lucide-react';
import { useEffect, useRef, useState, useActionState } from 'react';
import { useFormStatus } from 'react-dom';
import { useForm } from 'react-hook-form';
import { z } from 'zod';

import { generatePasswordAction } from '@/app/actions';
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

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" className="w-full sm:w-auto" disabled={pending} aria-label="Generate Password">
      {pending ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          Generating...
        </>
      ) : (
        <>
          <Wand2 className="mr-2 h-4 w-4" />
          Generate Password
        </>
      )}
    </Button>
  );
}

const initialState = {
  message: '',
  errors: null,
  password: null,
};

export function PasswordGenerator() {
  const { addPassword } = usePasswordStore();
  const { toast } = useToast();
  const [generatedPassword, setGeneratedPassword] = useState<string | null>(null);

  const [state, formAction] = useActionState(generatePasswordAction, initialState);

  const form = useForm<FormSchema>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      username: '',
    },
  });
  
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state.message) {
      if (state.password) {
        setGeneratedPassword(state.password);
        const newRecord = {
          id: crypto.randomUUID(),
          username: form.getValues('username'),
          password: state.password,
          date: new Date().toISOString(),
        };
        addPassword(newRecord);
        toast({
          title: 'Success!',
          description: 'A new secure password has been generated and saved.',
        });
      } else if (state.errors || state.message === 'An unexpected error occurred.') {
        toast({
          variant: 'destructive',
          title: 'Uh oh! Something went wrong.',
          description: state.message || 'Failed to generate password.',
        });
      }
    }
  }, [state, addPassword, toast, form]);

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
        <CardDescription>Enter a username or application name to generate a strong, unique password using AI.</CardDescription>
      </CardHeader>
      <Form {...form}>
        <form
          ref={formRef}
          action={formAction}
          onSubmit={form.handleSubmit(() => form.trigger())}
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
          <CardFooter>
            <SubmitButton />
          </CardFooter>
        </form>
      </Form>
    </Card>
  );
}
