import React from 'react';
import { cn } from '../lib/utils';

interface HeaderProps {
  title: string;
  subtitle?: string;
  rightElement?: React.ReactNode;
  className?: string;
}

export default function Header({ title, subtitle, rightElement, className }: HeaderProps) {
  return (
    <header className={cn(
      "sticky top-0 z-30 bg-slate-50/80 dark:bg-zinc-950/80 backdrop-blur-xl border-b border-slate-100/50 dark:border-zinc-800/50 px-6 py-5",
      className
    )}>
      <div className="flex items-center justify-between max-w-7xl mx-auto">
        <div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight leading-none">
            {title}
          </h1>
          {subtitle && (
            <p className="text-[10px] text-slate-400 dark:text-zinc-500 font-bold uppercase tracking-[0.15em] mt-1.5">
              {subtitle}
            </p>
          )}
        </div>
        {rightElement && (
          <div className="flex items-center gap-3">
            {rightElement}
          </div>
        )}
      </div>
    </header>
  );
}
