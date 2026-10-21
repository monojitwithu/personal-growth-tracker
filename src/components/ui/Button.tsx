import type { ComponentProps, ReactNode } from 'react';
import { cn } from '../../lib/cn';

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'success';
type Size = 'sm' | 'md' | 'lg' | 'icon';

export interface ButtonProps extends ComponentProps<'button'> {
  variant?: Variant;
  size?: Size;
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
}

const variants: Record<Variant, string> = {
  primary:
    'bg-tech-600 text-white shadow-[0_8px_24px_-10px_rgb(2_132_199/0.7)] hover:bg-tech-700 active:bg-tech-700 ring-1 ring-inset ring-white/10',
  secondary: 'bg-white/[0.06] text-slate-100 ring-1 ring-inset ring-white/10 hover:bg-white/[0.1] hover:ring-white/20',
  ghost: 'text-slate-300 hover:bg-white/[0.06] hover:text-white',
  danger: 'bg-rose-700 text-white hover:bg-rose-800 ring-1 ring-inset ring-white/10',
  success:
    'bg-growth-600 text-white shadow-[0_8px_24px_-10px_rgb(16_185_129/0.7)] hover:bg-growth-700 ring-1 ring-inset ring-white/10',
};

const sizes: Record<Size, string> = {
  sm: 'h-8 px-3 text-xs gap-1.5 rounded-lg',
  md: 'h-10 px-4 text-sm gap-2 rounded-xl',
  lg: 'h-12 px-6 text-sm gap-2 rounded-xl',
  icon: 'h-9 w-9 rounded-lg',
};

export function Button({
  variant = 'secondary',
  size = 'md',
  leftIcon,
  rightIcon,
  className,
  children,
  type = 'button',
  ...rest
}: ButtonProps) {
  return (
    <button
      type={type}
      className={cn(
        'inline-flex shrink-0 items-center justify-center font-medium whitespace-nowrap transition-all duration-150 select-none',
        'active:scale-[0.97] disabled:pointer-events-none disabled:opacity-45',
        variants[variant],
        sizes[size],
        className,
      )}
      {...rest}
    >
      {leftIcon}
      {children}
      {rightIcon}
    </button>
  );
}
