import { cn } from '../../lib/cn.js';

export function Tabs({ tabs, value, onChange, className }) {
  return (
    <div className={cn('border-b border-border flex gap-1', className)}>
      {tabs.map((t) => (
        <button
          key={t.value}
          onClick={() => onChange(t.value)}
          className={cn(
            'relative px-3 py-2 text-sm ff-transition',
            value === t.value
              ? 'text-text'
              : 'text-muted hover:text-text'
          )}
        >
          {t.label}
          {t.count != null && (
            <span className="ml-1.5 text-xs ff-mono opacity-70">{t.count}</span>
          )}
          {value === t.value && (
            <span className="absolute left-0 right-0 -bottom-px h-0.5 bg-accent" />
          )}
        </button>
      ))}
    </div>
  );
}
