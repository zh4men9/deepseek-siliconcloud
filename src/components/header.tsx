import { useUser } from '@clerk/nextjs';
import { ThemeToggle } from '@/components/theme-toggle';

export function Header() {
  const { user } = useUser();

  return (
    <header className="sticky top-0 z-40 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-14 items-center">
        <div className="mr-4 flex">
          <a className="mr-6 flex items-center space-x-2" href="/">
            <span className="font-bold">DeepSeek Chat</span>
          </a>
        </div>
        <div className="flex flex-1 items-center justify-end space-x-4">
          {user && (
            <span className="text-sm text-muted-foreground">
              {user.emailAddresses[0]?.emailAddress}
            </span>
          )}
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
} 