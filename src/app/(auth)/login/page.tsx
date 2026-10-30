'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import {
  Mail,
  Lock,
  ArrowRight,
  Sparkles,
  AlertCircle,
  CheckCircle2,
  Building2,
  ShieldAlert,
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { loginAction, demoLoginAction } from '@/modules/auth/actions/auth-actions';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = React.useState('admin@vyaparsuite.com');
  const [password, setPassword] = React.useState('Admin@1234');
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [isDemoLoading, setIsDemoLoading] = React.useState(false);

  const demoAccounts = [
    {
      role: 'Admin',
      email: 'admin@vyaparsuite.com',
      password: 'Admin@1234',
      badge: 'Superuser',
    },
    {
      role: 'Finance Head',
      email: 'cfo@vyaparsuite.com',
      password: 'DemoPass@123',
      badge: 'CFO / Audit',
    },
    {
      role: 'Sales Lead',
      email: 'sales@vyaparsuite.com',
      password: 'DemoPass@123',
      badge: 'Sales Ops',
    },
  ];

  const handleFillDemo = (demoEmail: string, demoPass: string) => {
    setEmail(demoEmail);
    setPassword(demoPass);
    setErrorMessage(null);
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!email.trim() || !password.trim()) {
      setErrorMessage('Please provide both email and password.');
      return;
    }

    setIsSubmitting(true);
    try {
      const formData = new FormData();
      formData.set('email', email);
      formData.set('password', password);

      const res = await loginAction(formData);
      if (res && !res.success) {
        setErrorMessage(res.error || 'Invalid email or password.');
        setIsSubmitting(false);
      } else {
        router.push('/dashboard');
        router.refresh();
      }
    } catch (err) {
      setErrorMessage(
        err instanceof Error ? err.message : 'An error occurred during authentication.'
      );
      setIsSubmitting(false);
    }
  };

  const handleOneClickDemo = async () => {
    setIsDemoLoading(true);
    setErrorMessage(null);
    try {
      await demoLoginAction();
    } catch {
      // Next.js redirect might throw an expected redirect exception
    }
  };

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xl overflow-hidden animate-in-scale">
      {/* Card Header */}
      <div className="p-6 sm:p-8 pb-4 border-b border-slate-100 dark:border-slate-800">
        <h1 className="text-xl font-bold text-slate-900 dark:text-slate-100">
          Sign In to Workspace
        </h1>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
          Enter your company credentials to access books, inventory, and workflows.
        </p>

        {/* Demo Fast-Login Strip */}
        <div className="mt-4 p-3 rounded-xl bg-brand-50/70 dark:bg-brand-950/40 border border-brand-200/80 dark:border-brand-900/60">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold text-brand-900 dark:text-brand-200 flex items-center gap-1.5">
              <Sparkles className="h-3.5 w-3.5 text-brand-600 dark:text-brand-400" />
              <span>Demo Role Profiles</span>
            </span>
            <button
              type="button"
              onClick={handleOneClickDemo}
              disabled={isDemoLoading}
              className="text-[11px] font-semibold text-brand-600 hover:text-brand-700 dark:text-brand-400 hover:underline inline-flex items-center gap-1"
            >
              <span>{isDemoLoading ? 'Launching...' : '1-Click Launch →'}</span>
            </button>
          </div>

          <div className="grid grid-cols-3 gap-1.5">
            {demoAccounts.map((account) => (
              <button
                key={account.role}
                type="button"
                onClick={() => handleFillDemo(account.email, account.password)}
                className="p-1.5 rounded-lg bg-white dark:bg-slate-900 border border-brand-100 dark:border-slate-800 hover:border-brand-400 dark:hover:border-brand-500 text-left transition-all text-xs"
              >
                <div className="font-semibold text-slate-800 dark:text-slate-200 truncate text-[11px]">
                  {account.role}
                </div>
                <div className="text-[9px] text-slate-400 font-mono truncate">
                  {account.badge}
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Login Form */}
      <form onSubmit={handleSubmit} className="p-6 sm:p-8 pt-5 space-y-4">
        {errorMessage && (
          <div className="p-3 rounded-lg bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/60 text-xs text-red-600 dark:text-red-300 flex items-start gap-2 animate-in-fade">
            <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
            <div className="flex-1 font-medium">{errorMessage}</div>
          </div>
        )}

        <Input
          label="Work Email Address"
          type="email"
          required
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          prefix={<Mail className="h-4 w-4" />}
          placeholder="name@company.com"
        />

        <div className="space-y-1">
          <Input
            label="Password"
            type="password"
            required
            showPasswordToggle
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            prefix={<Lock className="h-4 w-4" />}
            placeholder="••••••••••••"
          />

          <div className="flex items-center justify-between pt-1 text-xs">
            <label className="flex items-center gap-1.5 text-slate-600 dark:text-slate-400 cursor-pointer select-none">
              <input
                type="checkbox"
                defaultChecked
                className="h-3.5 w-3.5 rounded border-slate-300 text-brand-600 focus:ring-brand-500"
              />
              <span>Keep me signed in</span>
            </label>

            <button
              type="button"
              onClick={() => alert('Please contact your System Administrator to reset your password.')}
              className="text-brand-600 dark:text-brand-400 hover:underline font-medium"
            >
              Forgot password?
            </button>
          </div>
        </div>

        <Button
          type="submit"
          fullWidth
          size="lg"
          isLoading={isSubmitting}
          loadingText="Authenticating..."
          rightIcon={<ArrowRight className="h-4 w-4" />}
          className="mt-2"
        >
          Sign In to Workspace
        </Button>
      </form>

      {/* Footer Support Info */}
      <div className="px-6 sm:px-8 py-3.5 border-t border-slate-100 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-950/50 flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400">
        <div className="flex items-center gap-1.5">
          <Building2 className="h-3.5 w-3.5 text-slate-400" />
          <span>Multi-tenant Isolation</span>
        </div>
        <span className="font-mono text-slate-400">v0.1.0</span>
      </div>
    </div>
  );
}
