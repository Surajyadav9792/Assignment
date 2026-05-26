import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { settingsApi } from '../../api/endpoints.js';
import { PageHeader } from '../../components/layout/PageHeader.jsx';
import { Button } from '../../components/primitives/Button.jsx';
import { Modal } from '../../components/primitives/Modal.jsx';
import { Input, Label } from '../../components/primitives/Input.jsx';
import { Skeleton } from '../../components/primitives/EmptyState.jsx';
import { formatCurrency } from '../../lib/format.js';

export function ProductsSettings() {
  const { data, isLoading } = useQuery({ queryKey: ['products'], queryFn: settingsApi.products.list });
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ sku: '', name: '', category: '', defaultPrice: 0, unit: 'pcs' });

  const createMut = useMutation({
    mutationFn: (d) => settingsApi.products.create(d),
    onSuccess: () => {
      toast.success('Product added');
      qc.invalidateQueries({ queryKey: ['products'] });
      setOpen(false);
      setForm({ sku: '', name: '', category: '', defaultPrice: 0, unit: 'pcs' });
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Failed'),
  });

  const deleteMut = useMutation({
    mutationFn: (id) => settingsApi.products.delete(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['products'] });
      toast.success('Product deleted');
    },
  });

  return (
    <div>
      <PageHeader
        title="Products"
        subtitle="Product catalog with SKU, category, default pricing"
        actions={
          <Button variant="primary" leftIcon={<Plus size={14} />} onClick={() => setOpen(true)}>
            Add product
          </Button>
        }
      />

      <div className="p-6">
        {isLoading ? (
          <Skeleton className="h-64" />
        ) : (
          <div className="ff-card overflow-hidden">
            <table className="w-full">
              <thead className="bg-elev2/60">
                <tr className="text-left text-xs text-muted">
                  <th className="px-4 py-2.5 font-medium">SKU</th>
                  <th className="px-4 py-2.5 font-medium">Name</th>
                  <th className="px-4 py-2.5 font-medium">Category</th>
                  <th className="px-4 py-2.5 font-medium">Unit</th>
                  <th className="px-4 py-2.5 font-medium text-right">Default price</th>
                  <th className="w-10"></th>
                </tr>
              </thead>
              <tbody>
                {(data?.items || []).map((p) => (
                  <tr key={p._id} className="border-t border-border">
                    <td className="px-4 py-2.5 ff-mono text-xs text-muted">{p.sku}</td>
                    <td className="px-4 py-2.5 text-sm text-text">{p.name}</td>
                    <td className="px-4 py-2.5 text-sm text-muted">{p.category}</td>
                    <td className="px-4 py-2.5 text-sm text-muted">{p.unit}</td>
                    <td className="px-4 py-2.5 text-right ff-mono text-sm text-text">
                      {formatCurrency(p.defaultPrice)}
                    </td>
                    <td className="px-4 py-2.5">
                      <button
                        onClick={() => deleteMut.mutate(p._id)}
                        className="text-subtle hover:text-danger p-1"
                      >
                        <Trash2 size={14} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title="Add product"
        footer={
          <>
            <Button variant="ghost" onClick={() => setOpen(false)}>Cancel</Button>
            <Button
              variant="primary"
              onClick={() => createMut.mutate({ ...form, defaultPrice: Number(form.defaultPrice) })}
              disabled={!form.sku || !form.name || createMut.isPending}
            >
              Add
            </Button>
          </>
        }
      >
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>SKU *</Label>
              <Input value={form.sku} onChange={(e) => setForm({ ...form, sku: e.target.value })} />
            </div>
            <div>
              <Label>Unit</Label>
              <Input value={form.unit} onChange={(e) => setForm({ ...form, unit: e.target.value })} />
            </div>
          </div>
          <div>
            <Label>Name *</Label>
            <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Category</Label>
              <Input value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} />
            </div>
            <div>
              <Label>Default price (₹)</Label>
              <Input
                type="number"
                value={form.defaultPrice}
                onChange={(e) => setForm({ ...form, defaultPrice: e.target.value })}
              />
            </div>
          </div>
        </div>
      </Modal>
    </div>
  );
}
