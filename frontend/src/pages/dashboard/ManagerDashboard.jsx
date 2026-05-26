import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { TrendingUp, Trophy, Clock, Target, AlertTriangle, Activity as ActivityIcon } from 'lucide-react';
import { analyticsApi } from '../../api/endpoints.js';
import { PageHeader } from '../../components/layout/PageHeader.jsx';
import { Skeleton } from '../../components/primitives/EmptyState.jsx';
import { Avatar } from '../../components/primitives/Avatar.jsx';
import { Badge, StageBadge } from '../../components/primitives/Badge.jsx';
import { formatCurrencyCompact, formatRelative } from '../../lib/format.js';
import { useAuthStore } from '../../store/authStore.js';

function Kpi({ icon: Icon, label, value, hint, accent }) {
  return (
    <div className="ff-card p-4">
      <div className="flex items-center justify-between">
        <span className="text-xs text-muted">{label}</span>
        <Icon size={16} className="text-subtle" />
      </div>
      <div className="mt-2 ff-mono text-xl text-text" style={accent ? { color: accent } : undefined}>
        {value}
      </div>
      {hint && <div className="text-[11px] text-subtle mt-1">{hint}</div>}
    </div>
  );
}

export function ManagerDashboard() {
  const user = useAuthStore((s) => s.user);
  const navigate = useNavigate();

  const { data: kpis, isLoading: kpisLoading } = useQuery({ queryKey: ['kpis'], queryFn: analyticsApi.kpis });
  const { data: funnel } = useQuery({ queryKey: ['funnel'], queryFn: analyticsApi.funnel });
  const { data: leaderboard } = useQuery({
    queryKey: ['leaderboard', 'revenue'],
    queryFn: () => analyticsApi.leaderboard({ metric: 'revenue', period: 30 }),
  });
  const { data: stuck } = useQuery({ queryKey: ['stuck'], queryFn: () => analyticsApi.stuckDeals() });
  const { data: feed } = useQuery({ queryKey: ['feed'], queryFn: analyticsApi.activityFeed });

  const maxFunnelCount = Math.max(1, ...(funnel?.data || []).map((s) => s.count));

  return (
    <div>
      <PageHeader
        title={`Welcome back, ${user?.name?.split(' ')[0] || ''}`}
        subtitle="Team pipeline overview and performance"
      />

      <div className="p-6 space-y-5">
        {/* KPI tiles */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {kpisLoading ? (
            [...Array(4)].map((_, i) => <Skeleton key={i} className="h-[86px]" />)
          ) : (
            <>
              <Kpi
                icon={TrendingUp}
                label="Revenue this month"
                value={formatCurrencyCompact(kpis?.revenueThisMonth || 0)}
                hint={`${kpis?.dealsWon || 0} deals won`}
                accent="var(--ff-success)"
              />
              <Kpi
                icon={Trophy}
                label="Deals won"
                value={kpis?.dealsWon ?? 0}
                hint="Last 30 days"
              />
              <Kpi icon={Clock} label="Avg cycle" value={`${kpis?.avgCycleDays ?? 0}d`} hint="Lead to close" />
              <Kpi
                icon={Target}
                label="Win rate"
                value={`${kpis?.winRate ?? 0}%`}
                hint={`${kpis?.activeLeads ?? 0} active leads`}
              />
            </>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          {/* Funnel */}
          <div className="ff-card p-5 lg:col-span-2">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-md font-medium">Pipeline funnel</h3>
              <button
                onClick={() => navigate('/pipeline')}
                className="text-xs text-accent hover:underline"
              >
                View pipeline →
              </button>
            </div>
            <div className="space-y-2">
              {(funnel?.data || [])
                .filter((s) => !['Lost', 'On Hold'].includes(s.name))
                .map((s) => {
                  const pct = Math.max(8, (s.count / maxFunnelCount) * 100);
                  return (
                    <div key={s.stage} className="flex items-center gap-3">
                      <div className="w-32 text-xs text-muted shrink-0">{s.name}</div>
                      <div className="flex-1 relative">
                        <div className="h-7 rounded-md bg-elev2 overflow-hidden">
                          <div
                            className="h-full rounded-md ff-transition"
                            style={{ width: `${pct}%`, background: s.color, opacity: 0.85 }}
                          />
                        </div>
                        <div className="absolute inset-0 flex items-center justify-end pr-2.5 text-xs">
                          <span className="ff-mono text-text">{s.count}</span>
                          <span className="ff-mono text-subtle ml-3">
                            {formatCurrencyCompact(s.value)}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
            </div>
          </div>

          {/* Leaderboard */}
          <div className="ff-card p-5">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-md font-medium">Top performers</h3>
              <button
                onClick={() => navigate('/analytics')}
                className="text-xs text-accent hover:underline"
              >
                Full →
              </button>
            </div>
            <ul className="space-y-3">
              {(leaderboard?.data || []).slice(0, 5).map((row, idx) => (
                <li key={row.user._id} className="flex items-center gap-3">
                  <span
                    className="ff-mono text-xs w-5 text-center"
                    style={{ color: idx < 3 ? 'var(--ff-warn)' : 'var(--ff-text-subtle)' }}
                  >
                    {idx + 1}
                  </span>
                  <Avatar name={row.user.name} size={28} />
                  <div className="flex-1 min-w-0">
                    <div className="text-sm text-text truncate">{row.user.name}</div>
                    <div className="text-[11px] text-muted">{row.dealsWon} wins · {row.activities} acts</div>
                  </div>
                  <span className="ff-mono text-sm text-text">{formatCurrencyCompact(row.revenue)}</span>
                </li>
              ))}
              {(!leaderboard?.data || leaderboard.data.length === 0) && (
                <li className="text-sm text-muted py-4 text-center">No BDA data yet</li>
              )}
            </ul>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {/* Stuck deals */}
          <div className="ff-card p-5">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-md font-medium flex items-center gap-2">
                <AlertTriangle size={16} className="text-warn" />
                Stuck deals
              </h3>
              <span className="text-xs text-muted">{stuck?.data?.length || 0} deals over 14d</span>
            </div>
            <ul className="space-y-1.5">
              {(stuck?.data || []).slice(0, 5).map((l) => (
                <li
                  key={l._id}
                  onClick={() => navigate(`/leads/${l._id}`)}
                  className="flex items-center gap-3 p-2 rounded-md hover:bg-elev2 ff-transition cursor-pointer"
                >
                  <Avatar name={l.owner?.name} size={24} />
                  <div className="flex-1 min-w-0">
                    <div className="text-sm text-text truncate">{l.companyName}</div>
                    <div className="text-[11px] text-muted flex items-center gap-1.5">
                      <StageBadge stage={l.stage} />
                      <span>· {l.daysSinceActivity}d cold</span>
                    </div>
                  </div>
                  <span className="ff-mono text-sm text-text">
                    {formatCurrencyCompact(l.estimatedValue)}
                  </span>
                </li>
              ))}
              {(!stuck?.data || stuck.data.length === 0) && (
                <li className="text-sm text-muted py-4 text-center">No stuck deals 🎉</li>
              )}
            </ul>
          </div>

          {/* Activity feed */}
          <div className="ff-card p-5">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-md font-medium flex items-center gap-2">
                <ActivityIcon size={16} className="text-accent" />
                Team activity
              </h3>
            </div>
            <ul className="space-y-2.5 max-h-[280px] overflow-y-auto">
              {(feed?.items || []).slice(0, 10).map((a) => (
                <li key={a._id} className="flex items-start gap-3 text-sm">
                  <Avatar name={a.performedBy?.name} size={22} />
                  <div className="flex-1 min-w-0">
                    <div className="text-text">
                      <span className="font-medium">{a.performedBy?.name}</span>
                      <span className="text-muted"> {a.type} on </span>
                      <span
                        className="text-accent cursor-pointer hover:underline"
                        onClick={() => navigate(`/leads/${a.lead?._id}`)}
                      >
                        {a.lead?.companyName}
                      </span>
                    </div>
                    <div className="text-[11px] text-subtle">{formatRelative(a.occurredAt)}</div>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
