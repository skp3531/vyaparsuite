import { redirect } from 'next/navigation';

export default function JournalEntryRedirect() {
  redirect('/accounting/journal-entries');
}
