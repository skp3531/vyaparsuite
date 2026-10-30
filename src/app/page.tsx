import { redirect } from 'next/navigation';
import { getServerSession } from '@/modules/auth/services/session';

export const dynamic = 'force-dynamic';

export default async function RootPage() {
  const session = await getServerSession();

  if (session) {
    redirect('/dashboard');
  } else {
    redirect('/login');
  }
}
