import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { useQuery, useMutation } from '@tanstack/react-query';
import { toast } from 'sonner';
import { ArrowLeft, Save } from 'lucide-react';
import { leadsApi, settingsApi } from '../../api/endpoints.js';
import { PageHeader } from '../../components/layout/PageHeader.jsx';
import { Button } from '../../components/primitives/Button.jsx';
import { Input, Textarea, Select, Label, FieldError } from '../../components/primitives/Input.jsx';

export function LeadCreate() {
  const nav = useNavigate();
  const { data: sources } = useQuery({ queryKey: ['sources'], queryFn: settingsApi.sources.list });

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    defaultValues: {
      companyName: '',
      contactName: '',
      designation: '',
      email: '',
      phone: '',
      location: { city: '', state: '', country: 'India' },
      industryVertical: '',
      source: '',
      estimatedValue: 0,
      notes: '',
    },
  });

  const createMut = useMutation({
    mutationFn: (data) => leadsApi.create(data),
    onSuccess: (res) => {
      toast.success('Lead created');
      nav(`/leads/${res.lead._id}`);
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Failed to create lead'),
  });

  const onSubmit = (data) => {
    const payload = {
      ...data,
      estimatedValue: Number(data.estimatedValue) || 0,
      source: data.source || undefined,
    };
    if (!payload.email) delete payload.email;
    createMut.mutate(payload);
  };

  return (
    <div>
      <PageHeader
        title="New Lead"
        breadcrumb={
          <button onClick={() => nav('/leads')} className="hover:text-text inline-flex items-center gap-1">
            <ArrowLeft size={12} /> Back to leads
          </button>
        }
        actions={
          <>
            <Button variant="ghost" onClick={() => nav('/leads')}>
              Cancel
            </Button>
            <Button
              variant="primary"
              onClick={handleSubmit(onSubmit)}
              disabled={createMut.isPending}
              leftIcon={<Save size={14} />}
            >
              {createMut.isPending ? 'Saving…' : 'Save lead'}
            </Button>
          </>
        }
      />

      <div className="p-6 max-w-3xl">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <Section title="Company">
            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2">
                <Label>Company name *</Label>
                <Input {...register('companyName', { required: 'Required' })} error={errors.companyName} />
                <FieldError>{errors.companyName?.message}</FieldError>
              </div>
              <div>
                <Label>Industry vertical</Label>
                <Input {...register('industryVertical')} placeholder="e.g. Auto Components" />
              </div>
              <div>
                <Label>Source</Label>
                <Select {...register('source')}>
                  <option value="">Select source</option>
                  {(sources?.items || []).map((s) => (
                    <option key={s._id} value={s._id}>
                      {s.name}
                    </option>
                  ))}
                </Select>
              </div>
              <div>
                <Label>City</Label>
                <Input {...register('location.city')} />
              </div>
              <div>
                <Label>State</Label>
                <Input {...register('location.state')} />
              </div>
            </div>
          </Section>

          <Section title="Contact">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Contact name *</Label>
                <Input {...register('contactName', { required: 'Required' })} error={errors.contactName} />
                <FieldError>{errors.contactName?.message}</FieldError>
              </div>
              <div>
                <Label>Designation</Label>
                <Input {...register('designation')} placeholder="e.g. Procurement Head" />
              </div>
              <div>
                <Label>Email</Label>
                <Input type="email" {...register('email')} />
              </div>
              <div>
                <Label>Phone</Label>
                <Input {...register('phone')} placeholder="+91…" />
              </div>
            </div>
          </Section>

          <Section title="Opportunity">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Estimated value (₹)</Label>
                <Input type="number" {...register('estimatedValue')} placeholder="e.g. 250000" />
              </div>
              <div>
                <Label>Expected close date</Label>
                <Input type="date" {...register('expectedCloseDate')} />
              </div>
            </div>
          </Section>

          <Section title="Notes">
            <Textarea rows={4} {...register('notes')} placeholder="Anything important about this lead…" />
          </Section>
        </form>
      </div>
    </div>
  );
}

function Section({ title, children }) {
  return (
    <div className="ff-card p-5">
      <div className="ff-section-title mb-3">{title}</div>
      {children}
    </div>
  );
}
