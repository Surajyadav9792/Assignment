import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Phone, Mail, Users, StickyNote, Package, FileText } from 'lucide-react';
import { Modal } from '../primitives/Modal.jsx';
import { Button } from '../primitives/Button.jsx';
import { Input, Textarea, Select, Label } from '../primitives/Input.jsx';
import { leadsApi } from '../../api/endpoints.js';
import { cn } from '../../lib/cn.js';

const TYPES = [
  { value: 'call', label: 'Call', icon: Phone },
  { value: 'email', label: 'Email', icon: Mail },
  { value: 'meeting', label: 'Meeting', icon: Users },
  { value: 'note', label: 'Note', icon: StickyNote },
  { value: 'sample', label: 'Sample', icon: Package },
  { value: 'rfq', label: 'RFQ', icon: FileText },
];

export function ActivityLogger({ open, onClose, leadId }) {
  const [type, setType] = useState('call');
  const [outcome, setOutcome] = useState('Connected');
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [nextFollowUp, setNextFollowUp] = useState('');
  const qc = useQueryClient();

  const mut = useMutation({
    mutationFn: (data) => leadsApi.addActivity(leadId, data),
    onSuccess: () => {
      toast.success('Activity logged');
      qc.invalidateQueries({ queryKey: ['activities', leadId] });
      qc.invalidateQueries({ queryKey: ['lead', leadId] });
      qc.invalidateQueries({ queryKey: ['myDay'] });
      reset();
      onClose();
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Failed to log activity'),
  });

  const reset = () => {
    setType('call');
    setOutcome('Connected');
    setSubject('');
    setBody('');
    setNextFollowUp('');
  };

  const submit = () => {
    const payload = {
      type,
      body,
      subject: subject || undefined,
      occurredAt: new Date().toISOString(),
    };
    if (type === 'call') payload.outcome = outcome;
    if (nextFollowUp) payload.nextFollowUp = new Date(nextFollowUp).toISOString();
    mut.mutate(payload);
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Log activity"
      size="md"
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="primary" onClick={submit} disabled={mut.isPending}>
            {mut.isPending ? 'Saving…' : 'Save activity'}
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <div>
          <Label>Type</Label>
          <div className="grid grid-cols-3 gap-2">
            {TYPES.map((t) => {
              const Icon = t.icon;
              return (
                <button
                  key={t.value}
                  type="button"
                  onClick={() => setType(t.value)}
                  className={cn(
                    'flex items-center justify-center gap-1.5 h-9 rounded-md text-sm border ff-transition',
                    type === t.value
                      ? 'bg-accent-soft border-accent text-accent'
                      : 'bg-elev2 border-border text-muted hover:text-text'
                  )}
                >
                  <Icon size={14} />
                  {t.label}
                </button>
              );
            })}
          </div>
        </div>

        {type === 'call' && (
          <div>
            <Label>Outcome</Label>
            <div className="flex gap-2">
              {['Connected', 'Not Reached', 'Voicemail'].map((o) => (
                <button
                  key={o}
                  type="button"
                  onClick={() => setOutcome(o)}
                  className={cn(
                    'h-8 px-3 rounded-md text-sm border ff-transition',
                    outcome === o
                      ? 'bg-accent-soft border-accent text-accent'
                      : 'bg-elev2 border-border text-muted hover:text-text'
                  )}
                >
                  {o}
                </button>
              ))}
            </div>
          </div>
        )}

        {(type === 'email' || type === 'meeting' || type === 'rfq') && (
          <div>
            <Label>Subject</Label>
            <Input value={subject} onChange={(e) => setSubject(e.target.value)} />
          </div>
        )}

        <div>
          <Label>{type === 'note' ? 'Note' : 'Details'}</Label>
          <Textarea rows={4} value={body} onChange={(e) => setBody(e.target.value)} />
        </div>

        <div>
          <Label>Next follow-up (optional)</Label>
          <Input
            type="datetime-local"
            value={nextFollowUp}
            onChange={(e) => setNextFollowUp(e.target.value)}
          />
          <div className="text-[11px] text-muted mt-1">A task will be auto-created on this date.</div>
        </div>
      </div>
    </Modal>
  );
}
