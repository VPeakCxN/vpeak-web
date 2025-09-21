// components/sidebar.tsx
'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import {
  TooltipProvider,
  Tooltip,
  TooltipTrigger,
  TooltipContent,
} from '@/components/ui/tooltip';
import {
  Home,
  Calendar,
  IceCreamBowl,
  Bell,
  Star,
  MessageSquare,
  Group,
  Bookmark,
  ShoppingBag,
  User,
  Settings,
  ChevronRight,
} from 'lucide-react';

type NavItem = {
  href: string;
  label: string;
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
};

const NAV: NavItem[] = [
  { href: '/home', label: 'Home', icon: Home },
  { href: '/timetable', label: 'Timetable', icon: Bell },
  { href: '/messages', label: 'Messages', icon: MessageSquare },
  { href: '/bookmarks', label: 'Bookmarks', icon: Bookmark },
  { href: '/events', label: 'Events', icon: Star },
  { href: '/mess', label: 'Mess', icon: IceCreamBowl },
  { href: '/clubrooms', label: 'Club Rooms', icon: Group},
  { href: '/marketplace', label: 'Marketplace', icon: ShoppingBag },
  { href: '/profile', label: 'Profile', icon: User },
  { href: '/settings', label: 'Settings', icon: Settings },
];

export function Sidebar() {
  const [expanded, setExpanded] = useState(true);

  return (
    <TooltipProvider delayDuration={200}>
      <aside
        aria-label="Primary"
        data-expanded={expanded}
        className={[
          'sticky top-0 hidden h-[calc(100vh)] shrink-0 border-r border-border bg-card md:flex',
          'transition-[width] duration-200 ease-in-out',
          expanded ? 'w-64' : 'w-20',
        ].join(' ')}
      >
        <div className="flex h-full w-full flex-col">
          {/* Toggle */}
          <div className="flex items-center justify-between p-3">
            <span
              className={[
                'text-sm font-semibold text-card-foreground transition-opacity',
                expanded ? 'opacity-100' : 'opacity-0 pointer-events-none',
              ].join(' ')}
            >
              Navigation
            </span>
            <Button
              variant="ghost"
              size="icon"
              aria-label={expanded ? 'Collapse sidebar' : 'Expand sidebar'}
              onClick={() => setExpanded((v) => !v)}
              className="text-muted-foreground hover:text-foreground"
            >
              <ChevronRight
                className={[
                  'h-4 w-4 transition-transform',
                  expanded ? 'rotate-180' : '',
                ].join(' ')}
              />
            </Button>
          </div>

          {/* Nav */}
          <nav className="flex-1 space-y-1 px-2">
            {NAV.map(({ href, label, icon: Icon }) => {
              const content = (
                <Link
                  key={href}
                  href={href}
                  className={[
                    'group flex items-center rounded-md py-2',
                    expanded ? 'gap-3 px-3' : 'justify-center px-2',
                    'text-sm text-muted-foreground hover:text-foreground hover:bg-primary/10 transition-colors',
                  ].join(' ')}
                >
                  <Icon className="h-5 w-5 text-foreground" />
                  {expanded ? <span className="whitespace-nowrap">{label}</span> : null}
                </Link>
              );

              return expanded ? (
                content
              ) : (
                <Tooltip key={href}>
                  <TooltipTrigger asChild>{content}</TooltipTrigger>
                  <TooltipContent side="right" className="bg-popover text-popover-foreground">
                    {label}
                  </TooltipContent>
                </Tooltip>
              );
            })}
          </nav>

          {/* Primary action (like “Post”) */}
          <div className="p-3">
            {expanded ? (
              <Button className="w-full bg-primary text-primary-foreground hover:bg-primary/90">
                Post
              </Button>
            ) : (
              <Button
                size="icon"
                className="w-full bg-accent text-accent-foreground hover:bg-accent/90"
                aria-label="Post"
                title="Post"
              >
                +
              </Button>
            )}
          </div>
        </div>
      </aside>
    </TooltipProvider>
  );
}
