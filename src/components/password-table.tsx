'use client';

import { Download, Eye, EyeOff, Trash2, Mail } from 'lucide-react';
import { useEffect, useState, useTransition } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { usePasswordStore, type PasswordRecord } from '@/hooks/use-password-store';
import { useToast } from '@/hooks/use-toast';
import { sendPasswordByEmail } from '@/app/actions';

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog';
import { Input } from './ui/input';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from './ui/form';


function PasswordCell({ password }: { password: string }) {
  const [revealed, setRevealed] = useState(false);

  return (
    <div className="flex items-center gap-2">
      <span className="font-mono text-sm">{revealed ? password : '••••••••••••'}</span>
      <Button variant="ghost" size="icon" onClick={() => setRevealed(!revealed)} aria-label={revealed ? "Hide password" : "Show password"}>
        {revealed ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
      </Button>
    </div>
  );
}

const emailFormSchema = z.object({
  email: z.string().email('Please enter a valid email address.'),
});

type EmailFormSchema = z.infer<typeof emailFormSchema>;


function SendEmailDialog({ record }: { record: PasswordRecord }) {
  const { toast } = useToast();
  const [isPending, startTransition] = useTransition();
  const [open, setOpen] = useState(false);
  const form = useForm<EmailFormSchema>({
    resolver: zodResolver(emailFormSchema),
    defaultValues: { email: '' },
  });

  const handleSubmit = (values: EmailFormSchema) => {
    startTransition(async () => {
      const result = await sendPasswordByEmail({
        to: values.email,
        username: record.username,
        password: record.password,
        date: record.date,
      });

      if (result.success) {
        toast({
          title: 'Email Sent!',
          description: `Password details sent to ${values.email}.`,
        });
        setOpen(false);
        form.reset();
      } else {
        toast({
          title: 'Error',
          description: result.error || 'Failed to send email.',
          variant: 'destructive',
        });
      }
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <Tooltip>
        <TooltipTrigger asChild>
          <DialogTrigger asChild>
            <Button variant="ghost" size="icon">
              <Mail className="h-4 w-4 text-primary" />
            </Button>
          </DialogTrigger>
        </TooltipTrigger>
        <TooltipContent>
          <p>Send by Email</p>
        </TooltipContent>
      </Tooltip>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Send Password by Email</DialogTitle>
          <DialogDescription>
            Enter the email address to send the password for <span className="font-bold">{record.username}</span>.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Recipient Email</FormLabel>
                  <FormControl>
                    <Input placeholder="recipient@example.com" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
              <DialogClose asChild>
                <Button type="button" variant="outline">
                  Cancel
                </Button>
              </DialogClose>
              <Button type="submit" disabled={isPending}>
                {isPending ? 'Sending...' : 'Send Email'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}


export function PasswordTable() {
  const { passwords, removePassword } = usePasswordStore();
  const [isClient, setIsClient] = useState(false);
  const [recordToDelete, setRecordToDelete] = useState<PasswordRecord | null>(null);

  useEffect(() => {
    setIsClient(true);
  }, []);

  const handleDownloadCsv = () => {
    const headers = ['Username', 'Date', 'Password'];
    const rows = passwords.map(p => [
      `"${p.username.replace(/"/g, '""')}"`,
      p.date,
      `"${p.password.replace(/"/g, '""')}"`,
    ]);

    const csvContent = [headers.join(','), ...rows.map(row => row.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    if (link.href) {
      URL.revokeObjectURL(link.href);
    }
    link.href = URL.createObjectURL(blob);
    link.download = `passgenius_backup_${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };
  
  const confirmDelete = () => {
    if (recordToDelete) {
      removePassword(recordToDelete.id);
      setRecordToDelete(null);
    }
  };


  if (!isClient) {
    return (
       <Card className="shadow-lg">
        <CardHeader>
          <CardTitle>Password Vault</CardTitle>
        </CardHeader>
        <CardContent>
          <p>Loading passwords...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="shadow-lg">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Password Vault</CardTitle>
        {passwords.length > 0 && (
          <Button variant="outline" size="sm" onClick={handleDownloadCsv}>
            <Download className="mr-2 h-4 w-4" />
            Download CSV
          </Button>
        )}
      </CardHeader>
      <CardContent>
        <TooltipProvider>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Username</TableHead>
                  <TableHead>Date Generated</TableHead>
                  <TableHead>Password</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {passwords.length > 0 ? (
                  passwords.map((record) => (
                    <TableRow key={record.id}>
                      <TableCell className="font-medium">{record.username}</TableCell>
                      <TableCell>{new Date(record.date).toLocaleDateString()}</TableCell>
                      <TableCell>
                        <PasswordCell password={record.password} />
                      </TableCell>
                       <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                           <SendEmailDialog record={record} />
                           <AlertDialog>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                 <AlertDialogTrigger asChild>
                                  <Button variant="ghost" size="icon" onClick={() => setRecordToDelete(record)}>
                                    <Trash2 className="h-4 w-4 text-destructive" />
                                  </Button>
                                </AlertDialogTrigger>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>Delete Record</p>
                              </TooltipContent>
                            </Tooltip>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                                <AlertDialogDescription>
                                  This action cannot be undone. This will permanently delete the password record for <span className="font-bold">{record.username}</span>.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel onClick={() => setRecordToDelete(null)}>Cancel</AlertDialogCancel>
                                <AlertDialogAction onClick={confirmDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                                  Delete
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={4} className="h-24 text-center">
                      No passwords generated yet.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </TooltipProvider>
      </CardContent>
    </Card>
  );
}
