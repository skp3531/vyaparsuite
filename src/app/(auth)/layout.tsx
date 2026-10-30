import * as React from 'react';
import Link from 'next/link';
import { ShieldCheck } from 'lucide-react';

export const metadata = {
  title: 'Sign In | VyaparSuite ERP',
  description: 'Secure enterprise authentication for VyaparSuite ERP Platform.',
};

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen w-full flex flex-col items-center justify-center p-4 sm:p-6 bg-slate-50 dark:bg-slate-950 font-sans antialiased text-slate-900 dark:text-slate-100 selection:bg-brand-500 selection:text-white">
      {/* Background Decorative Pattern */}
      <div className="fixed inset-0 pointer-events-none opacity-40 dark:opacity-20 bg-[radial-gradient(#cbd5e1_1px,transparent_1px)] [background-size:16px_16px]" />

      {/* Auth Card Container */}
      <div className="w-full max-w-md relative z-10 space-y-6">
        {/* Brand Header */}
        <div className="flex flex-col items-center text-center space-y-2">
          <Link href="/login" className="flex items-center gap-2.5 group">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-brand-600 to-indigo-600 text-white flex items-center justify-center font-black text-lg shadow-md group-hover:scale-105 transition-transform ring-2 ring-brand-500/20">
              VS
            </div>
            <div className="text-left">
              <span className="font-extrabold text-xl tracking-tight text-slate-900 dark:text-slate-100 flex items-center">
                <span>Vyapar</span>
                <span className="text-brand-600 dark:text-brand-400">Suite</span>
              </span>
              <p className="text-[10px] font-medium text-slate-500 uppercase tracking-wider">
                Enterprise Resource Planning
              </p>
            </div>
          </Link>
        </div>

        {/* Children (Login / Auth card) */}
        {children}

        {/* Trust & Compliance Badge */}
        <div className="flex flex-col items-center gap-2 text-center text-xs text-slate-500 dark:text-slate-400">
          <div className="flex items-center gap-1.5 font-medium">
            <ShieldCheck className="h-4 w-4 text-emerald-500" />
            <span>MCA Rule 3 Audit Trail & 256-Bit TLS Encryption</span>
          </div>
          <p className="text-[11px] text-slate-400">
            © {new Date().getFullYear()} VyaparSuite Technologies. All rights reserved.
          </p>
        </div>
      </div>
    </div>
  );
}
