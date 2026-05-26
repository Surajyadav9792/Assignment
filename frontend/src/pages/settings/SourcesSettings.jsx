import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, X } from 'lucide-react';
import { toast } from 'sonner';
import { settingsApi } from '../../api/endpoints.js';
import { PageHeader } from '../../components/layout/PageHeader.jsx';
import { Button } from '../../components/primitives/Button.jsx';
import { Input } from '../../components/primitives/Input.jsx';
import { Skeleton } from '../../components/primitives/EmptyState.jsx';

export function SourcesSettings() {
  const { data, isLoading } = useQuery({ queryKey: ['sources'], queryFn: settingsApi.sources.list });
  const qc = useQueryClient();
  const [name, setName] = useState('');

  const createMut = useMutation({
    mutationFn: (n) => settingsApi.sources.create({ name: n }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['sources'] });
      setName('');
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Failed'),
  });
  const deleteMut = useMutation({
    mutationFn: (id) => settingsApi.sources.delete(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['sources'] }),
  });

  return (
    <div>
      <PageHeader title="Lead sources" subtitle="Track where your leads come from" />

      <div className="p-6 max-w-2xl">
        <div className="ff-card p-5">
          <div className="flex items-center gap-2 mb-4">
            <Input
              placeholder="New source name…"
              value={name}
              onChange={(e) => setName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && name.trim()) createMut.mutate(name.trim());
              }}
            />
            <Button
              variant="primary"
              onClick={() => createMut.mutate(name.trim())}
              disabled={!name.trim() || createMut.isPending}
              leftIcon={<Plus size={14} />}
            >
              Add
            </Button>
          </div>

          {isLoading ? (
            <Skeleton className="h-32" />
          ) : (
            <div className="flex flex-wrap gap-2">
              {(data?.items || []).map((s) => (
                <div
                  key={s._id}
                  className="inline-flex items-center gap-1.5 pl-3 pr-1.5 py-1 rounded-md bg-elev2 border border-border text-sm"
                >
                  <span className="text-text">{s.name}</span>
                  <button
                    onClick={() => deleteMut.mutate(s._id)}
                    className="text-subtle hover:text-danger p-0.5 rounded ff-transition"
                  >
                    <X size={12} />
                  </button>
                </div>
              ))}
              {(data?.items || []).length === 0 && (
                <p className="text-sm text-muted">No sources yet.</p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
