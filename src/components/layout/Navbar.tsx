import { Flame, Hourglass, MonitorDown, Moon, Sun, WifiOff } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { useOnlineStatus } from '../../hooks/useOnlineStatus';
import { usePwaInstall } from '../../hooks/usePwaInstall';
import { useTheme } from '../../hooks/useTheme';
import { cn } from '../../lib/cn';
import type { TabId } from '../../types';
import { Button } from '../ui/Button';
import { useToast } from '../ui/Toast';
import { DesktopTabs } from './TabNavigation';

interface NavbarProps {
  activeTab: TabId;
  onTabChange: (tab: TabId) => void;
}

export function Navbar({ activeTab, onTabChange }: NavbarProps) {
  const { streak, daysRemaining } = useApp();
  const online = useOnlineStatus();
  const { canInstall, promptInstall } = usePwaInstall();
  const { toast } = useToast();
  const { toggleTheme, isDark } = useTheme();

  async function handleInstall() {
    const accepted = await promptInstall();
    if (accepted) toast({ tone: 'success', title: 'Ascent installed', description: 'Launch it from your home screen or dock.' });
  }

  return (
    <header className="sticky top-0 z-50 border-b border-white/[0.06] bg-ink-950/75 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-7xl items-center gap-3 px-4 sm:px-6 lg:px-8">
        <a href="#cockpit" className="group flex min-w-0 items-center gap-2.5" aria-label="FullStack Ascent — go to Cockpit">
          <img
            src="./icons/icon-192.png"
            alt=""
            width={36}
            height={36}
            className="h-9 w-9 rounded-xl ring-1 ring-white/10 transition-transform duration-300 group-hover:-translate-y-0.5"
          />
          <div className="min-w-0 leading-tight">
            <p className="truncate text-sm font-semibold tracking-tight text-white">FullStack Ascent</p>
            <p className="hidden truncate text-[11px] text-slate-400 sm:block">Career Transition Cockpit</p>
          </div>
        </a>

        <DesktopTabs active={activeTab} onChange={onTabChange} />

        <div className="ml-auto flex items-center gap-2">
          {!online && (
            <span
              className="hidden items-center gap-1.5 rounded-full border border-warn-400/30 bg-warn-500/10 px-2.5 py-1 text-[11px] font-medium text-warn-300 sm:inline-flex"
              role="status"
            >
              <WifiOff className="h-3.5 w-3.5" aria-hidden="true" />
              Offline · saved locally
            </span>
          )}

          <span
            className="hidden items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.04] px-2.5 py-1 text-xs text-slate-300 sm:inline-flex"
            title="Days remaining until program completion (Feb 02, 2027)"
          >
            <Hourglass className="h-3.5 w-3.5 text-tech-300" aria-hidden="true" />
            <span className="font-mono font-semibold text-white tabular-nums">{daysRemaining}</span>
            <span className="text-slate-400">days left</span>
          </span>

          <span
            className={cn(
              'inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs',
              streak > 0
                ? 'border-warn-400/30 bg-warn-500/10 text-warn-300'
                : 'border-white/10 bg-white/[0.04] text-slate-400',
            )}
            aria-label={`Current streak: ${streak} ${streak === 1 ? 'day' : 'days'}`}
          >
            <Flame className={cn('h-3.5 w-3.5', streak > 0 && 'animate-flicker')} aria-hidden="true" />
            <span className="font-mono font-semibold tabular-nums">{streak}</span>
            <span className="hidden sm:inline">day streak</span>
          </span>

          {/* Light / Dark Mode Toggle */}
          <button
            type="button"
            onClick={toggleTheme}
            id="theme-toggle-btn"
            className="flex items-center justify-center h-8 w-8 rounded-xl border border-white/10 bg-white/[0.04] text-slate-300 hover:text-white hover:bg-white/10 transition active:scale-95 cursor-pointer"
            aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
            title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
          >
            {isDark ? <Sun className="h-4 w-4 text-warn-400" /> : <Moon className="h-4 w-4 text-tech-400" />}
          </button>

          {canInstall && (
            <Button
              variant="primary"
              size="sm"
              onClick={handleInstall}
              leftIcon={<MonitorDown className="h-3.5 w-3.5" aria-hidden="true" />}
              id="install-app-button"
            >
              <span className="hidden sm:inline">Install app</span>
              <span className="sm:hidden">Install</span>
            </Button>
          )}
        </div>
      </div>

      {!online && (
        <div className="border-t border-warn-400/20 bg-warn-500/10 px-4 py-1.5 text-center text-[11px] font-medium text-warn-300 sm:hidden" role="status">
          You're offline — everything still works and is saved on this device.
        </div>
      )}
    </header>
  );
}
