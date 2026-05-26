import dayjs from 'dayjs';

const INR_FMT = new Intl.NumberFormat('en-IN', {
  style: 'currency',
  currency: 'INR',
  maximumFractionDigits: 0,
});

export const formatCurrency = (n) => INR_FMT.format(Number(n) || 0);

export const formatCurrencyCompact = (n) => {
  const v = Number(n) || 0;
  if (v >= 10_000_000) return `₹ ${(v / 10_000_000).toFixed(1)} Cr`;
  if (v >= 100_000) return `₹ ${(v / 100_000).toFixed(1)} L`;
  if (v >= 1000) return `₹ ${(v / 1000).toFixed(1)} K`;
  return INR_FMT.format(v);
};

export const formatDate = (d, fmt = 'DD MMM YYYY') => (d ? dayjs(d).format(fmt) : '—');
export const formatDateTime = (d) => (d ? dayjs(d).format('DD MMM YYYY, hh:mm A') : '—');
export const formatRelative = (d) => {
  if (!d) return '—';
  const diff = dayjs().diff(dayjs(d), 'minute');
  if (diff < 1) return 'just now';
  if (diff < 60) return `${diff}m ago`;
  if (diff < 1440) return `${Math.floor(diff / 60)}h ago`;
  const days = Math.floor(diff / 1440);
  if (days < 30) return `${days}d ago`;
  return formatDate(d);
};

export const initials = (name = '') =>
  name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((s) => s[0]?.toUpperCase())
    .join('');

export const daysBetween = (a, b = new Date()) => {
  if (!a) return 0;
  return Math.floor((new Date(b).getTime() - new Date(a).getTime()) / (1000 * 60 * 60 * 24));
};
