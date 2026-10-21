import type { LucideIcon } from 'lucide-react';
import { History, LayoutDashboard, Map as MapIcon, Trophy } from 'lucide-react';
import { cn } from '../../lib/cn';
import type { TabId } from '../../types';

export const TABS: { id: TabId; label: string; icon: LucideIcon }[] = [
  { id: 'cockpit', label: 'Cockpit', icon: LayoutDashboard },
  { id: 'roadmap', label: 'Roadmap', icon: MapIcon },
  { id: 'logs', label: 'Logs', icon: History },
  { id: 'capstones', label: 'Capstones', icon: Trophy },
];

interface TabNavProps {
  active: TabId;
  onChange: (tab: TabId) => void;
}

/** Inline segmented tabs rendered inside the Navbar on md+ screens. */
export function DesktopTabs({ active, onChange }: TabNavProps) {
  return (
    <nav aria-label="Primary" className="ml-4 hidden md:block">
      <ul className="flex items-center gap-1 rounded-xl border border-white/[0.06] bg-white/[0.03] p-1">
        {TABS.map(({ id, label, icon: Icon }) => {
          const isActive = active === id;
          return (
            <li key={id}>
              <a
                href={`#${id}`}
                id={`tab-${id}`}
                onClick={(e) => {
                  e.preventDefault();
                  onChange(id);
                }}
                aria-current={isActive ? 'page' : undefined}
                className={cn(
                  'relative flex items-center gap-2 rounded-lg px-3 py-1.5 text-sm font-medium transition-all duration-200',
                  isActive
                    ? 'bg-white/[0.08] text-white shadow-[0_1px_0_0_rgb(255_255_255/0.06)_inset]'
                    : 'text-slate-400 hover:bg-white/[0.04] hover:text-slate-200',
                )}
              >
                <Icon className={cn('h-4 w-4', isActive ? 'text-tech-300' : '')} aria-hidden="true" />
                {label}
              </a>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

/** Thumb-reachable bottom tab bar for phones. */
export function TabNavigation({ active, onChange }: TabNavProps) {
  return (
    <nav
      aria-label="Primary mobile"
      className="safe-bottom fixed inset-x-0 bottom-0 z-50 border-t border-white/[0.07] bg-ink-950/85 backdrop-blur-xl md:hidden"
    >
      <ul className="mx-auto grid max-w-md grid-cols-4 px-2 pt-1.5">
        {TABS.map(({ id, label, icon: Icon }) => {
          const isActive = active === id;
          return (
            <li key={id}>
              <a
                href={`#${id}`}
                id={`mobile-tab-${id}`}
                onClick={(e) => {
                  e.preventDefault();
                  onChange(id);
                }}
                aria-current={isActive ? 'page' : undefined}
                className={cn(
                  'flex flex-col items-center gap-1 rounded-xl py-1.5 text-[11px] font-medium transition-colors',
                  isActive ? 'text-white' : 'text-slate-400 hover:text-slate-200',
                )}
              >
                <span
                  className={cn(
                    'grid h-8 w-14 place-items-center rounded-full transition-all duration-300',
                    isActive ? 'bg-tech-500/20 text-tech-300' : '',
                  )}
                >
                  <Icon className="h-5 w-5" aria-hidden="true" />
                </span>
                {label}
              </a>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
