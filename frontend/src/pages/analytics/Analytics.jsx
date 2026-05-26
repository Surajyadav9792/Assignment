import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts';
import { analyticsApi } from '../../api/endpoints.js';
import { PageHeader } from '../../components/layout/PageHeader.jsx';
import { Tabs } from '../../components/primitives/Tabs.jsx';
import { Avatar } from '../../components/primitives/Avatar.jsx';
import { StageBadge, TemperatureBadge, Badge } from '../../components/primitives/Badge.jsx';
import { Skeleton } from '../../components/primitives/EmptyState.jsx';
import { formatCurrencyCompact, formatCurrency, formatRelative } from '../../lib/format.js';
import { cn } from '../../lib/cn.js';

export function Analytics() {
  const [tab, setTab] = useState('funnel');

  return (
    <div>
      <PageHeader title="Team analytics" subtitle="Performance, forecast, and pipeline health" />
      <div className="px-6">
        <Tabs
          value={tab}
          onChange={setTab}
          tabs={[
            { value: 'funnel', label: 'Funnel' },
            { value: 'leaderboard', label: 'Leaderboard' },
            { value: 'forecast', label: 'Forecast' },
            { value: 'heatmap', label: 'Heatmap' },
            { value: 'stuck', label: 'Stuck Deals' },
          ]}
        />
      </div>
      <div className="p-6">
        {tab === 'funnel' && <FunnelTab />}
        {tab === 'leaderboard' && <LeaderboardTab />}
        {tab === 'forecast' && <ForecastTab />}
        {tab === 'heatmap' && <HeatmapTab />}
        {tab === 'stuck' && <StuckTab />}
      </div>
    </div>
  );
}

function FunnelTab() {
  const { data, isLoading } = useQuery({ queryKey: ['funnel'], queryFn: analyticsApi.funnel });
  if (isLoading) return <Skeleton className="h-96" />;
  const active = (data?.data || []).filter((s) => !['Lost', 'On Hold'].includes(s.name));
  const max = Math.max(1, ...active.map((s) => s.count));

  return (
    <div className="ff-card p-6">
      <h3 className="text-md font-medium mb-4">Pipeline by stage</h3>
      <div className="space-y-2">
        {active.map((s, i) => {
          const next = active[i + 1];
          const conversion = next && s.count > 0 ? Math.round((next.count / s.count) * 100) : null;
          const pct = (s.count / max) * 100;
          return (
            <div key={s.stage}>
              <div className="flex items-center gap-3">
                <div className="w-40 text-sm text-muted">{s.name}</div>
                <div className="flex-1 relative h-9 bg-elev2 rounded-md overflow-hidden">
                  <div
                    className="h-full ff-transition"
                    style={{
                      width: `${Math.max(6, pct)}%`,
                      background: s.color,
                      opacity: 0.85,
                    }}
                  />
                  <div className="absolute inset-0 flex items-center justify-between px-3 text-sm">
                    <span className="ff-mono text-text">{s.count} deals</span>
                    <span className="ff-mono text-text">{formatCurrencyCompact(s.value)}</span>
                  </div>
                </div>
                <div className="w-16 text-right text-xs text-muted">
                  {conversion != null ? `→ ${conversion}%` : ''}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function LeaderboardTab() {
  const [metric, setMetric] = useState('revenue');
  const { data, isLoading } = useQuery({
    queryKey: ['leaderboard', metric],
    queryFn: () => analyticsApi.leaderboard({ metric, period: 30 }),
  });

  const METRICS = [
    { value: 'revenue', label: 'Revenue' },
    { value: 'dealsWon', label: 'Deals won' },
    { value: 'activities', label: 'Activities' },
    { value: 'quotesSent', label: 'Quotes sent' },
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <span className="text-xs text-muted">Rank by:</span>
        {METRICS.map((m) => (
          <button
            key={m.value}
            onClick={() => setMetric(m.value)}
            className={cn(
              'h-7 px-2.5 rounded text-xs ff-transition',
              metric === m.value
                ? 'bg-accent-soft text-accent'
                : 'text-muted hover:text-text hover:bg-elev2'
            )}
          >
            {m.label}
          </button>
        ))}
      </div>

      {isLoading ? (
        <Skeleton className="h-64" />
      ) : (
        <div className="ff-card overflow-hidden">
          <table className="w-full">
            <thead className="bg-elev2/40">
              <tr className="text-left text-xs text-muted">
                <th className="px-4 py-2 font-medium w-12">#</th>
                <th className="px-4 py-2 font-medium">BDA</th>
                <th className="px-4 py-2 font-medium text-right">Leads</th>
                <th className="px-4 py-2 font-medium text-right">Activities</th>
                <th className="px-4 py-2 font-medium text-right">Quotes</th>
                <th className="px-4 py-2 font-medium text-right">Deals won</th>
                <th className="px-4 py-2 font-medium text-right">Revenue</th>
                <th className="px-4 py-2 font-medium text-right">Win rate</th>
              </tr>
            </thead>
            <tbody>
              {(data?.data || []).map((row, idx) => (
                <tr
                  key={row.user._id}
                  className={cn(
                    'border-t border-border',
                    idx < 3 && 'bg-accent-soft/10'
                  )}
                >
                  <td className="px-4 py-2.5">
                    <span
                      className="ff-mono text-sm"
                      style={{
                        color: idx < 3 ? 'var(--ff-warn)' : 'var(--ff-text-subtle)',
                      }}
                    >
                      {idx + 1}
                    </span>
                  </td>
                  <td className="px-4 py-2.5">
                    <div className="flex items-center gap-2.5">
                      <Avatar name={row.user.name} size={28} />
                      <div>
                        <div className="text-sm text-text">{row.user.name}</div>
                        <div className="text-xs text-muted">{row.user.email}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-2.5 text-right ff-mono text-sm">{row.leadsOwned}</td>
                  <td className="px-4 py-2.5 text-right ff-mono text-sm">{row.activities}</td>
                  <td className="px-4 py-2.5 text-right ff-mono text-sm">{row.quotesSent}</td>
                  <td className="px-4 py-2.5 text-right ff-mono text-sm">{row.dealsWon}</td>
                  <td className="px-4 py-2.5 text-right ff-mono text-sm text-text">
                    {formatCurrencyCompact(row.revenue)}
                  </td>
                  <td className="px-4 py-2.5 text-right ff-mono text-sm">{row.winRate}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function ForecastTab() {
  const { data, isLoading } = useQuery({ queryKey: ['forecast'], queryFn: analyticsApi.forecast });
  if (isLoading) return <Skeleton className="h-96" />;

  const chartData = [
    {
      label: 'This month',
      total: (data?.thisMonth || []).reduce((s, x) => s + x.weighted, 0),
      gross: (data?.thisMonth || []).reduce((s, x) => s + x.value, 0),
    },
    {
      label: 'Next month',
      total: (data?.nextMonth || []).reduce((s, x) => s + x.weighted, 0),
      gross: (data?.nextMonth || []).reduce((s, x) => s + x.value, 0),
    },
  ];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
      <div className="ff-card p-5 lg:col-span-2">
        <h3 className="text-md font-medium mb-3">Weighted forecast (₹)</h3>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 5 }}>
            <XAxis dataKey="label" stroke="#5A6573" fontSize={12} />
            <YAxis
              stroke="#5A6573"
              fontSize={12}
              tickFormatter={(v) => formatCurrencyCompact(v)}
            />
            <Tooltip
              contentStyle={{
                background: '#151A21',
                border: '1px solid #232A33',
                borderRadius: 6,
                color: '#E6EAF0',
              }}
              formatter={(v) => formatCurrency(v)}
            />
            <Bar dataKey="gross" fill="#232A33" name="Gross pipeline" radius={[4, 4, 0, 0]} />
            <Bar dataKey="total" fill="#4F8AF7" name="Weighted" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="ff-card p-5">
        <h3 className="text-md font-medium mb-3">By stage (this month)</h3>
        <ul className="space-y-2">
          {(data?.thisMonth || []).map((s, i) => (
            <li key={i} className="flex items-center justify-between text-sm">
              <span className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full" style={{ background: s.color }} />
                <span className="text-text">{s.stage}</span>
              </span>
              <span className="ff-mono text-muted">{formatCurrencyCompact(s.weighted)}</span>
            </li>
          ))}
          {(data?.thisMonth || []).length === 0 && (
            <li className="text-sm text-muted">No deals expected this month.</li>
          )}
        </ul>
      </div>
    </div>
  );
}

function HeatmapTab() {
  // Use first BDA's data; in real app, user picker.
  const { data: leaderboard } = useQuery({
    queryKey: ['leaderboard', 'revenue'],
    queryFn: () => analyticsApi.leaderboard({ metric: 'revenue' }),
  });
  const firstUser = leaderboard?.data?.[0]?.user?._id;
  const { data, isLoading } = useQuery({
    queryKey: ['heatmap', firstUser],
    queryFn: () => analyticsApi.heatmap(firstUser),
    enabled: !!firstUser,
  });

  if (isLoading || !firstUser) return <Skeleton className="h-64" />;
  const lookup = Object.fromEntries((data?.data || []).map((d) => [d.date, d.count]));
  const max = Math.max(1, ...(data?.data || []).map((d) => d.count));

  const days = [];
  for (let i = 89; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const key = d.toISOString().slice(0, 10);
    days.push({ key, date: d, count: lookup[key] || 0 });
  }

  const intensity = (c) => {
    if (c === 0) return '#1B2129';
    const ratio = c / max;
    if (ratio < 0.25) return '#1d3b54';
    if (ratio < 0.5) return '#2d5f88';
    if (ratio < 0.75) return '#3d78b9';
    return '#4F8AF7';
  };

  return (
    <div className="ff-card p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-md font-medium">Activity heatmap · 90 days</h3>
        <div className="flex items-center gap-1.5 text-xs text-muted">
          <span>Less</span>
          {['#1B2129', '#1d3b54', '#2d5f88', '#3d78b9', '#4F8AF7'].map((c) => (
            <span key={c} className="w-3 h-3 rounded-sm" style={{ background: c }} />
          ))}
          <span>More</span>
        </div>
      </div>
      <div className="grid grid-cols-[repeat(15,_minmax(0,_1fr))] gap-1">
        {days.map((d) => (
          <div
            key={d.key}
            className="aspect-square rounded-sm ff-transition"
            style={{ background: intensity(d.count) }}
            title={`${d.date.toLocaleDateString()} · ${d.count} activities`}
          />
        ))}
      </div>
      <div className="text-xs text-muted mt-3">
        Showing data for {leaderboard?.data?.[0]?.user?.name}
      </div>
    </div>
  );
}

function StuckTab() {
  const navigate = useNavigate();
  const { data, isLoading } = useQuery({
    queryKey: ['stuck'],
    queryFn: () => analyticsApi.stuckDeals(),
  });
  if (isLoading) return <Skeleton className="h-64" />;

  return (
    <div className="ff-card overflow-hidden">
      <div className="px-5 py-3 border-b border-border">
        <h3 className="text-md font-medium">Deals stale &gt;14 days</h3>
      </div>
      <table className="w-full">
        <thead className="bg-elev2/40">
          <tr className="text-left text-xs text-muted">
            <th className="px-4 py-2 font-medium">Lead</th>
            <th className="px-4 py-2 font-medium">Stage</th>
            <th className="px-4 py-2 font-medium">Owner</th>
            <th className="px-4 py-2 font-medium">Days cold</th>
            <th className="px-4 py-2 font-medium text-right">Value</th>
          </tr>
        </thead>
        <tbody>
          {(data?.data || []).map((l) => (
            <tr
              key={l._id}
              onClick={() => navigate(`/leads/${l._id}`)}
              className="border-t border-border hover:bg-elev2/40 ff-transition cursor-pointer"
            >
              <td className="px-4 py-2.5 text-sm text-text">{l.companyName}</td>
              <td className="px-4 py-2.5">
                <StageBadge stage={l.stage} />
              </td>
              <td className="px-4 py-2.5">
                <div className="flex items-center gap-2">
                  <Avatar name={l.owner?.name} size={22} />
                  <span className="text-sm text-text">{l.owner?.name?.split(' ')[0]}</span>
                </div>
              </td>
              <td className="px-4 py-2.5 ff-mono text-sm text-danger">{l.daysSinceActivity}d</td>
              <td className="px-4 py-2.5 text-right ff-mono text-sm text-text">
                {formatCurrencyCompact(l.estimatedValue)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {(!data?.data || data.data.length === 0) && (
        <div className="p-6 text-sm text-muted text-center">No stuck deals 🎉</div>
      )}
    </div>
  );
}
