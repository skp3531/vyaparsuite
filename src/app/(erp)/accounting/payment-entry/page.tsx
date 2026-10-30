import { redirect } from 'next/navigation';

export default function PaymentEntryRedirect() {
  redirect('/accounting/payment-entries');
}
