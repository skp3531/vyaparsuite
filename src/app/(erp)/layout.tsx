import * as React from 'react';
import { redirect } from 'next/navigation';
import { getServerSession } from '@/modules/auth/services/session';
import { ERPShell } from '@/components/layout/erp-shell';
import { ThemeProvider } from '@/components/layout/theme-provider';

export const metadata = {
  title: {
    template: '%s | VyaparSuite ERP',
    default: 'VyaparSuite ERP — Multi-Entity Enterprise System',
  },
  description: 'Production-grade enterprise resource planning platform.',
};

export default async function ERPLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession();

  // Protect all ERP routes — redirect unauthenticated visitors to login
  if (!session) {
    redirect('/login');
  }

  return (
    <ThemeProvider>
      <ERPShell session={session}>
        {children}
      </ERPShell>
    </ThemeProvider>
  );
}
