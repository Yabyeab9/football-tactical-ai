import { ModeToggle } from '@/components/common/ModeToggle';
import { MobileNav } from './AppSidebar';

export function AppHeader() {
  return (
    <header className="sticky top-0 z-40 w-full border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="flex h-16 items-center gap-4 px-4 md:px-6">
        <MobileNav />
        <div className="flex-1" />
        <ModeToggle />
      </div>
    </header>
  );
}
