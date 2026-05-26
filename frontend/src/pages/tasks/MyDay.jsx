import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { Check, Clock, AlertCircle, CalendarDays, MoreHorizontal } from 'lucide-react';
import { toast } from 'sonner';
import { tasksApi } from '../../api/endpoints.js';
import { PageHeader } from '../../components/layout/PageHeader.jsx';
import { Skeleton, EmptyState } from '../../components/primitives/EmptyState.jsx';
import { Badge } from '../../components/primitives/Badge.jsx';
import { formatDate } from '../../lib/format.js';
import { cn } from '../../lib/cn.js';
import dayjs from 'dayjs';

export function MyDay() {
  const { data, isLoading } = useQuery({ queryKey: ['myDay'], queryFn: tasksApi.myDay });
  const qc = useQueryClient();

  const completeMut = useMutation({
    mutationFn: (id) => tasksApi.complete(id),
    onSuccess: () => {
      toast.success('Task completed');
      qc.invalidateQueries({ queryKey: ['myDay'] });
    },
  });
  const snoozeMut = useMutation({
    mutationFn: ({ id, until }) => tasksApi.snooze(id, until),
    onSuccess: () => {
      toast.success('Task snoozed');
      qc.invalidateQueries({ queryKey: ['myDay'] });
    },
  });

  const today = new Date().toLocaleDateString('en-IN', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  return (
    <div>
      <PageHeader title="My Day" subtitle={today} />

      <div className="p-6 max-w-3xl space-y-5">
        {isLoading ? (
          <Skeleton className="h-64" />
        ) : (
          <>
            <Section
              icon={AlertCircle}
              label="Overdue"
              accent="var(--ff-danger)"
              count={(data?.overdue || []).length}
            >
              {(data?.overdue || []).map((t) => (
                <TaskRow
                  key={t._id}
                  task={t}
                  onComplete={() => completeMut.mutate(t._id)}
                  onSnooze={(until) => snoozeMut.mutate({ id: t._id, until })}
                  overdue
                />
              ))}
              {(data?.overdue || []).length === 0 && (
                <Empty text="No overdue tasks — nicely done." />
              )}
            </Section>

            <Section
              icon={Clock}
              label="Today"
              accent="var(--ff-accent)"
              count={(data?.today || []).length}
            >
              {(data?.today || []).map((t) => (
                <TaskRow
                  key={t._id}
                  task={t}
                  onComplete={() => completeMut.mutate(t._id)}
                  onSnooze={(until) => snoozeMut.mutate({ id: t._id, until })}
                />
              ))}
              {(data?.today || []).length === 0 && <Empty text="Nothing on today's list." />}
            </Section>

            <Section
              icon={CalendarDays}
              label="This week"
              accent="var(--ff-text-muted)"
              count={(data?.week || []).length}
            >
              {(data?.week || []).map((t) => (
                <TaskRow
                  key={t._id}
                  task={t}
                  onComplete={() => completeMut.mutate(t._id)}
                  onSnooze={(until) => snoozeMut.mutate({ id: t._id, until })}
                />
              ))}
              {(data?.week || []).length === 0 && <Empty text="A clear week ahead." />}
            </Section>
          </>
        )}
      </div>
    </div>
  );
}

function Section({ icon: Icon, label, accent, count, children }) {
  return (
    <div className="ff-card">
      <div
        className="px-5 py-3 border-b border-border flex items-center gap-2"
        style={{ borderTop: `2px solid ${accent}` }}
      >
        <Icon size={15} style={{ color: accent }} />
        <span className="text-sm font-medium text-text">{label}</span>
        <span className="ff-mono text-xs text-muted">{count}</span>
      </div>
      <div className="divide-y divide-border">{children}</div>
    </div>
  );
}

function TaskRow({ task, onComplete, onSnooze, overdue }) {
  const nav = useNavigate();
  return (
    <div className="group flex items-center gap-3 px-5 py-3 hover:bg-elev2/40 ff-transition">
      <button
        onClick={onComplete}
        className="w-5 h-5 rounded-full border-2 border-border hover:border-accent flex items-center justify-center ff-transition shrink-0"
        title="Mark complete"
      >
        <Check size={11} className="text-transparent group-hover:text-accent ff-transition" />
      </button>

      <div className="flex-1 min-w-0">
        <div className="text-sm text-text">{task.title}</div>
        <div className="text-[11px] text-muted flex items-center gap-1.5 mt-0.5">
          {task.lead && (
            <button
              onClick={() => nav(`/leads/${task.lead._id}`)}
              className="text-accent hover:underline"
            >
              {task.lead.companyName}
            </button>
          )}
          {task.priority !== 'medium' && (
            <Badge
              variant={task.priority === 'high' ? 'danger' : 'default'}
              className="ml-1"
            >
              {task.priority}
            </Badge>
          )}
        </div>
      </div>

      <div className={cn('text-xs ff-mono', overdue ? 'text-danger' : 'text-muted')}>
        {overdue ? `${dayjs().diff(dayjs(task.dueDate), 'day')}d late` : formatDate(task.dueDate, 'DD MMM')}
      </div>

      <button
        onClick={() => onSnooze(dayjs().add(1, 'day').toISOString())}
        className="opacity-0 group-hover:opacity-100 ff-transition text-xs text-muted hover:text-text"
        title="Snooze 1 day"
      >
        Snooze
      </button>
    </div>
  );
}

function Empty({ text }) {
  return <div className="px-5 py-6 text-sm text-muted text-center">{text}</div>;
}
