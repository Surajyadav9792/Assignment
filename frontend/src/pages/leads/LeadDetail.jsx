import { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  ArrowLeft,
  Phone,
  Mail,
  Building2,
  MapPin,
  Plus,
  FileText,
  Package,
  Phone as PhoneIcon,
  Users as UsersIcon,
  StickyNote,
  GitBranch,
} from 'lucide-react';
import { leadsApi, settingsApi } from '../../api/endpoints.js';
import { PageHeader } from '../../components/layout/PageHeader.jsx';
import { Button } from '../../components/primitives/Button.jsx';
import { StageBadge, TemperatureBadge, Badge } from '../../components/primitives/Badge.jsx';
import { Avatar } from '../../components/primitives/Avatar.jsx';
import { Tabs } from '../../components/primitives/Tabs.jsx';
import { Skeleton } from '../../components/primitives/EmptyState.jsx';
import { Select } from '../../components/primitives/Input.jsx';
import { ActivityLogger } from '../../components/activity/ActivityLogger.jsx';
import { formatCurrency, formatDateTime, formatRelative, daysBetween } from '../../lib/format.js';
import { toast } from 'sonner';
import { cn } from '../../lib/cn.js';

const ACTIVITY_ICONS = {
  call: PhoneIcon,
  email: Mail,
  meeting: UsersIcon,
  note: StickyNote,
  sample: Package,
  quote: FileText,
  rfq: FileText,
  stage_change: GitBranch,
};

export function LeadDetail() {
  const { id } = useParams();
  const nav = useNavigate();
  const qc = useQueryClient();
  const [tab, setTab] = useState('activity');
  const [loggerOpen, setLoggerOpen] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ['lead', id],
    queryFn: () => leadsApi.get(id),
  });
  const { data: actData } = useQuery({
    queryKey: ['activities', id],
    queryFn: () => leadsApi.activities(id),
    enabled: !!id,
  });
  const { data: stagesData } = useQuery({ queryKey: ['stages'], queryFn: settingsApi.stages.list });

  const moveMut = useMutation({
    mutationFn: (stage) => leadsApi.moveStage(id, stage),
    onSuccess: () => {
      toast.success('Stage updated');
      qc.invalidateQueries({ queryKey: ['lead', id] });
      qc.invalidateQueries({ queryKey: ['activities', id] });
    },
    onError: () => toast.error('Failed to move stage'),
  });

  if (isLoading) {
    return (
      <div className="p-6 space-y-4">
        <Skeleton className="h-12 w-1/3" />
        <Skeleton className="h-32" />
        <Skeleton className="h-64" />
      </div>
    );
  }

  const lead = data?.lead;
  if (!lead) return <div className="p-6 text-muted">Lead not found</div>;

  const lastStageEntry = lead.stageHistory?.[lead.stageHistory.length - 1];
  const daysInStage = lastStageEntry ? daysBetween(lastStageEntry.enteredAt) : 0;

  return (
    <div>
      <PageHeader
        title={lead.companyName}
        breadcrumb={
          <Link to="/leads" className="hover:text-text inline-flex items-center gap-1">
            <ArrowLeft size={12} /> Leads
          </Link>
        }
        actions={
          <>
            <Button variant="secondary" leftIcon={<Plus size={14} />} onClick={() => setLoggerOpen(true)}>
              Log activity
            </Button>
            <Button
              variant="primary"
              leftIcon={<FileText size={14} />}
              onClick={() => nav(`/quotes/new?lead=${lead._id}`)}
            >
              Create quote
            </Button>
          </>
        }
      />

      <div className="p-6 grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Left column */}
        <div className="lg:col-span-5 space-y-5">
          {/* Profile */}
          <div className="ff-card p-5">
            <div className="flex items-start justify-between gap-3 mb-3">
              <div>
                <div className="text-lg font-medium text-text">{lead.contactName}</div>
                <div className="text-sm text-muted">{lead.designation || '—'}</div>
              </div>
              <TemperatureBadge temperature={lead.temperature} />
            </div>

            <div className="space-y-1.5 text-sm">
              <Info icon={Building2} value={lead.industryVertical || '—'} />
              <Info icon={MapPin} value={[lead.location?.city, lead.location?.state].filter(Boolean).join(', ') || '—'} />
              <Info icon={Mail} value={lead.email || '—'} />
              <Info icon={Phone} value={lead.phone || '—'} />
            </div>

            {lead.tags?.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mt-3 pt-3 border-t border-border">
                {lead.tags.map((t) => (
                  <Badge key={t} variant="default">
                    {t}
                  </Badge>
                ))}
              </div>
            )}
          </div>

          {/* Stage + value card */}
          <div className="ff-card p-5">
            <div className="grid grid-cols-2 gap-4">
              <Stat label="Estimated value">
                <span className="ff-mono text-lg text-text">{formatCurrency(lead.estimatedValue)}</span>
              </Stat>
              <Stat label="Days in stage">
                <span
                  className={cn(
                    'ff-mono text-lg',
                    daysInStage > 14 ? 'text-danger' : daysInStage > 7 ? 'text-warn' : 'text-text'
                  )}
                >
                  {daysInStage}d
                </span>
              </Stat>
              <Stat label="Owner">
                <div className="flex items-center gap-2 mt-1">
                  <Avatar name={lead.owner?.name} size={22} />
                  <span className="text-sm text-text">{lead.owner?.name}</span>
                </div>
              </Stat>
              <Stat label="Score">
                <div className="flex items-center gap-2 mt-1">
                  <div className="flex-1 h-1.5 rounded-full bg-elev2 overflow-hidden">
                    <div
                      className="h-full bg-accent"
                      style={{ width: `${lead.score}%` }}
                    />
                  </div>
                  <span className="ff-mono text-sm text-text">{lead.score}</span>
                </div>
              </Stat>
            </div>

            <div className="mt-4 pt-4 border-t border-border">
              <Label>Stage</Label>
              <Select
                value={lead.stage?._id}
                onChange={(e) => moveMut.mutate(e.target.value)}
                disabled={moveMut.isPending}
              >
                {(stagesData?.items || []).map((s) => (
                  <option key={s._id} value={s._id}>
                    {s.name}
                  </option>
                ))}
              </Select>
            </div>
          </div>
        </div>

        {/* Right column */}
        <div className="lg:col-span-7 space-y-5">
          <div className="ff-card">
            <Tabs
              tabs={[
                { value: 'activity', label: 'Activity', count: actData?.items?.length },
                { value: 'overview', label: 'Overview' },
                { value: 'history', label: 'Stage history' },
              ]}
              value={tab}
              onChange={setTab}
              className="px-4"
            />

            <div className="p-5">
              {tab === 'activity' && (
                <div>
                  {(actData?.items || []).length === 0 ? (
                    <div className="text-sm text-muted py-8 text-center">
                      No activities yet. Click "Log activity" to add one.
                    </div>
                  ) : (
                    <ol className="space-y-4">
                      {(actData?.items || []).map((a) => {
                        const Icon = ACTIVITY_ICONS[a.type] || StickyNote;
                        return (
                          <li key={a._id} className="flex gap-3">
                            <div className="flex flex-col items-center">
                              <div className="w-7 h-7 rounded-full bg-elev2 border border-border flex items-center justify-center text-muted">
                                <Icon size={13} />
                              </div>
                              <div className="flex-1 w-px bg-border my-1.5" />
                            </div>
                            <div className="flex-1 pb-3 min-w-0">
                              <div className="flex items-baseline justify-between gap-3">
                                <div className="text-sm text-text">
                                  <span className="capitalize">{a.type.replace('_', ' ')}</span>
                                  {a.subject && <span className="text-muted"> · {a.subject}</span>}
                                  {a.outcome && (
                                    <Badge variant="info" className="ml-2">
                                      {a.outcome}
                                    </Badge>
                                  )}
                                </div>
                                <span className="text-[11px] text-subtle whitespace-nowrap">
                                  {formatDateTime(a.occurredAt)}
                                </span>
                              </div>
                              {a.body && <div className="text-sm text-muted mt-1 leading-relaxed">{a.body}</div>}
                              <div className="text-[11px] text-subtle mt-1 flex items-center gap-1">
                                <Avatar name={a.performedBy?.name} size={14} />
                                {a.performedBy?.name}
                              </div>
                            </div>
                          </li>
                        );
                      })}
                    </ol>
                  )}
                </div>
              )}

              {tab === 'overview' && (
                <div className="space-y-4">
                  <div>
                    <div className="ff-section-title mb-2">Notes</div>
                    <p className="text-sm text-text whitespace-pre-wrap">
                      {lead.notes || <span className="text-muted">No notes yet.</span>}
                    </p>
                  </div>
                  <div>
                    <div className="ff-section-title mb-2">Product interest</div>
                    <div className="flex flex-wrap gap-1.5">
                      {(lead.productInterest || []).map((p) => (
                        <Badge key={p._id} variant="default">
                          {p.name}
                        </Badge>
                      ))}
                      {(!lead.productInterest || lead.productInterest.length === 0) && (
                        <span className="text-sm text-muted">—</span>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {tab === 'history' && (
                <ol className="space-y-2">
                  {(lead.stageHistory || []).slice().reverse().map((h, i) => (
                    <li key={i} className="flex items-center gap-3">
                      <StageBadge stage={h.stage} />
                      <span className="text-xs text-muted">
                        {formatDateTime(h.enteredAt)} · {h.by?.name || '—'}
                      </span>
                    </li>
                  ))}
                </ol>
              )}
            </div>
          </div>
        </div>
      </div>

      <ActivityLogger open={loggerOpen} onClose={() => setLoggerOpen(false)} leadId={id} />
    </div>
  );
}

function Info({ icon: Icon, value }) {
  return (
    <div className="flex items-center gap-2 text-sm">
      <Icon size={13} className="text-subtle shrink-0" />
      <span className="text-text">{value}</span>
    </div>
  );
}

function Stat({ label, children }) {
  return (
    <div>
      <div className="text-[11px] text-muted uppercase tracking-wider">{label}</div>
      <div className="mt-0.5">{children}</div>
    </div>
  );
}

function Label({ children }) {
  return <div className="text-xs text-muted font-medium mb-1.5">{children}</div>;
}
