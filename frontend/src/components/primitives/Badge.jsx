import { cn } from '../../lib/cn.js';

const VARIANTS = {
  default: 'bg-elev2 text-muted border-border',
  accent: 'bg-accent-soft text-accent border-transparent',
  success: 'bg-[rgba(43,182,115,0.12)] text-success border-transparent',
  warn: 'bg-[rgba(242,163,65,0.12)] text-warn border-transparent',
  danger: 'bg-[rgba(229,72,77,0.12)] text-[var(--ff-danger)] border-transparent',
  info: 'bg-[rgba(91,157,249,0.12)] text-info border-transparent',
};

export function Badge({ variant = 'default', children, className, dot = false, color }) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-xs border',
        VARIANTS[variant],
        className
      )}
      style={color ? { background: `${color}1F`, color, border: 'none' } : undefined}
    >
      {dot && <span className="w-1.5 h-1.5 rounded-full bg-current" />}
      {children}
    </span>
  );
}

export function StageBadge({ stage }) {
  if (!stage) return null;
  return (
    <span
      className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-xs"
      style={{ background: `${stage.color}1F`, color: stage.color }}
    >
      <span className="w-1.5 h-1.5 rounded-full" style={{ background: stage.color }} />
      {stage.name}
    </span>
  );
}

export function TemperatureBadge({ temperature }) {
  const map = {
    hot: { label: 'Hot', variant: 'danger' },
    warm: { label: 'Warm', variant: 'warn' },
    cold: { label: 'Cold', variant: 'info' },
  };
  const t = map[temperature] || map.cold;
  return <Badge variant={t.variant}>{t.label}</Badge>;
}
