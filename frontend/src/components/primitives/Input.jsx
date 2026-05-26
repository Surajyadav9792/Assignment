import { forwardRef } from 'react';
import { cn } from '../../lib/cn.js';

export const Input = forwardRef(function Input({ className, error, ...props }, ref) {
  return (
    <input
      ref={ref}
      className={cn(
        'h-9 w-full px-3 rounded-md bg-elev2 border text-text text-sm placeholder:text-subtle',
        'ff-transition focus:outline-none focus:ff-focus-ring',
        error ? 'border-[var(--ff-danger)]' : 'border-border focus:border-accent',
        className
      )}
      {...props}
    />
  );
});

export const Textarea = forwardRef(function Textarea({ className, rows = 4, ...props }, ref) {
  return (
    <textarea
      ref={ref}
      rows={rows}
      className={cn(
        'w-full px-3 py-2 rounded-md bg-elev2 border border-border text-text text-sm placeholder:text-subtle',
        'ff-transition focus:outline-none focus:ff-focus-ring focus:border-accent resize-y',
        className
      )}
      {...props}
    />
  );
});

export const Select = forwardRef(function Select({ className, children, ...props }, ref) {
  return (
    <select
      ref={ref}
      className={cn(
        'h-9 w-full px-3 rounded-md bg-elev2 border border-border text-text text-sm',
        'ff-transition focus:outline-none focus:ff-focus-ring focus:border-accent',
        'appearance-none cursor-pointer',
        className
      )}
      style={{
        backgroundImage:
          "url(\"data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3e%3cpath fill='none' stroke='%238B95A3' stroke-width='1.5' d='M3 5l3 3 3-3'/%3e%3c/svg%3e\")",
        backgroundRepeat: 'no-repeat',
        backgroundPosition: 'right 10px center',
        paddingRight: '28px',
      }}
      {...props}
    >
      {children}
    </select>
  );
});

export const Label = ({ className, children, ...props }) => (
  <label
    className={cn('block text-xs text-muted font-medium mb-1.5', className)}
    {...props}
  >
    {children}
  </label>
);

export const FieldError = ({ children }) =>
  children ? <p className="text-xs text-[var(--ff-danger)] mt-1">{children}</p> : null;
