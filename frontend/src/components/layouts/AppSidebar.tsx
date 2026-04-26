import {
  Activity,
  BrainCircuit,
  ClipboardList,
  LayoutDashboard,
  Shield,
  Menu,
  ShieldAlert,
  Sparkles,
  Target,
  Users,
  UserRoundSearch,
  WandSparkles,
} from "lucide-react";
import { Link, useLocation } from "react-router-dom";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";

const navigation = [
  { name: "Overview Dashboard", href: "/", icon: LayoutDashboard, subtitle: "System intelligence snapshot" },
  { name: "Live Matches", href: "/matches", icon: Activity, subtitle: "Multi-provider match feed" },
  { name: "Teams", href: "/teams", icon: Users, subtitle: "Squads, coaches, and team strength" },
  { name: "Managers", href: "/managers", icon: Shield, subtitle: "Coach style and tactical identity" },
  { name: "Match Analysis Hub", href: "/analysis", icon: ClipboardList, subtitle: "Timeline and match context" },
  { name: "Player Intelligence", href: "/players", icon: UserRoundSearch, subtitle: "Per-90 and contribution metrics" },
  { name: "Tactical Engine", href: "/tactical-engine", icon: Target, subtitle: "Formations, edges, predictions" },
  { name: "Injury Center", href: "/injury-center", icon: ShieldAlert, subtitle: "Risk watch and load management" },
  { name: "AI Football Assistant", href: "/ai-assistant", icon: BrainCircuit, subtitle: "Manager-style analyst chat" },
  { name: "Predictions Hub", href: "/predictions", icon: WandSparkles, subtitle: "Scenario board and outcomes" },
];

function NavLinks({ onNavigate }: { onNavigate?: () => void }) {
  const location = useLocation();

  return (
    <nav className="space-y-2">
      {navigation.map((item) => {
        const isActive = location.pathname === item.href || (item.href !== "/" && location.pathname.startsWith(item.href));
        return (
          <Link
            key={item.name}
            to={item.href}
            onClick={onNavigate}
            className={cn(
              "flex items-start gap-3 rounded-2xl border px-4 py-3 transition-all",
              isActive
                ? "border-primary/30 bg-primary/10 text-foreground shadow-sm"
                : "border-transparent text-muted-foreground hover:border-border hover:bg-card"
            )}
          >
            <item.icon className="mt-0.5 h-5 w-5 shrink-0" />
            <div>
              <div className="text-sm font-semibold">{item.name}</div>
              <div className="text-xs text-muted-foreground">{item.subtitle}</div>
            </div>
          </Link>
        );
      })}
    </nav>
  );
}

function SidebarBody({ onNavigate }: { onNavigate?: () => void }) {
  return (
    <div className="flex h-full flex-col">
      <div className="border-b border-border/60 p-6">
        <Link to="/" className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-[1.2rem] bg-primary text-primary-foreground shadow-lg shadow-primary/20">
            <Sparkles className="h-5 w-5" />
          </div>
          <div>
            <div className="text-lg font-black tracking-tight">Football Intelligence OS</div>
            <div className="text-xs text-muted-foreground">AI-powered match operations platform</div>
          </div>
        </Link>
      </div>

      <ScrollArea className="flex-1 p-4">
        <NavLinks onNavigate={onNavigate} />
      </ScrollArea>

      <div className="border-t border-border/60 p-4">
        <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/5 p-4">
          <div className="text-sm font-semibold">Aggregation layer</div>
          <p className="mt-2 text-xs leading-5 text-muted-foreground">
            Live providers, historical intelligence, tactical inference, injury risk, and manager-style AI all route through the backend service layer.
          </p>
        </div>
      </div>
    </div>
  );
}

export function AppSidebar() {
  return (
    <aside className="hidden w-80 shrink-0 border-r border-border/60 bg-[radial-gradient(circle_at_top,_rgba(16,185,129,0.14),_transparent_38%),linear-gradient(180deg,_rgba(15,23,42,0.02),_transparent)] lg:block">
      <SidebarBody />
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
      <SheetContent side="left" className="w-80 p-0">
        <SidebarBody
          onNavigate={() => {
            const closeButton = document.querySelector('[data-state="open"] button[aria-label="Close"]') as HTMLButtonElement | null;
            closeButton?.click();
          }}
        />
      </SheetContent>
    </Sheet>
  );
}
