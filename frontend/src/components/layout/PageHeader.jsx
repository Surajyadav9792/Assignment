import { cn } from '../../lib/cn.js';

export function PageHeader({ title, subtitle, actions, breadcrumb, className }) {
  return (
    <div className={cn('px-6 pt-5 pb-4 border-b border-border bg-bg', className)}>
      {breadcrumb && <div className="mb-1.5 text-xs text-muted">{breadcrumb}</div>}
      <div className="flex items-end justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold text-text tracking-tightish">{title}</h1>
          {subtitle && <p className="text-sm text-muted mt-0.5">{subtitle}</p>}
        </div>
        {actions && <div className="flex items-center gap-2">{actions}</div>}
      </div>
    </div>
  );
}
