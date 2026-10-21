import type { ReactNode } from 'react';
import { cn } from '../../lib/cn';
import { MODE_META, TONE_CLASSES, type Tone } from '../../lib/modes';
import type { FocusMode } from '../../types';

interface BadgeProps {
  tone?: Tone;
  children: ReactNode;
  className?: string;
  dot?: boolean;
  icon?: ReactNode;
}

export function Badge({ tone = 'slate', children, className, dot, icon }: BadgeProps) {
  const t = TONE_CLASSES[tone];
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-[11px] font-medium whitespace-nowrap',
        t.bg,
        t.text,
        t.border,
        className,
      )}
    >
      {dot && <span className={cn('h-1.5 w-1.5 rounded-full', t.dot)} aria-hidden="true" />}
      {icon}
      {children}
    </span>
  );
}

export function ModeBadge({ mode, compact = false, className }: { mode: FocusMode; compact?: boolean; className?: string }) {
  const meta = MODE_META[mode];
  const Icon = meta.icon;
  return (
    <Badge tone={meta.tone} className={className} icon={<Icon className="h-3 w-3" aria-hidden="true" />}>
      {compact ? meta.label : `${meta.label} · ${meta.tagline}`}
    </Badge>
  );
}
