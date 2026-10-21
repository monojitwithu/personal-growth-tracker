import type { ElementType, ReactNode } from 'react';
import type { LucideIcon } from 'lucide-react';
import { cn } from '../../lib/cn';

interface CardProps {
  as?: ElementType;
  className?: string;
  children: ReactNode;
  glow?: 'tech' | 'growth' | 'warn' | null;
  id?: string;
  'aria-labelledby'?: string;
}

const glows = {
  tech: 'before:bg-[radial-gradient(40rem_16rem_at_0%_0%,rgb(2_132_199/0.16),transparent_70%)]',
  growth: 'before:bg-[radial-gradient(40rem_16rem_at_0%_0%,rgb(16_185_129/0.14),transparent_70%)]',
  warn: 'before:bg-[radial-gradient(40rem_16rem_at_0%_0%,rgb(245_158_11/0.14),transparent_70%)]',
};

export function Card({ as: Tag = 'section', className, children, glow = null, ...rest }: CardProps) {
  return (
    <Tag
      className={cn(
        'glass relative overflow-hidden rounded-2xl',
        glow && 'before:pointer-events-none before:absolute before:inset-0 before:content-[""]',
        glow && glows[glow],
        className,
      )}
      {...rest}
    >
      <div className="relative">{children}</div>
    </Tag>
  );
}

interface CardHeaderProps {
  icon?: LucideIcon;
  title: ReactNode;
  titleId?: string;
  description?: ReactNode;
  action?: ReactNode;
  iconClassName?: string;
  className?: string;
}

export function CardHeader({ icon: Icon, title, titleId, description, action, iconClassName, className }: CardHeaderProps) {
  return (
    <div className={cn('flex items-start justify-between gap-3', className)}>
      <div className="flex min-w-0 items-start gap-3">
        {Icon && (
          <span
            className={cn(
              'grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-white/[0.05] ring-1 ring-white/10 text-tech-300',
              iconClassName,
            )}
            aria-hidden="true"
          >
            <Icon className="h-4.5 w-4.5" />
          </span>
        )}
        <div className="min-w-0">
          <h2 id={titleId} className="text-sm font-semibold tracking-tight text-white">
            {title}
          </h2>
          {description && <p className="mt-0.5 text-xs text-slate-400">{description}</p>}
        </div>
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
}
