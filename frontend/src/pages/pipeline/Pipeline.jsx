import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import {
  DndContext,
  closestCorners,
  PointerSensor,
  useSensor,
  useSensors,
  DragOverlay,
} from '@dnd-kit/core';
import { useDroppable, useDraggable } from '@dnd-kit/core';
import { toast } from 'sonner';
import { leadsApi, settingsApi } from '../../api/endpoints.js';
import { PageHeader } from '../../components/layout/PageHeader.jsx';
import { Avatar } from '../../components/primitives/Avatar.jsx';
import { TemperatureBadge } from '../../components/primitives/Badge.jsx';
import { Skeleton } from '../../components/primitives/EmptyState.jsx';
import { formatCurrencyCompact, formatRelative, daysBetween } from '../../lib/format.js';
import { cn } from '../../lib/cn.js';

export function Pipeline() {
  const nav = useNavigate();
  const qc = useQueryClient();
  const [activeId, setActiveId] = useState(null);

  const { data: stagesData, isLoading: stLoading } = useQuery({
    queryKey: ['stages'],
    queryFn: settingsApi.stages.list,
  });
  const { data: leadsData, isLoading: lLoading } = useQuery({
    queryKey: ['leads', 'pipeline'],
    queryFn: () => leadsApi.list({ limit: 200 }),
  });

  const stages = (stagesData?.items || []).filter((s) => s.isActive !== false);
  const leadsByStage = useMemo(() => {
    const map = {};
    stages.forEach((s) => (map[s._id] = []));
    (leadsData?.items || []).forEach((l) => {
      const sid = l.stage?._id;
      if (sid && map[sid]) map[sid].push(l);
    });
    return map;
  }, [leadsData, stages]);

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));

  const moveMut = useMutation({
    mutationFn: ({ id, stage }) => leadsApi.moveStage(id, stage),
    onMutate: async ({ id, stage }) => {
      await qc.cancelQueries({ queryKey: ['leads', 'pipeline'] });
      const prev = qc.getQueryData(['leads', 'pipeline']);
      qc.setQueryData(['leads', 'pipeline'], (old) => {
        if (!old) return old;
        const newStage = stages.find((s) => s._id === stage);
        return {
          ...old,
          items: old.items.map((l) =>
            l._id === id
              ? { ...l, stage: newStage ? { _id: newStage._id, name: newStage.name, color: newStage.color } : l.stage }
              : l
          ),
        };
      });
      return { prev };
    },
    onError: (_e, _v, ctx) => {
      if (ctx?.prev) qc.setQueryData(['leads', 'pipeline'], ctx.prev);
      toast.error('Failed to move card');
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['leads', 'pipeline'] });
      qc.invalidateQueries({ queryKey: ['kpis'] });
      qc.invalidateQueries({ queryKey: ['funnel'] });
    },
  });

  const handleDragEnd = (event) => {
    setActiveId(null);
    const { active, over } = event;
    if (!over) return;
    const leadId = active.id;
    const newStageId = over.id;
    const lead = (leadsData?.items || []).find((l) => l._id === leadId);
    if (!lead || lead.stage?._id === newStageId) return;
    moveMut.mutate({ id: leadId, stage: newStageId });
  };

  const activeLead = activeId ? (leadsData?.items || []).find((l) => l._id === activeId) : null;

  if (stLoading || lLoading) {
    return (
      <div>
        <PageHeader title="Pipeline" subtitle="Drag deals between stages" />
        <div className="p-6 flex gap-3 overflow-x-auto">
          {[...Array(6)].map((_, i) => (
            <Skeleton key={i} className="w-72 h-96 shrink-0" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <PageHeader
        title="Pipeline"
        subtitle={`${leadsData?.items?.length || 0} deals across ${stages.length} stages`}
      />

      <DndContext
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragStart={(e) => setActiveId(e.active.id)}
        onDragEnd={handleDragEnd}
        onDragCancel={() => setActiveId(null)}
      >
        <div className="flex-1 overflow-x-auto overflow-y-hidden">
          <div className="flex gap-3 px-6 py-5 min-h-0 h-full">
            {stages.map((stage) => (
              <KanbanColumn
                key={stage._id}
                stage={stage}
                leads={leadsByStage[stage._id] || []}
                onCardClick={(id) => nav(`/leads/${id}`)}
              />
            ))}
          </div>
        </div>

        <DragOverlay>
          {activeLead ? <KanbanCard lead={activeLead} dragging /> : null}
        </DragOverlay>
      </DndContext>
    </div>
  );
}

function KanbanColumn({ stage, leads, onCardClick }) {
  const { isOver, setNodeRef } = useDroppable({ id: stage._id });
  const sum = leads.reduce((s, l) => s + (l.estimatedValue || 0), 0);

  return (
    <div className="w-72 shrink-0 flex flex-col">
      <div className="ff-card flex flex-col h-full">
        {/* Header */}
        <div
          className="px-3 py-2.5 border-b border-border flex items-center justify-between rounded-t-lg"
          style={{ borderTop: `2px solid ${stage.color}` }}
        >
          <div className="flex items-center gap-2 min-w-0">
            <span
              className="w-2 h-2 rounded-full shrink-0"
              style={{ background: stage.color }}
            />
            <span className="text-sm font-medium text-text truncate">{stage.name}</span>
            <span className="text-xs text-muted ff-mono">{leads.length}</span>
          </div>
          <span className="text-xs text-muted ff-mono">{formatCurrencyCompact(sum)}</span>
        </div>

        {/* Cards */}
        <div
          ref={setNodeRef}
          className={cn(
            'flex-1 overflow-y-auto p-2 space-y-2 ff-transition',
            isOver && 'bg-accent-soft/30'
          )}
          style={{ minHeight: 200 }}
        >
          {leads.length === 0 ? (
            <div className="text-xs text-subtle text-center py-6 border border-dashed border-border rounded-md">
              Drop deals here
            </div>
          ) : (
            leads.map((lead) => (
              <KanbanCard key={lead._id} lead={lead} onClick={() => onCardClick(lead._id)} />
            ))
          )}
        </div>
      </div>
    </div>
  );
}

function KanbanCard({ lead, onClick, dragging }) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({ id: lead._id });
  const style = transform
    ? { transform: `translate3d(${transform.x}px, ${transform.y}px, 0)` }
    : undefined;

  const lastHist = lead.stageHistory?.[lead.stageHistory.length - 1];
  const daysInStage = lastHist ? daysBetween(lastHist.enteredAt) : 0;
  const stageColor = lead.stage?.color || '#5A6573';

  const borderColor = daysInStage > 14 ? 'var(--ff-danger)' : daysInStage > 7 ? 'var(--ff-warn)' : 'var(--ff-border)';

  return (
    <div
      ref={setNodeRef}
      style={{
        ...style,
        opacity: isDragging && !dragging ? 0.3 : 1,
        borderLeft: `3px solid ${stageColor}`,
        borderTop: `1px solid ${borderColor}`,
        borderRight: `1px solid ${borderColor}`,
        borderBottom: `1px solid ${borderColor}`,
      }}
      {...listeners}
      {...attributes}
      onClick={(e) => {
        if (!isDragging && onClick) onClick(e);
      }}
      className={cn(
        'rounded-md bg-elev2 p-2.5 cursor-grab active:cursor-grabbing select-none ff-transition',
        dragging && 'shadow-elev',
        'hover:bg-[#212935]'
      )}
    >
      <div className="flex items-start justify-between gap-2 mb-1.5">
        <div className="text-sm font-medium text-text leading-tight truncate flex-1">
          {lead.companyName}
        </div>
        <TemperatureBadge temperature={lead.temperature} />
      </div>

      <div className="ff-mono text-md text-text">{formatCurrencyCompact(lead.estimatedValue)}</div>

      <div className="text-[11px] text-muted mt-0.5 truncate">
        {lead.industryVertical || '—'} · {lead.location?.state || '—'}
      </div>

      <div className="mt-2 pt-2 border-t border-border flex items-center justify-between">
        <Avatar name={lead.owner?.name} size={20} />
        <div className="flex items-center gap-2 text-[11px] text-subtle">
          <span
            className={cn(
              daysInStage > 14 ? 'text-danger' : daysInStage > 7 ? 'text-warn' : ''
            )}
          >
            {daysInStage}d
          </span>
          <span>·</span>
          <span>{formatRelative(lead.lastActivityAt)}</span>
        </div>
      </div>
    </div>
  );
}
