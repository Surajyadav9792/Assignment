import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { Plus, Sun, Flame, Target, FileText, PhoneCall } from 'lucide-react';
import { useAuthStore } from '../../store/authStore.js';
import { analyticsApi, leadsApi, tasksApi } from '../../api/endpoints.js';
import { PageHeader } from '../../components/layout/PageHeader.jsx';
import { Button } from '../../components/primitives/Button.jsx';
import { StageBadge, TemperatureBadge } from '../../components/primitives/Badge.jsx';
import { formatCurrencyCompact, formatRelative } from '../../lib/format.js';
import { Skeleton } from '../../components/primitives/EmptyState.jsx';

export function BdaDashboard() {
  const user = useAuthStore((s) => s.user);
  const nav = useNavigate();

  const { data: scorecard, isLoading: scLoading } = useQuery({
    queryKey: ['scorecard', user?._id],
    queryFn: () => analyticsApi.scorecard(user._id),
    enabled: !!user?._id,
  });
  const { data: myDay } = useQuery({ queryKey: ['myDay'], queryFn: tasksApi.myDay });
  const { data: leadsRes } = useQuery({
    queryKey: ['leads', 'hot'],
    queryFn: () => leadsApi.list({ limit: 6, sort: '-score' }),
  });

  const hotLeads = (leadsRes?.items || []).filter((l) => l.temperature === 'hot').slice(0, 5);
  const todayCount = (myDay?.today || []).length;
  const overdueCount = (myDay?.overdue || []).length;

  return (
    <div>
      <PageHeader
        title={`Hello, ${user?.name?.split(' ')[0]}`}
        subtitle={new Date().toLocaleDateString('en-IN', {
          weekday: 'long',
          day: 'numeric',
          month: 'long',
          year: 'numeric',
        })}
        actions={
          <>
            <Button variant="secondary" onClick={() => nav('/my-day')} leftIcon={<Sun size={14} />}>
              My Day
            </Button>
            <Button variant="primary" onClick={() => nav('/leads/new')} leftIcon={<Plus size={14} />}>
              New Lead
            </Button>
          </>
        }
      />

      <div className="p-6 space-y-5">
        {/* Scorecard */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {scLoading ? (
            [...Array(4)].map((_, i) => <Skeleton key={i} className="h-[86px]" />)
          ) : (
            <>
              <ScoreTile label="Leads owned" value={scorecard?.leadsOwned ?? 0} icon={Target} />
              <ScoreTile
                label="Contacted in 24h"
                value={scorecard?.contactedLast24h ?? 0}
                icon={PhoneCall}
              />
              <ScoreTile label="Quotes (30d)" value={scorecard?.quotesMonth ?? 0} icon={FileText} />
              <ScoreTile
                label="Revenue (30d)"
                value={formatCurrencyCompact(scorecard?.revenue || 0)}
                icon={Flame}
                accent="var(--ff-success)"
              />
            </>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          {/* My Day summary */}
          <div className="ff-card p-5 lg:col-span-1">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-md font-medium">My Day</h3>
              <button
                onClick={() => nav('/my-day')}
                className="text-xs text-accent hover:underline"
              >
                Open →
              </button>
            </div>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted">Overdue</span>
                <span className="ff-mono text-md text-danger">{overdueCount}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted">Today</span>
                <span className="ff-mono text-md text-text">{todayCount}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted">This week</span>
                <span className="ff-mono text-md text-text">{myDay?.week?.length || 0}</span>
              </div>
            </div>
          </div>

          {/* Hot Leads */}
          <div className="ff-card p-5 lg:col-span-2">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-md font-medium flex items-center gap-2">
                <Flame size={16} className="text-warn" />
                Hot leads
              </h3>
              <button onClick={() => nav('/leads')} className="text-xs text-accent hover:underline">
                All leads →
              </button>
            </div>
            <ul className="space-y-1.5">
              {hotLeads.map((l) => (
                <li
                  key={l._id}
                  onClick={() => nav(`/leads/${l._id}`)}
                  className="flex items-center gap-3 p-2 rounded-md hover:bg-elev2 ff-transition cursor-pointer"
                >
                  <div className="flex-1 min-w-0">
                    <div className="text-sm text-text truncate flex items-center gap-2">
                      {l.companyName}
                      <TemperatureBadge temperature={l.temperature} />
                    </div>
                    <div className="text-[11px] text-muted flex items-center gap-1.5 mt-0.5">
                      <StageBadge stage={l.stage} />
                      <span>· {formatRelative(l.lastActivityAt)}</span>
                    </div>
                  </div>
                  <span className="ff-mono text-sm text-text">
                    {formatCurrencyCompact(l.estimatedValue)}
                  </span>
                </li>
              ))}
              {hotLeads.length === 0 && (
                <li className="text-sm text-muted py-6 text-center">
                  No hot leads right now — keep nurturing!
                </li>
              )}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}

function ScoreTile({ icon: Icon, label, value, accent }) {
  return (
    <div className="ff-card p-4">
      <div className="flex items-center justify-between">
        <span className="text-xs text-muted">{label}</span>
        <Icon size={14} className="text-subtle" />
      </div>
      <div className="mt-2 ff-mono text-xl text-text" style={accent ? { color: accent } : undefined}>
        {value}
      </div>
    </div>
  );
}
