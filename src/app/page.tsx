import { KeyRound } from 'lucide-react';
import { PasswordGenerator } from '@/components/password-generator';
import { PasswordTable } from '@/components/password-table';

export default function Home() {
  return (
    <div className="flex flex-col min-h-dvh bg-background">
      <header className="sticky top-0 z-10 border-b bg-card/80 backdrop-blur-sm">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            <div className="flex items-center gap-2">
              <KeyRound className="h-7 w-7 text-primary" />
              <h1 className="text-xl font-bold tracking-tight text-foreground sm:text-2xl">
                PassGenius
              </h1>
            </div>
          </div>
        </div>
      </header>
      <main className="flex-1">
        <div className="container mx-auto px-4 py-8 sm:px-6 lg:px-8">
          <div className="grid gap-8">
            <PasswordGenerator />
            <PasswordTable />
          </div>
        </div>
      </main>
      <footer className="py-4">
        <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
          <p>&copy; {new Date().getFullYear()} PassGenius. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
