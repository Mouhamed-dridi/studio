'use client';

import { Download, Eye, EyeOff, Trash2, Mail, Archive, Clipboard } from 'lucide-react';
import { useEffect, useState, useTransition } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import * as XLSX from 'xlsx';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { usePasswordStore, type PasswordRecord, type ArchivedPasswordRecord } from '@/hooks/use-password-store';
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
  const { toast } = useToast();

  const handleCopyToClipboard = () => {
    navigator.clipboard.writeText(password);
    toast({
      title: 'Copied!',
      description: 'Password copied to clipboard.',
    });
  };

  return (
    <div className="flex items-center gap-2">
      <span className="font-mono text-sm">{revealed ? password : '••••••••••••'}</span>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button variant="ghost" size="icon" onClick={() => setRevealed(!revealed)} aria-label={revealed ? "Hide password" : "Show password"}>
            {revealed ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          <p>{revealed ? 'Hide' : 'Show'} password</p>
        </TooltipContent>
      </Tooltip>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button variant="ghost" size="icon" onClick={handleCopyToClipboard} aria-label="Copy password">
            <Clipboard className="h-4 w-4" />
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          <p>Copy password</p>
        </TooltipContent>
      </Tooltip>
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

function ArchiveDialog({ archivedPasswords }: { archivedPasswords: ArchivedPasswordRecord[] }) {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Archive className="mr-2 h-4 w-4" />
          Archive
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>Archived Passwords</DialogTitle>
          <DialogDescription>
            View passwords that have been archived.
          </DialogDescription>
        </DialogHeader>
        <div className="mt-4 max-h-[60vh] overflow-y-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Username</TableHead>
                <TableHead>Password</TableHead>
                <TableHead>Date Deleted</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {archivedPasswords.length > 0 ? (
                archivedPasswords.map((record) => (
                  <TableRow key={record.id}>
                    <TableCell className="font-medium">{record.username}</TableCell>
                    <TableCell>
                      <PasswordCell password={record.password} />
                    </TableCell>
                    <TableCell>{new Date(record.deletionDate).toLocaleString()}</TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={3} className="h-24 text-center">
                    No archived passwords.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
        <DialogFooter>
          <DialogClose asChild>
            <Button type="button" variant="outline">
              Close
            </Button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function PasswordTable() {
  const { passwords, archivePassword, archivedPasswords } = usePasswordStore();
  const [isClient, setIsClient] = useState(false);
  const [recordToArchive, setRecordToArchive] = useState<PasswordRecord | null>(null);

  useEffect(() => {
    setIsClient(true);
  }, []);

  const handleDownloadXlsx = () => {
    const data = passwords.map(p => ({
      Username: p.username,
      Password: p.password,
      'Date of Generation': new Date(p.date).toLocaleString(),
    }));

    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Passwords');

    // Auto-size columns
    const maxWidths = Object.keys(data[0] || {}).map(key => 
      Math.max(key.length, ...data.map(row => String(row[key as keyof typeof row]).length))
    );
    worksheet['!cols'] = maxWidths.map(w => ({ wch: w + 2 }));

    XLSX.writeFile(workbook, `passgenius_backup_${new Date().toISOString().split('T')[0]}.xlsx`);
  };
  
  const confirmArchive = () => {
    if (recordToArchive) {
      archivePassword(recordToArchive.id);
      setRecordToArchive(null);
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
        <div className="flex items-center gap-2">
          {archivedPasswords.length > 0 && <ArchiveDialog archivedPasswords={archivedPasswords} />}
          {passwords.length > 0 && (
            <Button variant="outline" size="sm" onClick={handleDownloadXlsx}>
              <Download className="mr-2 h-4 w-4" />
              Download .XLS
            </Button>
          )}
        </div>
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
                           <AlertDialog open={!!recordToArchive} onOpenChange={(open) => !open && setRecordToArchive(null)}>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                 <Button variant="ghost" size="icon" onClick={() => setRecordToArchive(record)}>
                                    <Trash2 className="h-4 w-4 text-destructive" />
                                  </Button>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>Archive Record</p>
                              </TooltipContent>
                            </Tooltip>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Are you sure you want to archive this record?</AlertDialogTitle>
                                <AlertDialogDescription>
                                  This will move the password record for <span className="font-bold">{recordToArchive?.username}</span> to the archive. You can view it later from the archive section.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel onClick={() => setRecordToArchive(null)}>Cancel</AlertDialogCancel>
                                <AlertDialogAction onClick={confirmArchive} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                                  Archive
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
