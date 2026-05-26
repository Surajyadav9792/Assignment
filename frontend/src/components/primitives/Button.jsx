import { forwardRef } from 'react';
import { cn } from '../../lib/cn.js';

const SIZES = {
  sm: 'h-8 px-2.5 text-xs',
  md: 'h-9 px-3 text-sm',
  lg: 'h-10 px-4 text-sm',
};

const VARIANTS = {
  primary:
    'bg-accent text-white hover:bg-accent-hover border border-transparent shadow-sm font-medium',
  secondary:
    'bg-elev2 text-text hover:bg-[#252d37] border border-border font-medium',
  ghost:
    'bg-transparent text-text hover:bg-elev2 border border-transparent',
  outline:
    'bg-transparent text-text hover:bg-elev border border-border',
  danger:
    'bg-[var(--ff-danger)] text-white hover:opacity-90 border border-transparent font-medium',
};

export const Button = forwardRef(function Button(
  { variant = 'secondary', size = 'md', className, leftIcon, rightIcon, children, ...props },
  ref
) {
  return (
    <button
      ref={ref}
      className={cn(
        'inline-flex items-center justify-center gap-1.5 rounded-md ff-transition',
        'disabled:opacity-50 disabled:cursor-not-allowed',
        'focus-visible:ff-focus-ring focus-visible:outline-none',
        SIZES[size],
        VARIANTS[variant],
        className
      )}
      {...props}
    >
      {leftIcon}
      {children}
      {rightIcon}
    </button>
  );
});
