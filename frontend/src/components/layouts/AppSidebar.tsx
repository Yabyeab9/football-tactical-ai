import { Link, useLocation } from 'react-router';
import {
  LayoutDashboard,
  Trophy,
  Users,
  UserCircle,
  Target,
  Search,
  Bot,
  BarChart3,
  Settings,
  Menu,
  Activity,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';

const navigation = [
  { name: 'Dashboard', href: '/', icon: LayoutDashboard },
  { name: 'Matches', href: '/matches', icon: Activity },
  { name: 'Teams', href: '/teams', icon: Users },
  { name: 'Players', href: '/players', icon: UserCircle },
  { name: 'Tactical Lab', href: '/tactical-lab', icon: Target },
  { name: 'Scouting', href: '/scouting', icon: Search },
  { name: 'AI Assistant', href: '/ai-assistant', icon: Bot },
  { name: 'Analytics', href: '/analytics', icon: BarChart3 },
  { name: 'Competitions', href: '/competitions', icon: Trophy },
  { name: 'Settings', href: '/settings', icon: Settings },
];

function NavLinks({ onNavigate }: { onNavigate?: () => void }) {
  const location = useLocation();

  return (
    <nav className="space-y-1">
      {navigation.map((item) => {
        const isActive = location.pathname === item.href;
        return (
          <Link
            key={item.name}
            to={item.href}
            onClick={onNavigate}
            className={cn(
              'flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-lg transition-colors',
              isActive
                ? 'bg-primary text-primary-foreground'
                : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
            )}
          >
            <item.icon className="h-5 w-5 shrink-0" />
            {item.name}
          </Link>
        );
      })}
    </nav>
  );
}

export function AppSidebar() {
  return (
    <aside className="hidden lg:block w-64 border-r border-border bg-sidebar shrink-0">
      <div className="flex flex-col h-full">
        <div className="p-6 border-b border-sidebar-border">
          <Link to="/" className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center">
              <Trophy className="h-5 w-5 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-sidebar-foreground">Football Tactical AI</h1>
              <p className="text-xs text-muted-foreground">Advanced Analytics</p>
            </div>
          </Link>
        </div>
        <ScrollArea className="flex-1 p-4">
          <NavLinks />
        </ScrollArea>
        <div className="p-4 border-t border-sidebar-border">
          <div className="text-xs text-muted-foreground">
            <p>Powered by StatsBomb Data</p>
            <p className="mt-1">© 2026 Football Tactical AI</p>
          </div>
        </div>
      </div>
    </aside>
  );
}

export function MobileNav() {
  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="outline" size="icon" className="lg:hidden">
          <Menu className="h-5 w-5" />
          <span className="sr-only">Toggle navigation menu</span>
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="w-64 p-0">
        <div className="flex flex-col h-full">
          <div className="p-6 border-b border-border">
            <Link to="/" className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center">
                <Trophy className="h-5 w-5 text-primary-foreground" />
              </div>
              <div>
                <h1 className="text-lg font-bold">Football Tactical AI</h1>
                <p className="text-xs text-muted-foreground">Advanced Analytics</p>
              </div>
            </Link>
          </div>
          <ScrollArea className="flex-1 p-4">
            <NavLinks onNavigate={() => {
              const closeButton = document.querySelector('[data-state="open"] button[aria-label="Close"]') as HTMLButtonElement;
              closeButton?.click();
            }} />
          </ScrollArea>
        </div>
      </SheetContent>
    </Sheet>
  );
}
