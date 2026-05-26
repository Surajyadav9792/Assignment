import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { Plus, Filter, Search, X } from 'lucide-react';
import { leadsApi, settingsApi } from '../../api/endpoints.js';
import { PageHeader } from '../../components/layout/PageHeader.jsx';
import { Button } from '../../components/primitives/Button.jsx';
import { Input } from '../../components/primitives/Input.jsx';
import { StageBadge, TemperatureBadge, Badge } from '../../components/primitives/Badge.jsx';
import { Avatar } from '../../components/primitives/Avatar.jsx';
import { Skeleton, EmptyState } from '../../components/primitives/EmptyState.jsx';
import { formatCurrency, formatRelative, daysBetween } from '../../lib/format.js';
import { cn } from '../../lib/cn.js';

export function LeadsList() {
  const nav = useNavigate();
  const [q, setQ] = useState('');
  const [stageFilter, setStageFilter] = useState('');
  const [tempFilter, setTempFilter] = useState('');

  const { data: stagesData } = useQuery({ queryKey: ['stages'], queryFn: settingsApi.stages.list });
  const { data, isLoading } = useQuery({
    queryKey: ['leads', { q, stage: stageFilter }],
    queryFn: () => leadsApi.list({ q, stage: stageFilter, limit: 100 }),
  });

  const filtered = useMemo(() => {
    let items = data?.items || [];
    if (tempFilter) items = items.filter((l) => l.temperature === tempFilter);
    return items;
  }, [data, tempFilter]);

  const clear = () => {
    setQ('');
    setStageFilter('');
    setTempFilter('');
  };
  const hasFilters = q || stageFilter || tempFilter;

  return (
    <div>
      <PageHeader
        title="Leads"
        subtitle="All leads in your pipeline"
        actions={
          <Button variant="primary" leftIcon={<Plus size={14} />} onClick={() => nav('/leads/new')}>
            New Lead
          </Button>
        }
      />

      <div className="px-6 py-3 border-b border-border bg-bg flex items-center gap-2 flex-wrap">
        <div className="relative w-64">
          <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-subtle pointer-events-none" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search leads…"
            className="w-full h-8 pl-8 pr-3 text-sm bg-elev border border-border rounded-md text-text placeholder:text-subtle focus:outline-none focus:border-accent ff-transition"
          />
        </div>

        <select
          value={stageFilter}
          onChange={(e) => setStageFilter(e.target.value)}
          className="h-8 px-2.5 text-sm bg-elev border border-border rounded-md text-text focus:outline-none focus:border-accent"
        >
          <option value="">All stages</option>
          {(stagesData?.items || []).map((s) => (
            <option key={s._id} value={s._id}>
              {s.name}
            </option>
          ))}
        </select>

        <div className="flex gap-1">
          {['hot', 'warm', 'cold'].map((t) => (
            <button
              key={t}
              onClick={() => setTempFilter(tempFilter === t ? '' : t)}
              className={cn(
                'h-8 px-2.5 text-xs rounded-md border ff-transition capitalize',
                tempFilter === t
                  ? 'bg-accent-soft border-accent text-accent'
                  : 'bg-elev border-border text-muted hover:text-text'
              )}
            >
              {t}
            </button>
          ))}
        </div>

        {hasFilters && (
          <button onClick={clear} className="h-8 px-2 text-xs text-muted hover:text-text">
            <X size={12} className="inline mr-1" /> Clear
          </button>
        )}

        <div className="flex-1" />
        <span className="text-xs text-muted ff-mono">{filtered.length} leads</span>
      </div>

      <div className="p-6">
        {isLoading ? (
          <div className="space-y-2">
            {[...Array(6)].map((_, i) => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <EmptyState
            icon={Filter}
            title={hasFilters ? 'No leads match these filters' : 'No leads yet'}
            description={hasFilters ? 'Try clearing the filters or searching for something else.' : 'Create your first lead to start tracking.'}
            action={
              hasFilters ? (
                <Button onClick={clear} variant="secondary">
                  Clear filters
                </Button>
              ) : (
                <Button variant="primary" onClick={() => nav('/leads/new')} leftIcon={<Plus size={14} />}>
                  Create lead
                </Button>
              )
            }
          />
        ) : (
          <div className="ff-card overflow-hidden">
            <table className="w-full">
              <thead className="bg-elev2/60 sticky top-0">
                <tr className="text-left text-xs text-muted">
                  <th className="px-4 py-2.5 font-medium">Company</th>
                  <th className="px-4 py-2.5 font-medium">Stage</th>
                  <th className="px-4 py-2.5 font-medium">Owner</th>
                  <th className="px-4 py-2.5 font-medium text-right">Value</th>
                  <th className="px-4 py-2.5 font-medium">Score</th>
                  <th className="px-4 py-2.5 font-medium">Days in stage</th>
                  <th className="px-4 py-2.5 font-medium">Last activity</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((l) => {
                  const lastHist = l.stageHistory?.[l.stageHistory.length - 1];
                  const daysInStage = lastHist ? daysBetween(lastHist.enteredAt) : 0;
                  return (
                    <tr
                      key={l._id}
                      onClick={() => nav(`/leads/${l._id}`)}
                      className="border-t border-border hover:bg-elev2/40 ff-transition cursor-pointer"
                    >
                      <td className="px-4 py-2.5">
                        <div className="flex flex-col">
                          <span className="text-sm text-text">{l.companyName}</span>
                          <span className="text-[11px] text-muted">
                            {l.contactName} · {l.location?.city}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-2.5">
                        <StageBadge stage={l.stage} />
                      </td>
                      <td className="px-4 py-2.5">
                        <div className="flex items-center gap-2">
                          <Avatar name={l.owner?.name} size={22} />
                          <span className="text-sm text-text">{l.owner?.name?.split(' ')[0]}</span>
                        </div>
                      </td>
                      <td className="px-4 py-2.5 text-right ff-mono text-sm text-text">
                        {formatCurrency(l.estimatedValue)}
                      </td>
                      <td className="px-4 py-2.5">
                        <div className="flex items-center gap-2">
                          <TemperatureBadge temperature={l.temperature} />
                          <span className="ff-mono text-xs text-muted">{l.score}</span>
                        </div>
                      </td>
                      <td className="px-4 py-2.5">
                        <span
                          className={cn(
                            'ff-mono text-sm',
                            daysInStage > 14 ? 'text-danger' : daysInStage > 7 ? 'text-warn' : 'text-text'
                          )}
                        >
                          {daysInStage}d
                        </span>
                      </td>
                      <td className="px-4 py-2.5 text-sm text-muted">
                        {formatRelative(l.lastActivityAt)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
