import { cn } from '../../lib/cn.js';

export function EmptyState({ icon: Icon, title, description, action, className }) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center text-center py-12 px-6 rounded-lg border border-dashed border-border',
        className
      )}
    >
      {Icon && (
        <div className="mb-3 p-3 rounded-full bg-elev2 text-muted">
          <Icon size={24} />
        </div>
      )}
      {title && <h4 className="text-md font-medium text-text">{title}</h4>}
      {description && <p className="text-sm text-muted mt-1 max-w-md">{description}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

export function Skeleton({ className }) {
  return <div className={cn('animate-pulse bg-elev2 rounded', className)} />;
}
