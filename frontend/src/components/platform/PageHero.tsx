import type { ReactNode } from "react";

import { Badge } from "@/components/ui/badge";

type PageHeroProps = {
  eyebrow: string;
  title: string;
  description: string;
  actions?: ReactNode;
  badge?: string;
};

export function PageHero({ eyebrow, title, description, actions, badge }: PageHeroProps) {
  return (
    <section className="overflow-hidden rounded-[2rem] border border-border/60 bg-[linear-gradient(135deg,rgba(16,185,129,0.12),rgba(15,23,42,0.95)_55%,rgba(59,130,246,0.12))] p-8 text-white shadow-2xl shadow-emerald-950/10">
      <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
        <div className="max-w-3xl">
          <div className="text-xs uppercase tracking-[0.35em] text-emerald-200">{eyebrow}</div>
          <h1 className="mt-4 text-4xl font-black tracking-tight sm:text-5xl">{title}</h1>
          <p className="mt-4 max-w-2xl text-sm leading-6 text-white/75">{description}</p>
        </div>
        <div className="flex flex-col items-start gap-3 lg:items-end">
          {badge ? <Badge className="border-0 bg-white/10 text-white">{badge}</Badge> : null}
          {actions}
        </div>
      </div>
    </section>
  );
}
