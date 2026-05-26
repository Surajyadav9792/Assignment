import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { X, Eye, EyeOff, Copy, ArrowRight } from 'lucide-react';
import { authApi } from '../../api/endpoints.js';
import { useAuthStore } from '../../store/authStore.js';
import { Logo } from '../../components/layout/Logo.jsx';
import { Button } from '../../components/primitives/Button.jsx';
import { Input, Label, FieldError } from '../../components/primitives/Input.jsx';

const schema = z.object({
  email: z.string().email('Enter a valid email'),
  password: z.string().min(6, 'Password too short'),
});

const CREDS = [
  { role: 'Admin', email: 'admin@forgeflow.com' },
  { role: 'Manager', email: 'manager@forgeflow.com' },
  { role: 'BDA · Ravi', email: 'ravi.bda@forgeflow.com' },
  { role: 'BDA · Priya', email: 'priya.bda@forgeflow.com' },
  { role: 'BDA · Arjun', email: 'arjun.bda@forgeflow.com' },
];

export function Login() {
  const nav = useNavigate();
  const [showPw, setShowPw] = useState(false);
  const [showCreds, setShowCreds] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [searchParams] = useSearchParams();
  const setAuth = useAuthStore((s) => s.setAuth);
  const user = useAuthStore((s) => s.user);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm({ resolver: zodResolver(schema), defaultValues: { email: '', password: '' } });

  useEffect(() => {
    if (user) nav('/dashboard');
    if (searchParams.get('expired')) toast.error('Session expired. Please log in again.');
  }, [user, nav, searchParams]);

  const onSubmit = async (data) => {
    setSubmitting(true);
    try {
      const res = await authApi.login(data);
      setAuth(res.user, res.token);
      toast.success(`Welcome back, ${res.user.name.split(' ')[0]}`);
      nav('/dashboard');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Login failed');
    } finally {
      setSubmitting(false);
    }
  };

  const useCred = (email) => {
    reset({ email, password: 'Demo@2026' }, { keepDefaultValues: false });
  };

  return (
    <div className="min-h-screen flex bg-bg text-text">
      {/* Left brand panel */}
      <div
        className="hidden md:flex flex-col justify-between flex-1 p-10 relative overflow-hidden"
        style={{
          background:
            'linear-gradient(180deg, #0E1116 0%, #0B0E13 100%)',
          borderRight: '1px solid var(--ff-border)',
        }}
      >
        <div className="relative z-10 flex items-center gap-2.5">
          <Logo size={32} />
          <div>
            <div className="text-text font-semibold text-lg tracking-tightish">ForgeFlow</div>
            <div className="text-xs text-subtle -mt-0.5">BDA Operations Suite</div>
          </div>
        </div>

        <div className="relative z-10 max-w-md">
          <h1 className="text-2xl font-semibold tracking-tightish leading-tight">
            Manufacturing sales,<br />refined.
          </h1>
          <p className="text-sm text-muted mt-3 leading-relaxed">
            Purpose-built for B2B manufacturing teams. RFQs, samples, quotes, and pipeline visibility — in one focused workspace.
          </p>

          <div className="mt-8 grid grid-cols-3 gap-3 text-xs">
            {[
              { v: '30+', l: 'Active deals' },
              { v: '₹ 18 Cr', l: 'In pipeline' },
              { v: '11', l: 'Pipeline stages' },
            ].map((m) => (
              <div key={m.l} className="ff-card p-3">
                <div className="ff-mono text-md text-text">{m.v}</div>
                <div className="text-subtle mt-0.5">{m.l}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="relative z-10 text-xs text-subtle">
          Built for manufacturers, by sales operators.
        </div>

        {/* Subtle grid background */}
        <div
          className="absolute inset-0 opacity-[0.08]"
          style={{
            backgroundImage:
              'linear-gradient(var(--ff-border) 1px, transparent 1px), linear-gradient(90deg, var(--ff-border) 1px, transparent 1px)',
            backgroundSize: '32px 32px',
          }}
        />
      </div>

      {/* Right form panel */}
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-sm">
          <div className="md:hidden flex items-center gap-2.5 mb-8">
            <Logo size={28} />
            <div className="font-semibold text-md">ForgeFlow</div>
          </div>

          <h2 className="text-xl font-semibold tracking-tightish">Sign in to your account</h2>
          <p className="text-sm text-muted mt-1">Enter your credentials to continue</p>

          <form onSubmit={handleSubmit(onSubmit)} className="mt-6 space-y-4">
            <div>
              <Label>Email</Label>
              <Input type="email" placeholder="you@company.com" {...register('email')} error={errors.email} />
              <FieldError>{errors.email?.message}</FieldError>
            </div>
            <div>
              <Label>Password</Label>
              <div className="relative">
                <Input
                  type={showPw ? 'text' : 'password'}
                  placeholder="••••••••"
                  {...register('password')}
                  error={errors.password}
                  className="pr-9"
                />
                <button
                  type="button"
                  onClick={() => setShowPw((v) => !v)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-subtle hover:text-text p-1"
                >
                  {showPw ? <EyeOff size={14} /> : <Eye size={14} />}
                </button>
              </div>
              <FieldError>{errors.password?.message}</FieldError>
            </div>

            <Button
              type="submit"
              variant="primary"
              size="lg"
              className="w-full"
              disabled={submitting}
              rightIcon={<ArrowRight size={16} />}
            >
              {submitting ? 'Signing in…' : 'Sign in'}
            </Button>
          </form>

          {showCreds && (
            <div className="mt-6 ff-card p-3.5">
              <div className="flex items-start justify-between gap-2 mb-2">
                <div>
                  <div className="text-xs text-text font-medium">Demo credentials</div>
                  <div className="text-[11px] text-muted mt-0.5">Click any role to autofill.</div>
                </div>
                <button
                  onClick={() => setShowCreds(false)}
                  className="text-subtle hover:text-text p-0.5"
                  aria-label="Dismiss"
                >
                  <X size={14} />
                </button>
              </div>
              <div className="space-y-1">
                {CREDS.map((c) => (
                  <button
                    key={c.email}
                    onClick={() => useCred(c.email)}
                    className="w-full text-left flex items-center justify-between px-2 py-1.5 rounded text-xs hover:bg-elev2 ff-transition group"
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-muted w-[90px]">{c.role}</span>
                      <span className="ff-mono text-text">{c.email}</span>
                    </div>
                    <Copy size={11} className="text-subtle opacity-0 group-hover:opacity-100 ff-transition" />
                  </button>
                ))}
              </div>
              <div className="mt-2 pt-2 border-t border-border text-[11px] text-muted">
                Password for all roles: <span className="ff-mono text-text">Demo@2026</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
