import type { ReactNode } from 'react';
import { cn } from '../../lib/cn';

interface ProgressRingProps {
  value: number; // 0..1
  size?: number;
  stroke?: number;
  label: string;
  children?: ReactNode;
  gradientId: string;
  from?: string;
  to?: string;
  className?: string;
}

export function ProgressRing({
  value,
  size = 120,
  stroke = 10,
  label,
  children,
  gradientId,
  from = 'var(--color-tech-400)',
  to = 'var(--color-growth-400)',
  className,
}: ProgressRingProps) {
  const clamped = Math.min(1, Math.max(0, value));
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  return (
    <div
      className={cn('relative inline-grid place-items-center', className)}
      style={{ width: size, height: size }}
      role="progressbar"
      aria-label={label}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={Math.round(clamped * 100)}
    >
      <svg width={size} height={size} className="-rotate-90" aria-hidden="true">
        <defs>
          <linearGradient id={gradientId} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor={from} />
            <stop offset="100%" stopColor={to} />
          </linearGradient>
        </defs>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="rgb(255 255 255 / 0.07)" strokeWidth={stroke} />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={`url(#${gradientId})`}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={c * (1 - clamped)}
          style={{ transition: 'stroke-dashoffset 0.8s cubic-bezier(0.16, 1, 0.3, 1)' }}
        />
      </svg>
      <div className="absolute inset-0 grid place-items-center text-center">{children}</div>
    </div>
  );
}

interface ProgressBarProps {
  value: number; // 0..1
  label: string;
  className?: string;
  barClassName?: string;
  size?: 'xs' | 'sm' | 'md';
}

export function ProgressBar({ value, label, className, barClassName, size = 'sm' }: ProgressBarProps) {
  const pct = Math.round(Math.min(1, Math.max(0, value)) * 100);
  const h = size === 'xs' ? 'h-1' : size === 'sm' ? 'h-1.5' : 'h-2.5';
  return (
    <div
      className={cn('w-full overflow-hidden rounded-full bg-white/[0.07]', h, className)}
      role="progressbar"
      aria-label={label}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={pct}
    >
      <div
        className={cn(
          'h-full rounded-full bg-gradient-to-r from-tech-400 to-growth-400 transition-[width] duration-700 ease-out',
          barClassName,
        )}
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}
