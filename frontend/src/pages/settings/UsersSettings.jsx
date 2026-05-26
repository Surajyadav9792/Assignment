import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, UserX } from 'lucide-react';
import { toast } from 'sonner';
import { usersApi } from '../../api/endpoints.js';
import { PageHeader } from '../../components/layout/PageHeader.jsx';
import { Button } from '../../components/primitives/Button.jsx';
import { Badge } from '../../components/primitives/Badge.jsx';
import { Avatar } from '../../components/primitives/Avatar.jsx';
import { Modal } from '../../components/primitives/Modal.jsx';
import { Input, Select, Label } from '../../components/primitives/Input.jsx';
import { Skeleton } from '../../components/primitives/EmptyState.jsx';

export function UsersSettings() {
  const { data, isLoading } = useQuery({ queryKey: ['users'], queryFn: usersApi.list });
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', role: 'bda', password: 'Demo@2026' });

  const createMut = useMutation({
    mutationFn: (data) => usersApi.create(data),
    onSuccess: () => {
      toast.success('User created');
      qc.invalidateQueries({ queryKey: ['users'] });
      setOpen(false);
      setForm({ name: '', email: '', role: 'bda', password: 'Demo@2026' });
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Failed'),
  });

  const deactivateMut = useMutation({
    mutationFn: (id) => usersApi.deactivate(id),
    onSuccess: () => {
      toast.success('User deactivated');
      qc.invalidateQueries({ queryKey: ['users'] });
    },
  });

  return (
    <div>
      <PageHeader
        title="Users"
        subtitle="Manage team members and their access"
        actions={
          <Button variant="primary" leftIcon={<Plus size={14} />} onClick={() => setOpen(true)}>
            Invite user
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
                  <th className="px-4 py-2.5 font-medium">User</th>
                  <th className="px-4 py-2.5 font-medium">Role</th>
                  <th className="px-4 py-2.5 font-medium">Status</th>
                  <th className="px-4 py-2.5 font-medium w-32"></th>
                </tr>
              </thead>
              <tbody>
                {(data?.users || []).map((u) => (
                  <tr key={u._id} className="border-t border-border">
                    <td className="px-4 py-2.5">
                      <div className="flex items-center gap-3">
                        <Avatar name={u.name} size={32} />
                        <div>
                          <div className="text-sm text-text">{u.name}</div>
                          <div className="text-xs text-muted">{u.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-2.5">
                      <Badge variant={u.role === 'admin' ? 'accent' : u.role === 'manager' ? 'info' : 'default'}>
                        {u.role}
                      </Badge>
                    </td>
                    <td className="px-4 py-2.5">
                      <Badge variant={u.isActive ? 'success' : 'default'}>
                        {u.isActive ? 'Active' : 'Inactive'}
                      </Badge>
                    </td>
                    <td className="px-4 py-2.5">
                      {u.isActive && (
                        <Button
                          variant="ghost"
                          size="sm"
                          leftIcon={<UserX size={12} />}
                          onClick={() => deactivateMut.mutate(u._id)}
                        >
                          Deactivate
                        </Button>
                      )}
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
        title="Invite user"
        footer={
          <>
            <Button variant="ghost" onClick={() => setOpen(false)}>Cancel</Button>
            <Button
              variant="primary"
              onClick={() => createMut.mutate(form)}
              disabled={!form.name || !form.email || createMut.isPending}
            >
              Create user
            </Button>
          </>
        }
      >
        <div className="space-y-3">
          <div>
            <Label>Name</Label>
            <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          </div>
          <div>
            <Label>Email</Label>
            <Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
          </div>
          <div>
            <Label>Role</Label>
            <Select value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })}>
              <option value="bda">BDA</option>
              <option value="manager">Manager</option>
              <option value="admin">Admin</option>
            </Select>
          </div>
          <div>
            <Label>Password</Label>
            <Input value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
          </div>
        </div>
      </Modal>
    </div>
  );
}
