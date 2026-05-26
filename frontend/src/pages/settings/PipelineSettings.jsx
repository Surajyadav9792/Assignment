import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical, Save } from 'lucide-react';
import { toast } from 'sonner';
import { settingsApi } from '../../api/endpoints.js';
import { PageHeader } from '../../components/layout/PageHeader.jsx';
import { Button } from '../../components/primitives/Button.jsx';
import { Skeleton } from '../../components/primitives/EmptyState.jsx';

export function PipelineSettings() {
  const { data, isLoading } = useQuery({ queryKey: ['stages'], queryFn: settingsApi.stages.list });
  const qc = useQueryClient();
  const [stages, setStages] = useState([]);
  const [dirty, setDirty] = useState(false);

  useEffect(() => {
    if (data?.items) setStages(data.items);
  }, [data]);

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 4 } }));

  const reorderMut = useMutation({
    mutationFn: (order) => settingsApi.stages.reorder(order),
    onSuccess: () => {
      toast.success('Pipeline order saved');
      qc.invalidateQueries({ queryKey: ['stages'] });
      setDirty(false);
    },
    onError: () => toast.error('Failed to reorder'),
  });

  const handleDragEnd = (event) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = stages.findIndex((s) => s._id === active.id);
    const newIndex = stages.findIndex((s) => s._id === over.id);
    setStages((prev) => arrayMove(prev, oldIndex, newIndex));
    setDirty(true);
  };

  const save = () =>
    reorderMut.mutate(stages.map((s, idx) => ({ id: s._id, order: idx })));

  if (isLoading) return <Skeleton className="m-6 h-64" />;

  return (
    <div>
      <PageHeader
        title="Pipeline stages"
        subtitle="Drag to reorder. Probability is used in forecasting."
        actions={
          <Button
            variant="primary"
            disabled={!dirty || reorderMut.isPending}
            onClick={save}
            leftIcon={<Save size={14} />}
          >
            {reorderMut.isPending ? 'Saving…' : 'Save order'}
          </Button>
        }
      />

      <div className="p-6 max-w-2xl">
        <div className="ff-card p-2">
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext items={stages.map((s) => s._id)} strategy={verticalListSortingStrategy}>
              <ul>
                {stages.map((s) => (
                  <StageRow key={s._id} stage={s} />
                ))}
              </ul>
            </SortableContext>
          </DndContext>
        </div>
      </div>
    </div>
  );
}

function StageRow({ stage }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: stage._id,
  });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.7 : 1,
  };

  return (
    <li
      ref={setNodeRef}
      style={style}
      className="flex items-center gap-3 px-3 py-2.5 rounded-md hover:bg-elev2/60 ff-transition"
    >
      <button {...attributes} {...listeners} className="text-subtle hover:text-text cursor-grab">
        <GripVertical size={16} />
      </button>
      <span className="w-2 h-2 rounded-full" style={{ background: stage.color }} />
      <span className="flex-1 text-sm text-text">{stage.name}</span>
      <span className="text-xs text-muted ff-mono w-12 text-right">{stage.probability}%</span>
      {stage.isTerminal && (
        <span className="text-[10px] text-subtle uppercase tracking-wider">Terminal</span>
      )}
    </li>
  );
}
