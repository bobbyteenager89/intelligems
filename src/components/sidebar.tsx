'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Clock, FileText, Layers, Target, Users } from 'lucide-react';
import { cn } from '@/lib/utils';

const navigation = [
  { name: 'Time', href: '/time', icon: Clock },
  { name: 'Notes', href: '/notes', icon: FileText },
  { name: 'Projects', href: '/projects', icon: Layers },
  { name: 'Focus', href: '/focus', icon: Target },
  { name: 'People', href: '/people', icon: Users },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <div className="flex h-full w-56 flex-col border-r bg-muted/30">
      <div className="border-b px-4 py-5">
        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Intelligems</p>
        <h2 className="mt-0.5 text-base font-semibold">Workspace</h2>
      </div>
      <nav className="flex-1 space-y-0.5 p-3">
        {navigation.map((item) => {
          const Icon = item.icon;
          const isActive = pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors',
                isActive
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
              )}
            >
              <Icon className="size-4" />
              {item.name}
            </Link>
          );
        })}
      </nav>
      <div className="border-t px-4 py-3">
        <p className="text-xs text-muted-foreground">40h/month budget</p>
      </div>
    </div>
  );
}
