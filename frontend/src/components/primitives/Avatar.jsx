import { cn } from '../../lib/cn.js';
import { hashColor } from '../../design/theme.js';
import { initials } from '../../lib/format.js';

export function Avatar({ name = '', src, size = 28, className }) {
  const color = hashColor(name);
  const ini = initials(name);
  return (
    <span
      className={cn(
        'inline-flex items-center justify-center rounded-full font-medium uppercase shrink-0',
        className
      )}
      style={{
        width: size,
        height: size,
        background: src ? undefined : `${color}33`,
        color,
        fontSize: Math.max(10, size * 0.4),
        border: `1px solid ${color}55`,
      }}
      title={name}
    >
      {src ? (
        <img src={src} alt={name} className="w-full h-full rounded-full object-cover" />
      ) : (
        ini || '?'
      )}
    </span>
  );
}
