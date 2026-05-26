import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { Plus, Package } from 'lucide-react';
import { toast } from 'sonner';
import { samplesApi, leadsApi, settingsApi } from '../../api/endpoints.js';
import { PageHeader } from '../../components/layout/PageHeader.jsx';
import { Button } from '../../components/primitives/Button.jsx';
import { Badge } from '../../components/primitives/Badge.jsx';
import { Avatar } from '../../components/primitives/Avatar.jsx';
import { Skeleton, EmptyState } from '../../components/primitives/EmptyState.jsx';
import { Modal } from '../../components/primitives/Modal.jsx';
import { Input, Select, Label } from '../../components/primitives/Input.jsx';
import { formatDate } from '../../lib/format.js';

const STATUS_LABELS = {
  requested: 'Requested',
  dispatched: 'Dispatched',
  delivered: 'Delivered',
  feedback_received: 'Feedback in',
  approved: 'Approved',
  rejected: 'Rejected',
};
const STATUS_VARIANT = {
  requested: 'default',
  dispatched: 'info',
  delivered: 'warn',
  feedback_received: 'warn',
  approved: 'success',
  rejected: 'danger',
};

export function SamplesList() {
  const nav = useNavigate();
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    lead: '',
    productName: '',
    quantity: 1,
    courier: '',
    awbNumber: '',
    status: 'requested',
  });

  const { data, isLoading } = useQuery({ queryKey: ['samples'], queryFn: () => samplesApi.list() });
  const { data: leadsRes } = useQuery({
    queryKey: ['leads', 'all'],
    queryFn: () => leadsApi.list({ limit: 100 }),
  });
  const { data: products } = useQuery({ queryKey: ['products'], queryFn: settingsApi.products.list });

  const createMut = useMutation({
    mutationFn: (data) => samplesApi.create(data),
    onSuccess: () => {
      toast.success('Sample created');
      qc.invalidateQueries({ queryKey: ['samples'] });
      setOpen(false);
      setForm({ lead: '', productName: '', quantity: 1, courier: '', awbNumber: '', status: 'requested' });
    },
    onError: () => toast.error('Failed to create sample'),
  });

  return (
    <div>
      <PageHeader
        title="Samples"
        subtitle="Track sample dispatches and feedback"
        actions={
          <Button variant="primary" leftIcon={<Plus size={14} />} onClick={() => setOpen(true)}>
            New Sample
          </Button>
        }
      />

      <div className="p-6">
        {isLoading ? (
          <Skeleton className="h-64" />
        ) : (data?.items || []).length === 0 ? (
          <EmptyState
            icon={Package}
            title="No samples yet"
            description="Log a sample dispatch and track its lifecycle."
            action={
              <Button variant="primary" onClick={() => setOpen(true)} leftIcon={<Plus size={14} />}>
                New sample
              </Button>
            }
          />
        ) : (
          <div className="ff-card overflow-hidden">
            <table className="w-full">
              <thead className="bg-elev2/60">
                <tr className="text-left text-xs text-muted">
                  <th className="px-4 py-2.5 font-medium">Product</th>
                  <th className="px-4 py-2.5 font-medium">Lead</th>
                  <th className="px-4 py-2.5 font-medium">Status</th>
                  <th className="px-4 py-2.5 font-medium">Courier / AWB</th>
                  <th className="px-4 py-2.5 font-medium">Dispatched</th>
                  <th className="px-4 py-2.5 font-medium">Owner</th>
                </tr>
              </thead>
              <tbody>
                {(data?.items || []).map((s) => (
                  <tr
                    key={s._id}
                    className="border-t border-border hover:bg-elev2/40 ff-transition cursor-pointer"
                    onClick={() => nav(`/leads/${s.lead?._id}`)}
                  >
                    <td className="px-4 py-2.5">
                      <div className="text-sm text-text">{s.productName}</div>
                      <div className="text-xs text-muted">Qty: {s.quantity}</div>
                    </td>
                    <td className="px-4 py-2.5 text-sm text-text">{s.lead?.companyName}</td>
                    <td className="px-4 py-2.5">
                      <Badge variant={STATUS_VARIANT[s.status]}>{STATUS_LABELS[s.status]}</Badge>
                    </td>
                    <td className="px-4 py-2.5 text-xs">
                      <div className="text-text">{s.courier || '—'}</div>
                      <div className="ff-mono text-muted">{s.awbNumber || ''}</div>
                    </td>
                    <td className="px-4 py-2.5 text-sm text-muted">{formatDate(s.dispatchedAt)}</td>
                    <td className="px-4 py-2.5">
                      <Avatar name={s.createdBy?.name} size={22} />
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
        title="New sample"
        footer={
          <>
            <Button variant="ghost" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="primary"
              onClick={() =>
                createMut.mutate({
                  lead: form.lead,
                  productName: form.productName,
                  quantity: Number(form.quantity),
                  courier: form.courier || undefined,
                  awbNumber: form.awbNumber || undefined,
                  status: form.status,
                })
              }
              disabled={createMut.isPending || !form.lead || !form.productName}
            >
              {createMut.isPending ? 'Saving…' : 'Create sample'}
            </Button>
          </>
        }
      >
        <div className="space-y-3">
          <div>
            <Label>Lead *</Label>
            <Select value={form.lead} onChange={(e) => setForm({ ...form, lead: e.target.value })}>
              <option value="">Pick a lead…</option>
              {(leadsRes?.items || []).map((l) => (
                <option key={l._id} value={l._id}>
                  {l.companyName}
                </option>
              ))}
            </Select>
          </div>
          <div>
            <Label>Product *</Label>
            <Select
              value={form.productName}
              onChange={(e) => setForm({ ...form, productName: e.target.value })}
            >
              <option value="">Pick a product…</option>
              {(products?.items || []).map((p) => (
                <option key={p._id} value={p.name}>
                  {p.name}
                </option>
              ))}
            </Select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Quantity</Label>
              <Input
                type="number"
                value={form.quantity}
                onChange={(e) => setForm({ ...form, quantity: e.target.value })}
              />
            </div>
            <div>
              <Label>Status</Label>
              <Select
                value={form.status}
                onChange={(e) => setForm({ ...form, status: e.target.value })}
              >
                {Object.entries(STATUS_LABELS).map(([k, v]) => (
                  <option key={k} value={k}>
                    {v}
                  </option>
                ))}
              </Select>
            </div>
            <div>
              <Label>Courier</Label>
              <Input value={form.courier} onChange={(e) => setForm({ ...form, courier: e.target.value })} />
            </div>
            <div>
              <Label>AWB</Label>
              <Input
                value={form.awbNumber}
                onChange={(e) => setForm({ ...form, awbNumber: e.target.value })}
              />
            </div>
          </div>
        </div>
      </Modal>
    </div>
  );
}
